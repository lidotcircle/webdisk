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
         UserMessageGetUserSettingsResponse,
         UserMessageShortTermTokenGenerateRequest,
         UserMessageShortTermTokenGenerateResponse,
         UserMessageShortTermTokenClearRequest} from '../common';
import { Router } from '@angular/router';
import { EventEmitter } from 'events';
import { assignTargetEnumProp, cons, CopySourceEnumProp, nextTick } from '../utils';
import { Observable, Subject } from 'rxjs';
import { SessionStorageService } from './session-storage.service';

const ShortTermTokenStore = "SHORT_TERM_TOKEN_STATE";

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
                private sessionstorage: SessionStorageService,
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
        try {
            const resp = await this.wschannel.send(req) as UserMessageLoginResponse;
            this.token = resp.um_msg.token;
            this.localstorage.set(CONS.Keys.LOGIN_TOKEN, this.token);
            nextTick(() => this._onLogin.next());
            return true;
        } catch {return false;}
    } //}

    async logout(): Promise<void> //{
    {
        if(this.token == null) return;

        let req = new UserMessage() as UserMessageLogoutRequest;
        req.um_type = UserMessageType.Logout;
        req.um_msg.token = this.token;
        this.token = null;
        nextTick(() => this._onLogout.next());

        try {
            await this.wschannel.send(req);
        } catch {}
    } //}

    async getUserinfo(): Promise<UserInfo> //{
    {
        if(this.token == null) return null;

        let req = new UserMessage() as UserMessageGetUserInfoRequest;
        req.um_type = UserMessageType.GetBasicUserInfo;
        req.um_msg.token = this.token;
        try {
            const resp = await this.wschannel.send(req) as UserMessageGetUserInfoResponse;
            return resp.um_msg;
        } catch {
            return null;
        }
    } //}

    // TODO
    async setUserinfo(info: UserInfo): Promise<boolean> {return false;}

    async changePassword(oldpass: string, newpass: string): Promise<boolean> //{
    {
        if(this.token == null) return false;

        let req = new UserMessage() as UserMessageChangePasswordRequest;
        req.um_type = UserMessageType.ChangePassword;
        req.um_msg.token = this.token;
        req.um_msg.oldpass = oldpass;
        req.um_msg.newpass = newpass;
        try {
            await this.wschannel.send(req);
            return true;
        } catch {
            return false;
        }
    } //}

    async addUser(username: string, password: string, invCode: string): Promise<boolean> //{
    {
        let req = new UserMessage() as UserMessageAddUserRequest;
        req.um_type = UserMessageType.AddUser;
        req.um_msg.username = username;
        req.um_msg.password = password;
        req.um_msg.invitationCode = invCode;

        try {
            await this.wschannel.send(req);
            return true;
        } catch {return false;}
    } //}

    async removeUser(username: string, password: string): Promise<boolean> //{
    {
        let req = new UserMessage() as UserMessageRemoveUserRequest;
        req.um_type = UserMessageType.RemoveUser;
        req.um_msg.username = username;
        req.um_msg.password = password;

        try {
            await this.wschannel.send(req);
        } catch {return false;}
    } //}

    async genInvCodes(n: number): Promise<boolean> //{
    {
        if(!this.token) return false;
        let req = new UserMessage() as UserMessageGenInvCodeRequest;
        req.um_type = UserMessageType.GenerateInvitationCode;
        req.um_msg.token = this.token;
        req.um_msg.n = n;

        try {
            await this.wschannel.send(req);
            return true;
        } catch {return false;}
    } //}

    async getInvCodes(): Promise<string[]> //{
    {
        if(!this.token) return null;

        let req = new UserMessage() as UserMessaageGetInvCodeRequest;
        req.um_type = UserMessageType.GetInvitationCode;
        req.um_msg.token = this.token;

        try { 
            const resp = await this.wschannel.send(req) as UserMessaageGetInvCodeResponse;
            return resp?.um_msg?.InvCodes;
        } catch {
            return null;
        }
    } //}

    async getUserSettings(): Promise<UserSettings> //{
    {
        if(this.token == null) return null;

        let req = new UserMessage() as UserMessageGetUserSettingsRequest;
        req.um_type = UserMessageType.GetUserSettings;
        req.um_msg.token = this.token;
        const resp = await this.wschannel.send(req) as UserMessageGetUserSettingsResponse;
        return resp.um_msg.userSettings;
    } //}

    async updateUserSettings(settings: UserSettings): Promise<void> //{
    {
        if(this.token == null) throw new Error("not login");

        let req = new UserMessage() as UserMessageUpdateUserSettingsRequest;
        req.um_type = UserMessageType.UpdateUserSettings;
        req.um_msg.token = this.token;
        let s = new UserSettings();
        assignTargetEnumProp(settings, s);
        req.um_msg.userSettings = s;
        await this.wschannel.send(req);
    } //}

    private shortTermToken: Token;
    private shortTermTokenStartPoint: number;
    async refreshShortTermToken(): Promise<Token> //{
    {
        console.assert(this.token != null);

        let req = new UserMessage() as UserMessageShortTermTokenGenerateRequest;
        req.um_type = UserMessageType.ShortTermTokenGenerate;
        req.um_msg.token = this.token;
        const resp = await this.wschannel.send(req) as UserMessageShortTermTokenGenerateResponse;
        this.shortTermToken = resp.um_msg.shortTermToken;
        this.shortTermTokenStartPoint = Date.now();
        this.sessionstorage.set(ShortTermTokenStore, {token: this.shortTermToken, start: this.shortTermTokenStartPoint});

        return this.shortTermToken;
    } //}
    async clearShortTermToken(): Promise<void> //{
    {
        console.assert(this.token != null);
        this.shortTermToken = null;
        this.shortTermTokenStartPoint = null;
        this.sessionstorage.remove(ShortTermTokenStore);

        let req = new UserMessage() as UserMessageShortTermTokenClearRequest;
        req.um_type = UserMessageType.ShortTermTokenClear;
        req.um_msg.token = this.token;
        await this.wschannel.send(req) as UserMessageShortTermTokenGenerateResponse;
    } //}
    async getShortTermToken(): Promise<Token> //{
    {
        console.assert(this.token != null);
        if (this.shortTermToken == null) {
            const ans = this.sessionstorage.get(ShortTermTokenStore, null);;
            if (!ans || (Date.now() - ans.start) > (cons.ShortTermTokenValidPeriod / 2)) {
                await this.refreshShortTermToken();
            } else {
                this.shortTermToken = ans.token;
                this.shortTermTokenStartPoint = ans.start;
            }
        }

        return this.shortTermToken;
    } //}
}

