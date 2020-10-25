import { Injectable } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { WSChannelService } from './wschannel.service';
import { CONS, Token, UserMessage, UserMessageLoginRequest, UserMessageLoginResponse, MessageType, UserMessageType, UserMessageLogoutRequest, UserInfo } from '../common';
import { Router } from '@angular/router';
import { EventEmitter } from 'events';

@Injectable({
    providedIn: 'root'
})
export class AccountManagerService {
    private token: Token;
    private changeCallbacks: {(): void}[] = [];

    constructor(private localstorage: LocalStorageService,
                private wschannel: WSChannelService,
                private router: Router) {
        let token = this.localstorage.get(CONS.Keys.LOGIN_TOKEN, null);
    }

    subscribe(func: {():void}) {
        this.changeCallbacks.push(func);
    }
    private onChange() {
        for(let f of this.changeCallbacks) {
            try {
                f();
            } catch(err) {}
        }
    }

    async login(username: string, password: string): Promise<boolean> {
        this.token = null;

        let req = new UserMessage() as UserMessageLoginRequest;
        req.um_type = UserMessageType.Login;
        req.um_msg.username = username;
        req.um_msg.password = password;
        const resp = await this.wschannel.send(req) as UserMessageLoginResponse;

        if(resp.error) {
            console.log("login fail: ", resp.error);
            return false;
        } else {
            this.token = resp.um_msg.token;
            this.localstorage.set(CONS.Keys.LOGIN_TOKEN, this.token);
            setTimeout(this.onChange, 0);
            return true;
        }
    }

    async logout(): Promise<void> {
        if(this.token == null) return;

        let req = new UserMessage() as UserMessageLogoutRequest;
        req.um_type = UserMessageType.Logout;
        req.um_msg.token = this.token;
        this.token = null;
        setTimeout(this.onChange, 0);

        await this.wschannel.send(req);
    }

    async getUserinfo(): Promise<UserInfo> {
        if(this.token == null) return null;
    }
}

