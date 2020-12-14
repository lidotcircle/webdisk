import { Injectable } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { WSChannelService } from './wschannel.service';
import { CONS, Token, UserMessage, UserMessageLoginRequest, UserMessageLoginResponse, 
         MessageType, UserMessageType, UserMessageLogoutRequest, UserInfo,
         UserMessageGetUserInfoRequest,
         UserMessageGetUserInfoResponse,
         UserMessageChangePasswordRequest,
         UserMessageAddUserRequest,
         BasicMessage,
         UserMessageRemoveUserRequest,
         UserMessaageGetInvCodeRequest,
         UserMessaageGetInvCodeResponse,
         UserMessageGenInvCodeRequest,
         UserSettings,
         UserMessageUpdateUserSettingsRequest,
         UserMessageGetUserSettingsRequest,
         UserMessageGetUserSettingsResponse} from '../common';
import { Router } from '@angular/router';
import { EventEmitter } from 'events';
import { assignTargetEnumProp, CopySourceEnumProp, nextTick } from '../utils';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AccountManagerService {
    private token: Token;
    private changeCallbacks: {(): void}[] = [];
    private _onLogin  = new Subject<void>();
    private _onLogout = new Subject<void>();
    get onLogin():  Observable<void> {return this._onLogin;}
    get onLogout(): Observable<void> {return this._onLogout;}

    constructor(private localstorage: LocalStorageService,
                private wschannel: WSChannelService,
                private router: Router) {
        this.token = this.localstorage.get(CONS.Keys.LOGIN_TOKEN, null);
    }
    get LoginToken(): Token {return this.token;}
    get isLogin(): boolean {return this.token != null;}

    async login(username: string, password: string): Promise<boolean> //{
    {
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
            nextTick(() => this._onLogin.next());
            return true;
        }
    } //}

    async logout(): Promise<void> //{
    {
        if(this.token == null) return;

        let req = new UserMessage() as UserMessageLogoutRequest;
        req.um_type = UserMessageType.Logout;
        req.um_msg.token = this.token;
        this.token = null;
        nextTick(() => this._onLogout.next());

        await this.wschannel.send(req);
    } //}

    async getUserinfo(): Promise<UserInfo> //{
    {
        if(this.token == null) return null;

        let req = new UserMessage() as UserMessageGetUserInfoRequest;
        req.um_type = UserMessageType.GetBasicUserInfo;
        req.um_msg.token = this.token;
        const resp = await this.wschannel.send(req) as UserMessageGetUserInfoResponse;
        if(resp.error || !resp.um_msg) {
            console.warn('get userinfo fail');
            return null;
        } else {
            return resp.um_msg;
        }
    } //}

    // TODO
    async setUserinfo(info: UserInfo): Promise<boolean> {return false;}

    private success(resp: BasicMessage): boolean //{
    {
        if(resp && resp.error) console.warn(resp.error);
        return !!resp && !resp.error;
    } //}

    async changePassword(oldpass: string, newpass: string): Promise<boolean> //{
    {
        if(this.token == null) return false;

        let req = new UserMessage() as UserMessageChangePasswordRequest;
        req.um_type = UserMessageType.ChangePassword;
        req.um_msg.token = this.token;
        req.um_msg.oldpass = oldpass;
        req.um_msg.newpass = newpass;
        const resp = await this.wschannel.send(req);

        return this.success(resp);
    } //}

    async addUser(username: string, password: string, invCode: string): Promise<boolean> //{
    {
        let req = new UserMessage() as UserMessageAddUserRequest;
        req.um_type = UserMessageType.AddUser;
        req.um_msg.username = username;
        req.um_msg.password = password;
        req.um_msg.invitationCode = invCode;

        const resp = await this.wschannel.send(req);
        return this.success(resp);
    } //}

    async removeUser(username: string, password: string): Promise<boolean> //{
    {
        let req = new UserMessage() as UserMessageRemoveUserRequest;
        req.um_type = UserMessageType.RemoveUser;
        req.um_msg.username = username;
        req.um_msg.password = password;

        const resp = await this.wschannel.send(req);
        return this.success(resp);
    } //}

    async genInvCodes(n: number): Promise<boolean> //{
    {
        if(!this.token) return false;
        let req = new UserMessage() as UserMessageGenInvCodeRequest;
        req.um_type = UserMessageType.GenerateInvitationCode;
        req.um_msg.token = this.token;
        req.um_msg.n = n;

        const resp = await this.wschannel.send(req);
        return this.success(resp);
    } //}

    async getInvCodes(): Promise<string[]> //{
    {
        if(!this.token) return null;

        let req = new UserMessage() as UserMessaageGetInvCodeRequest;
        req.um_type = UserMessageType.GetInvitationCode;
        req.um_msg.token = this.token;

        const resp = await this.wschannel.send(req) as UserMessaageGetInvCodeResponse;
        return resp?.um_msg?.InvCodes;
    } //}

    async getUserSettings(): Promise<UserSettings> //{
    {
        if(this.token == null) return null;

        let req = new UserMessage() as UserMessageGetUserSettingsRequest;
        req.um_type = UserMessageType.GetUserSettings;
        req.um_msg.token = this.token;
        const resp = await this.wschannel.send(req) as UserMessageGetUserSettingsResponse;

        if(resp.error || !resp.um_msg) {
            console.warn('get userinfo fail');
            return null;
        } else {
            return resp.um_msg.userSettings;
        }
    } //}

    async updateUserSettings(settings: UserSettings): Promise<boolean> //{
    {
        if(this.token == null) return false;

        let req = new UserMessage() as UserMessageUpdateUserSettingsRequest;
        req.um_type = UserMessageType.UpdateUserSettings;
        req.um_msg.token = this.token;
        let s = new UserSettings();
        assignTargetEnumProp(settings, s);
        req.um_msg.userSettings = s;
        const resp = await this.wschannel.send(req);

        return this.success(resp);
    } //}
}

