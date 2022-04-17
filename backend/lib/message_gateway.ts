/** Gataway to dispatch message base on message type */

import { EventEmitter } from 'events';

import { BasicMessage, MessageType } from './common/message/message';
import { debug, warn } from './../service';
import { MessageSerializer } from './services';
import * as utls from './utils';

import { connection as wsconnection, IMessage } from 'websocket';
import { AccessControl } from './accessControl/acl';
import { DIProperty } from './di';
import { MessageHandler } from './message_handler';
import { hasArrayBuffer } from './utils';

export interface MessageGateway {
    on(event: 'close', listener: () => void): this;
}

const MessageHandlers: Map<MessageType, MessageHandler> = new Map<MessageType, MessageHandler>();
function registerMessageHandler(msg_type: MessageType, handler: MessageHandler) {
    if(MessageHandlers.has(msg_type)) {
        throw new Error("double handler to a message type is prohibit");
    }
    MessageHandlers.set(msg_type, handler);
}

export class MessageGateway extends EventEmitter {
    private websocket: wsconnection;
    private invalid:   boolean;

    @DIProperty(AccessControl)
    private acl: AccessControl;

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
        this.websocket.on("close", (_: number, __: string) => {
            this.invalid = true;
            debug(`websocket closed`);
            this.emit('close');
        });
    } //}

    private send(msg: Buffer | string, cb?: (err: Error) => void) //{
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
                await this.acl.CheckMessage(message);
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

    public response(msg: BasicMessage, binary?: boolean): void //{
    {
        binary = binary != null ? binary : hasArrayBuffer(msg);
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

registerMessageHandler(MessageType.MiscManagement, require('./handlers/misc_management').default);
registerMessageHandler(MessageType.FileManagement, require('./handlers/file_management').default);

