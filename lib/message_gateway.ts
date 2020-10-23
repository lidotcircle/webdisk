/** Gataway to dispatch message base on message type */

import * as http from 'http';
import * as net from 'net';

import * as constants from './constants';
import * as xutils from './xutils';
import * as utls from './utils';

import { BasicMessage, MessageEncoder } from './common/message';

import { URL } from 'url';
import { debug, info, warn, error } from './logger';
import { WebsocketM, WebsocketOPCode } from './websocket';


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
} //}


export class MessageGateway {
    private websocket: WebsocketM;
    private invalid:   boolean;

    /**
     * @constructor
     * @param {net.Socket} socket upgrade http socket
     */
    constructor(socket: net.Socket) //{
    {
        socket.removeAllListeners();
        this.websocket = new WebsocketM(socket);
        this.invalid = false;

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
        let what;
        let xbuf: ArrayBuffer = null;
        if (typeof(msg) == 'string') {
            try {
                what = JSON.parse(msg as string);
            } catch (err) {
                return this.sendfail("", StatusCode.DENIED, err.message);
            }
        } else {
            try {
                [what, xbuf] = xutil.DecodePairs(msg);
            } catch (err) {
                return this.sendfail("", StatusCode.DENIED, err.message);
            }
        }
    } //}

    /**
     * response client with error
     * @param {string} id the request id
     * @param {StatusCode} code indicate error
     * @param {string} reason error message
     */
    private sendfail(id: string, code: StatusCode = StatusCode.FAIL, reason: string = null) //{
    {
        let sendM = {id: id, msg: reason ? {message: reason, code: code} : statusCodeToJSON(code), error: true};
        this.send(JSON.stringify(sendM, null, 1));
    } //}

    /**
     * response client with success
     * @param {string} id the request id
     * @param {StatusCode} code should be success
     * @param {any} data an object can be JSON.stringify
     */
    private sendsuccess(id: string, code: StatusCode = StatusCode.SUCCESS, data: any = null) //{
    {
        let sendM = {id: id, msg: data ? data : statusCodeToJSON(code), error: false};
        this.send(JSON.stringify(sendM, null, 1));
    } //}

    sendMessage(msg: BasicMessage, encoder: MessageEncoder) {
    }
}

