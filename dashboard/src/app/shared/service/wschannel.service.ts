import { Injectable } from '@angular/core';
import { BasicMessage, MessageJSON, MessageBIN, MessageType, CONS } from '../common';
import { MessageEncoderService } from './message-encoder.service';
import { nextTick } from '../utils';

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
    private pendding_list:   [number, BasicMessage, boolean, MSGCallback][];

    constructor(private encoder: MessageEncoderService) //{
    {
        this.connection      = null;
        this.waiter_list     = new Map();
        this.request_timeout = 3000;
        this.max_id          = 0;
        this.retry_base      = CONS.WS_RETRY_BASE;
        this.pendding_list   = [];
        this.setup_new_connection();
    } //}

    private __call_all_msg() //{
    {
        // assert(this.ready());
        const now = Date.now();
        while(this.pendding_list.length > 0) {
            const head = this.pendding_list.shift();
            const timeout = ((now - head[0]) > 1000 ? (now - head[0]) : 1000);
            (() => {
                let cb = head[3];
                this.send_ws(head[1], head[2], timeout).then(resp => cb(resp));
            })();
        }
    } //}

    private __invalid_msg() //{
    {
        const now = Date.now();
        while(this.pendding_list.length > 0) {
            const head = this.pendding_list[0];
            if((now - head[0]) >= this.request_timeout) {
                nextTick(() => {
                    const not_ready = new BasicMessage();
                    not_ready.error = "I'm not ready";
                    head[3](not_ready)
                });
                this.pendding_list.shift();
            } else {
                break;
            }
        }
    } //}

    private __send(msg: BasicMessage, json: boolean, cb: {(resp: BasicMessage): void}) //{
    {
        let id = this.max_id++;
        msg.messageId = id;
        if(!this.ready()) {
            this.pendding_list.push([Date.now(), msg, json, cb]);
            setTimeout(() => this.__invalid_msg(), this.request_timeout);
            return;
        } else {
            this.send_ws(msg, json, this.request_timeout).then(rs => cb(rs));
        }
    } //}

    private send_ws(msg: BasicMessage, json: boolean, timeout): Promise<BasicMessage> //{
    {
        let id = msg.messageId;
        return new Promise((resolve, reject) => {
            if(!(msg instanceof BasicMessage)) {
                reject(new Error('unexpected message object'));
                return;
            } else {
                let raw = this.encoder.encode(msg, json);
                const cb = (response: BasicMessage) => resolve(response);
                this.register_waiter(id, cb, timeout);
                this.connection.send(raw);
            }
        });
    } //}

    public send(msg: BasicMessage, json: boolean = true): Promise<BasicMessage> //{
    {
        return new Promise((resolve, _) => this.__send(msg, json, resolve));
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
        this.connection.onopen    = ()    => {
            this.retry_base = CONS.WS_RETRY_BASE;
            this.__call_all_msg();
        }
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
    private register_waiter(id: number, cb: MSGCallback, timeout: number) //{
    {
        this.waiter_list.set(id, cb);

        window.setTimeout(() => this.try_to_expire_waiter(id), 
                          timeout);
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

