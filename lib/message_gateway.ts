/** Gataway to dispatch message base on message type */

import * as http   from 'http';
import * as net    from 'net';
import * as events from 'events';

import { constants } from './constants';
import { BasicMessage, MessageEncoder, MessageType } from './common/message';
import { debug, info, warn, error } from './logger';
import { WebsocketM, WebsocketOPCode } from './websocket';
import { MessageSerializer, MessageHandlers, registerMessageHandler } from './services';
import { UserManager } from './handlers/user_management';
import * as utls from './utils';

import { URL } from 'url';
import { MiscManager } from './handlers/misc_management';
import { FileManager } from './handlers/file_management';


/**
 * a handler of upgrade event in http server, it will accept websocket connection,
 * paramters just like parameters of upgrade event
 */
export function upgradeHandler(inc: http.IncomingMessage, socket: net.Socket, buf: Buffer) //{
{
    let date = (new Date()).toUTCString();
    if (inc.url != "/ws") {
        socket.end(utls.simpleHttpResponse(404, {
            Server: constants.ServerName,
            Date: date,
            Connection: "close",
        }));
        return;
    }
    if (new URL(inc.headers["origin"] as string).host != inc.headers.host) {
        socket.end(utls.simpleHttpResponse(403, {
            Server: constants.ServerName,
            Date: date,
            Connection: "close",
        }));
        return;
    }
    if (inc.headers.connection.toLowerCase() != "upgrade" || inc.headers.upgrade.toLowerCase() != "websocket" ) {
        socket.end(utls.simpleHttpResponse(406, {
            Server: constants.ServerName,
            Date: date,
            Connection: "close",
        }));
        return;
    }
    let en_ws_key: string = inc.headers["sec-websocket-key"] as string;
    try {
        let ws_key = Buffer.from(en_ws_key || "", 'base64').toString('ascii');
        if(ws_key.length != 16)
            throw new Error("sec-websocket-key fault");
    } catch (err) {
        socket.end(utls.simpleHttpResponse(406, {
            Server: constants.ServerName,
            Date: date,
            Connection: "close",
        }));
        return;
    }
    if (parseInt(inc.headers["sec-websocket-version"] as string) != 13) {
        socket.end(utls.simpleHttpResponse(426, {
            Server: constants.ServerName,
            "Sec-WebSocket-Version": 13,
            Date: date,
            Connection: "close",
        }));
        return;
    }
    // Accept
    let response = utls.simpleHttpResponse(101, {
        Server: constants.ServerName,
        Date: date,
        Upgrade: "websocket",
        Connection: "Upgrade",
        "Sec-WebSocket-Accept": utls.WebSocketAcceptKey(en_ws_key)
    });
    socket.write(response);
    new MessageGateway(socket);
} //}


export class MessageGateway extends events.EventEmitter {
    private websocket: WebsocketM;
    private invalid:   boolean;

    /**
     * @constructor
     * @param {net.Socket} socket upgrade http socket
     */
    constructor(socket: net.Socket) //{
    {
        super();

        debug(`new websocket connection from ${socket.remoteAddress}:${socket.remotePort}`);
        socket.removeAllListeners();
        this.websocket = new WebsocketM(socket);
        this.invalid = false;
        const ping = () => {
            this.websocket.ping();
            if(!this.invalid) {
                setTimeout(ping, 5000);
            }
        }
        ping();

        this.websocket.on("message", this.onmessage.bind(this));
        this.websocket.on("error", (err: Error) => {
            if (this.invalid) return;
            this.invalid = true;
            debug(`websocket throw exception: ${err}, ${this.invalid}`);
            this.websocket.close(1004);
        });
        this.websocket.on("timeout", () => {
            this.invalid = true;
            debug(`websocket timeout`);
        });
        this.websocket.on("close", (clean: boolean) => {
            debug(`websocket closed, clean ? ${clean}`);
            this.emit('close');
        });
        this.websocket.on("end", () => {
            this.websocket.close();
        });
    } //}

    private send(msg, cb?: (err: Error) => void) //{
    {
        if(this.invalid) return;
        this.websocket.send(msg, cb);
    } //}

    /** message dispatcher, dispatch message base on message type */
    private onmessage(msg: Buffer | string) //{
    {
        if(this.invalid) return;
        let message: BasicMessage;

        if (typeof(msg) == 'string') {
            try {
                message = MessageSerializer.JSONSerializer.decode(msg);
            } catch (err) {
                warn('recieve a bad message ', err);
            }
        } else {
            try {
                message = MessageSerializer.BINSerializer.decode(utls.BuffertoArrayBuffer(msg));
            } catch (err) {
                warn('recieve a bad message ', err);
            }
        }

        if(message == null) {
            warn('recieve a bad message which doesn\'t meet requirement of basic message, ignore it');
        } else {
            if(!MessageHandlers.has(message.messageType)) {
                warn('get a message without handler, ignore it');
            } else {
                const handler = MessageHandlers.get(message.messageType);
                handler.handleRequest(this, message);
            }
        }
    } //}

    public response(msg: BasicMessage, binary: boolean = false): void //{
    {
        if(binary) {
            this.send(utls.ArrayBuffertoBuffer(MessageSerializer.BINSerializer.encode(msg)));
        } else {
            this.send(MessageSerializer.JSONSerializer.encode(msg));
        }
    } //}
}

registerMessageHandler(MessageType.UserManagement, UserManager);
registerMessageHandler(MessageType.MiscManagement, MiscManager);
registerMessageHandler(MessageType.FileManagement, FileManager);

