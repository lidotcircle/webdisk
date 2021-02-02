/** Gataway to dispatch message base on message type */

import * as http   from 'http';
import * as net    from 'net';
import * as events from 'events';

import { constants } from './constants';
import { BasicMessage, MessageEncoder, MessageType } from './common/message/message';
import { debug, info, warn, error } from './logger';
import { MessageSerializer, MessageHandlers, registerMessageHandler, service } from './services';
import { UserManager } from './handlers/user_management';
import * as utls from './utils';

import { URL } from 'url';
import { MiscManager } from './handlers/misc_management';
import { FileManager } from './handlers/file_management';
import { cons } from './utils';
import { request as wsrequest, connection as wsconnection, IMessage, IServerConfig } from 'websocket';

export function upgradeHandler(inc: http.IncomingMessage, socket: net.Socket, buf: Buffer) //{
{
    const wsreq = new wsrequest(socket, inc, {
        httpServer: null, 
        assembleFragments: true, 
        keepalive: true,
        keepaliveInterval: 3000
    });
    try {
        wsreq.readHandshake();
    } catch {
        return wsreq.reject(400);
    }
    const connection = wsreq.accept();
    new MessageGateway(connection);
} //}

export interface MessageGateway {
    on(event: 'close', listener: () => void): this;
}

export class MessageGateway extends events.EventEmitter {
    private websocket: wsconnection;
    private invalid:   boolean;

    constructor(ws: wsconnection) //{
    {
        super();
        this.websocket = ws;

        debug(`recieve ws connection from ${this.websocket.remoteAddress}`);
        this.websocket.on("message", this.onmessage.bind(this));
        this.websocket.on("error", (err: Error) => {
            this.invalid = true;
            debug(`websocket throw error: ${err}`);
        });
        this.websocket.on("close", (code: number, desc: string) => {
            this.invalid = true;
            debug(`websocket closed`);
            this.emit('close');
        });
    } //}

    private send(msg, cb?: (err: Error) => void) //{
    {
        if(this.invalid) return;
        this.websocket.send(msg, cb);
    } //}

    private onmessage(msg: IMessage) //{
    {
        if(this.invalid) return;
        let message: BasicMessage;

        if (msg.type == 'utf8') {
            try {
                message = MessageSerializer.JSONSerializer.decode(msg.utf8Data);
            } catch (err) {
                warn('recieve a bad message ', err);
            }
        } else {
            try {
                message = MessageSerializer.BINSerializer.decode(utls.BuffertoArrayBuffer(msg.binaryData));
            } catch (err) {
                warn('recieve a bad message ', err);
            }
        }

        if(message == null) {
            warn('recieve a bad message which doesn\'t meet requirement of basic message, ignore it');
        } else {
            this.dispatch(message);
        }
    } //}

    private async dispatch(message: BasicMessage) //{
    {
        if(!MessageHandlers.has(message.messageType)) {
            warn('get a message without handler, ignore it');
        } else {
            try {
                await service.acl.CheckMessage(message);
            } catch (err) {
                console.error('Access Denied:', err);
                const msg = new BasicMessage();
                msg.error = err;
                msg.messageAck = message.messageId;
                this.response(msg);
                return;
            }

            const handler = MessageHandlers.get(message.messageType);
            await handler.handleRequest(this, message);
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

    public notify(msg: BasicMessage) //{
    {
        this.response(msg);
    } //}
}

registerMessageHandler(MessageType.UserManagement, UserManager);
registerMessageHandler(MessageType.MiscManagement, MiscManager);
registerMessageHandler(MessageType.FileManagement, FileManager);

