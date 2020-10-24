import { Injectable } from '@angular/core';
import { BasicMessage, MessageJSON, MessageBIN, MessageType, CONS } from '../common';
import { MessageEncoderService } from './message-encoder.service';

type MSGCallback = (response: BasicMessage) => void;

@Injectable({
    providedIn: 'root'
})
export class WSChannelService {
    private connection:      WebSocket;
    private waiter_list:     Map<number, MSGCallback>;
    private request_timeout: number;
    private max_id:          number;
    private retry_base:      number;

    constructor(private encoder: MessageEncoderService) //{
    {
        this.connection      = null;
        this.waiter_list     = new Map();
        this.request_timeout = 3000;
        this.max_id          = 0;
        this.retry_base      = CONS.WS_RETRY_BASE;
    } //}

    async send(msg: BasicMessage, json: boolean = true): Promise<BasicMessage> //{
    {
        let id = this.max_id++;
        msg.messageId = id;
        if(!this.ready()) {
            const doestReady = new BasicMessage();
            doestReady.error = "I'm not ready";
            doestReady.messageAck = id;
            return doestReady;
        }

        return new Promise((resolve, reject) => {
            if(!(msg instanceof BasicMessage)) {
                reject(new Error('unexpected message object'));
                return;
            } else {
                let raw = this.encoder.encode(msg, json);
                const cb = (response: BasicMessage) => resolve(response);
                this.register_waiter(id, cb);
                this.connection.send(raw);
            }
        });
    } //}

    private reconnect() {
        setTimeout(() => this.setup_new_connection(), this.retry_base);
        this.retry_base *= 2;
    }

    private setup_new_connection() //{
    {
        if(this.connection) {
            this.connection.close();
            this.connection = null;
        }
        this.connection = new WebSocket(CONS.wsurl);
        this.connection.onmessage = (msg) => this.onmessage(msg);
        this.connection.onclose   = ()    => this.reconnect();
        this.connection.onerror   = (err) => console.warn(err);
        this.connection.onopen    = ()    => this.retry_base = CONS.WS_RETRY_BASE;
    } //}

    private try_to_expire_waiter(id: number) //{
    {
        let cb = this.waiter_list.get(id);
        if(cb != null) {
            const request_timeout = new BasicMessage();
            request_timeout.messageAck = id;
            request_timeout.error = 'request timeout';
            request_timeout.messageType = MessageType.Uninit;
            this.waiter_list.delete(id);
            cb(request_timeout);
        }

    } //}
    private register_waiter(id: number, cb: MSGCallback) //{
    {
        this.waiter_list.set(id, cb);

        window.setTimeout(() => this.try_to_expire_waiter(id), 
                          this.request_timeout);
    } //}

    private ready(): boolean {return this.connection && (this.connection.readyState == WebSocket.OPEN);}

    private onmessage(msge: MessageEvent): void //{
    {
        let data = msge.data;
        let msg: BasicMessage;
        try {
            msg = this.encoder.decode(data);
        } catch (err) {
            console.warn('recieve a bad message, ignore it');
            return;
        }

        if(!(this.waiter_list.has(msg.messageAck))) {
            console.warn('recieve a valid message, but the reciever has leaves, ignore');
            return;
        }

        let cb = this.waiter_list.get(msg.messageAck);
        this.waiter_list.delete(msg.messageAck);
        cb(msg);
    } //}
}

