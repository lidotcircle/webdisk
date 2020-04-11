import * as event from 'events';
import * as net from 'net';
import * as stream from 'stream';
import * as util from 'util';
import * as proc from 'process';

import { debug } from './util';

let bigIntSupport = true;
try { BigInt(0); } catch (e) {bigIntSupport = false;}

/** websocket operation code */
export enum WebsocketOPCode {
    Continue = 0,
    Text,
    Binary,
    Close = 8,
    Ping,
    Pong
}

/** status of a websocket connection */
enum WebsocketState {
    CONNECTING,    // in this implementation, it's impossible, because this implementation don't support handshake
    OPEN,          // websocket connection has established
    CLOSING,       // one of the endpoints has send close frame
    TIME_WAIT,     // sever send FIN tcp package
    CLOSED,        // underlying tcp connection has closed
}

/**
 * Server should never send a masked message
 * For simplicity, doesn't support fragmentation and extensions, so FIN bit always sets
 * @param {boolean} options.fin indicate the final frame or first frame
 * @param {number}  options.opcode what operation should do
 * @param {number}  options.payload_len payload length
 * @returns {void}
 */
// function formWsheader(options) //{
function formWsHeader(options: {
    opcode: WebsocketOPCode,
    payload_len: number
}): Buffer
{
    options = {
        ...options
    };
    if (options.opcode >= 16 || options.opcode < 0)
        throw new Error("argument error");
    let bufsize: number = 2; // 16bits
    let len_case: number;
    if (options.payload_len >= 2 ** 16) { // 7 + 64 bits
        bufsize += 8;
        len_case = 3;
    } else if (options.payload_len >= 126) { // 7 + 16 bits
        bufsize += 2;
        len_case = 2;
    } else { // 7 bits
        len_case = 1;
    }
    let bytebuf = new ArrayBuffer(bufsize);
    let viewa: Uint8Array = new Uint8Array(bytebuf);
    viewa[0] = options.opcode | 0x80;
    switch (len_case) {
        case 1:
            viewa[1] = options.payload_len;
            break;
        case 2:
            viewa[1] = 126;
            let viewb: DataView = new DataView(bytebuf);
            viewb.setUint16(2, options.payload_len, false);
            break;
        case 3:
            viewa[1] = 127;
            let viewc: DataView = new DataView(bytebuf);
            // node v8 doesn't support BigInt() FIXME
            if (bigIntSupport) {
                viewc.setBigUint64(2, BigInt(options.payload_len), false); // network byte order, big-endian
            } else {
                viewc.setUint32(2, 0, false);
                viewc.setUint32(6, options.payload_len, false);
            }
            break;
    }
    return Buffer.from(bytebuf);
} //}


/** Only useful to indicate a buffer just begin of complete websocket frame */
class FrameNotComplete {}

/**
 * Doesn't support integer great than 2**51 - 2, namely BitInt type
 * @param   {Buffer} buffer is recieved from tcp socket
 * @returns {[boolean, number, Buffer, Buffer]} [FIN, opcode, message, remained_buffer] buffers that return from this function 
 *                                              references same memory location of origin buffer
 * @exception {Error} when throwing an Error, mean message is broken, and the sever shold abort connection
 * @exception {FrameNotComplete} when frame isn't complete, throw an FrameNotComplete. 
 */                                       
function extractFromFrame(buffer: Buffer): [boolean, WebsocketOPCode, Buffer, Buffer] //{
{
    if (buffer.length < 2) throw new FrameNotComplete();
    let FIN: boolean = (buffer.readUInt8(0) & 0x80) == 0x80;
    let opcode: number = (buffer.readUInt8(0) & 0x7f);
    if (!FIN && (opcode & 0x08) != 0)
        throw new Error("control frame can't be fragmented");
    if ((buffer.readUInt8(0) & 0x70) != 0) {
        throw new Error("broken frame");
    }
    let Masked: boolean = (buffer.readUInt8(1) & 0x80) == 0x80;
    let payloadOffset: number = 2;
    let len: number = buffer.readUInt8(1) & 0x7f;
    if (len == 126) {
        if (buffer.length < (2 + 2 + 126)) throw new FrameNotComplete();
        payloadOffset += 2;
        len = buffer.readUInt16BE(2);
    } else if(len == 127) {
        if (buffer.length < (2 + 8 + 2 ** 16)) throw new FrameNotComplete();
        payloadOffset += 8;
        if (bigIntSupport) {
            len = Number(buffer.readBigUInt64BE(2));
        } else {
            let l1 = buffer.readUInt32BE(2); // FIXME to support 52bits number
            if (l1 != 0) {
                throw new Error("number out of range");
            }
            len = buffer.readUInt32BE(4);
        }
    }
    let mask: Uint8Array = null;
    if (buffer.length < (payloadOffset + len + (Masked ? 4 : 0))) throw new FrameNotComplete();;
    if (Masked) {
        mask = new Uint8Array(4);
        mask[0] = buffer.readUInt8(payloadOffset);
        mask[1] = buffer.readUInt8(payloadOffset + 1);
        mask[2] = buffer.readUInt8(payloadOffset + 2);
        mask[3] = buffer.readUInt8(payloadOffset + 3);
        payloadOffset += 4;
        for (let i = payloadOffset; i < len + payloadOffset; i++) {
            let j = (i - payloadOffset) % 4;
            buffer.writeUInt8(buffer.readUInt8(i) ^ mask[j], i);
        }
    }
    return [FIN, opcode, buffer.slice(payloadOffset, payloadOffset + len), buffer.slice(payloadOffset + len)];
} //}

/**
 * @param {Buffer} buffer is recieved from tcp socket
 * @return {[boolean[], WebsocketOPCode[], Buffer[], Buffer]}
 * @exception {Error} when throwing an Error, mean message is broken, and the sever shold abort connection
 */
function extractFromFrameMulti(buffer: Buffer): [boolean[], WebsocketOPCode[], Buffer[], Buffer] //{
{
    let fins: boolean[] = [];
    let opcodes: WebsocketOPCode[] = [];
    let buffers: Buffer[] = [];
    let remain: Buffer = buffer;
    while (remain.length >= 2) {
        try {
            let [x, a, b, c] = extractFromFrame(remain);
            fins.push(x);
            opcodes.push(a);
            buffers.push(b);
            remain = c;
        } catch (err){
            if(err instanceof FrameNotComplete)
                break;
            else
                throw err;
        }
    }
    return [fins, opcodes ,buffers, remain];
}//}


/**
 * A partial implementation of websocket in server.
 * Doesn't support send fragmented message
 * @class WebsoketM
 *
 * @event message 
 *     @fires when recieve a message
 *     @param (msg: Buffer | string)
 * @event frame
 *     @fires recieve a frame
 *     @param (fra: Buffer | string, opcode: WebsocketOpcode, FIN: boolean) 
 * @event error
 *     @fires something wrong has happend, underlying socket error and websocket header error
 *     @param (err: Error)
 * @event ping
 *     @fires recieve ping, the default action is send back a pong
 *     @param (msg: Buffer | string)
 * @event pong 
 *     @fires recieve pong
 *     @pong (msg: Buffer | string)
 * @event drain
 *     @fires underlying tcp connection report a drain event
 *     @param ()
 * @event end
 *     @fires other endpoint send close frame
 *     @param (statusCode: number, reason: Buffer)
 * @event timeout
 *     @fires when underlying tcp connection timeout
 * @event close
 *     @fires underlying tcp socket is closed
 *     @param (clean: boolean) indicates whether websocket is closed cleanly
 */
export class WebsocketM extends event.EventEmitter {
    private underlyingsocket: net.Socket;
    private partialframe:   Buffer;
    private framedata: Buffer;
    private framedata_binary: boolean;
    private recieve_close: boolean;
    private state: WebsocketState;
    private clean_close: boolean;

    /**
     * @constructor
     * @param {net.Socket} socket underlying socket
    */
    constructor(socket: net.Socket) //{
    {
        super();
        this.underlyingsocket = socket;
        this.partialframe   = null;
        this.framedata = null;
        this.recieve_close = false;
        this.state = WebsocketState.OPEN;
        this.clean_close = false;
        this.framedata_binary = null;

        this.underlyingsocket.on("data", this.ondata.bind(this));
        this.underlyingsocket.on("error", this.onerror.bind(this));
        this.underlyingsocket.on("end", this.onend.bind(this));
        this.underlyingsocket.on("close", this.onclose.bind(this));
        this.underlyingsocket.on("timeout", this.ontimeout.bind(this));

        this.on("ping", this.pong);
    } //}

    /** listener of #data event of underlying socket*/
    private ondata(data: Buffer) //{
    {
        let buf: Buffer;
        if(this.partialframe != null)
            buf = Buffer.concat([this.partialframe, data]);
        else
            buf = data;
        let fins: boolean[], opcs: WebsocketOPCode[], msgs: Buffer[], remain: Buffer;
        try {
            [fins, opcs, msgs, remain] = extractFromFrameMulti(buf);
        } catch (err) {
            this.emit("error", err);
            return;
        }
        if (remain.length != 0)
            this.partialframe = remain;
        for(let i = 0; i < msgs.length; i++) {
            let fin = fins.pop();
            let opc = opcs.pop();
            let msg = msgs.pop();
            debug(JSON.stringify({
                opc: opc,
                fin: fin,
                msglen: msg.length,
                msg: msg.toString()
            }, null, 1));
            switch(opc) {
                case WebsocketOPCode.Binary:
                case WebsocketOPCode.Text:    // control frame can't be fragmented
                    if (this.framedata != null) {
                        if (opc != (this.framedata_binary ? WebsocketOPCode.Binary : WebsocketOPCode.Text)) {
                            this.emit("error", new Error("unexcept frame"));
                            return;
                        }
                    }
                    if (this.framedata != null)
                        this.framedata = Buffer.concat([this.framedata, msg]);
                    else
                        this.framedata = Buffer.from(msg);
                    this.emit("frame", fin, msg, opc);
                    if (fin) {
                        let mmm: Buffer | string;
                        if (opc == WebsocketOPCode.Text)
                            mmm = this.framedata.toString("utf8");
                        else
                            mmm = this.framedata;
                        this.emit("message", mmm);
                        this.framedata = null;
                    }
                    break;
                case WebsocketOPCode.Close:
                    if(this.recieve_close) {
                        this.emit("error", new Error("double close from client"));
                        return;
                    }
                    this.recieve_close = true;
                    if (this.state == WebsocketState.CLOSING) {
                        this.state = WebsocketState.TIME_WAIT;
                        proc.nextTick(() => {
                            this.underlyingsocket.end();
                        });
                    } else {
                        this.state = WebsocketState.CLOSING;
                    }
                    let statusCode: number = null;
                    let reason: Buffer = null;
                    if (msg.length > 0) {
                        statusCode = msg.readInt16BE(0);
                        if (msg.length > 2) {
                            if (msg.length == 3) return this.emit("error", new Error("frame format error"));
                            let reason_length = msg.readInt16BE(2);
                            if (msg.length != 4 + reason_length) 
                                return this.emit("error", new Error("frame format error"));
                            let reason = msg.slice(4, 0);
                        }
                    }
                    this.emit("end", statusCode, reason);
                    break;
                case WebsocketOPCode.Ping:
                    this.emit("ping", msg);
                    break;
                case WebsocketOPCode.Pong:
                    this.emit("pong", msg);
                    break;
                default:
                    this.emit("reserved", msg, opc, fin);
                    break;
            }
        }
    } //}
    private onerror(err: Error) //{
    {
        this.emit("error", err);
    } //}
    private onclose() {
        this.emit("close", this.clean_close);
    }
    private onend() {
        switch (this.state) {
            case WebsocketState.CONNECTING:
            case WebsocketState.OPEN:
            case WebsocketState.CLOSING:
                this.underlyingsocket.end(); // _uncleanly_ close
                break;
            case WebsocketState.TIME_WAIT:
                this.clean_close = true;
                this.state = WebsocketState.CLOSED;
                return;
            case WebsocketState.CLOSED:
                // log
                return;
        }
    }
    private ontimeout() {
        this.state = WebsocketState.CLOSED;
        this.emit("timeout");
    }
    private ondrain() {
        this.emit("drain");
    }

    /**
     * send message to client
     * @param  {string | Buffer} message if message is string type, it will be encoded with utf8 then send to client
     * @param  {callback} cb called when action finished
     * @return {boolean} indicates whether internal buffer of underlying socket is full
     */
    send(message: string | Buffer, cb?: (err: Error) => void): boolean //{
    {
        if (this.state >= WebsocketState.TIME_WAIT) {
            this.emit("error", new Error("connection at error state to send message"));
            return false;
        }
        let buf: Buffer;
        let binary: boolean;
        if(util.isString(message)) {
            buf = Buffer.from(message, "utf8");
            binary = false;
        } else  {
            buf = message;
            binary = true;
        }
        let header: Buffer = formWsHeader({
            payload_len: buf ? buf.length : 0,
            opcode: binary ? WebsocketOPCode.Binary : WebsocketOPCode.Text
        });
        let sendmsg: Buffer = Buffer.concat([header, buf]);
        return this.underlyingsocket.write(sendmsg, (err) => {
            if(cb != null) cb(err);
        });
    } //}

    ping(msg?: Buffer | string): boolean //{
    {
        if (this.state >= WebsocketState.TIME_WAIT) {
            this.emit("error", new Error("connection at error state to send message"));
            return false;
        }
        let _msg: Buffer = null;
        if (msg != null) {
            if (util.isString(msg))
                _msg = Buffer.from(msg, "utf8");
            else
                _msg = msg;
        }
        let header: Buffer = formWsHeader({
            payload_len: _msg ? _msg.length : 0,
            opcode: WebsocketOPCode.Ping
        });
        return this.underlyingsocket.write(_msg ? Buffer.concat([header, _msg]) : header);
    } //}

    pong(msg?: Buffer | string): boolean //{
    {
        if (this.state >= WebsocketState.TIME_WAIT) {
            this.emit("error", new Error("connection at error state to send message"));
            return false;
        }
        let _msg: Buffer = null;
        if (msg != null) {
            if (util.isString(msg))
                _msg = Buffer.from(msg, "utf8");
            else
                _msg = msg;
        }
        let header: Buffer = formWsHeader({
            payload_len: _msg ? _msg.length : 0,
            opcode: WebsocketOPCode.Pong
        });
        return this.underlyingsocket.write(_msg ? Buffer.concat([header, _msg]) : header);
    } //}

    private __clean_close() //{
    {
        if (this.recieve_close) {
            proc.nextTick(() => {
                this.state = WebsocketState.TIME_WAIT;
                this.underlyingsocket.end(); // _cleanly_ close
            });
        } else {
            proc.nextTick(() => {
                this.state = WebsocketState.CLOSING;
            });
        }
    } //}

    /**
     * @param {number} statusCode 1000 for normal closure
     * @param {Buffer | string} reason why close websocket connection
     */
    close(statusCode?: number, reason?: Buffer | string): void //{
    {
        this.__clean_close();
        if (reason != null && statusCode == null) this.emit("error", new Error("argument error"));
        let msg: Buffer = null;
        let msg_len: number = 0;
        let reason_x: Buffer = null;
        if (statusCode != null) msg_len += 2;
        if (reason != null) {
            if(util.isString(reason))
                reason_x = Buffer.from(reason, "utf8");
            else
                reason_x = reason;
            msg_len += reason_x.length;
        }
        if (msg_len != 0) {
            msg = Buffer.alloc(msg_len);
            msg.writeInt16BE(statusCode, 0);
            if (reason_x != null)
                reason_x.copy(msg, 2, 0);
        }
        let header: Buffer = formWsHeader({
            payload_len: msg ? msg.length : 0,
            opcode: WebsocketOPCode.Close
        });
        this.underlyingsocket.write(msg != null ? Buffer.concat([header, msg]) : header);
    } //}
} //}
