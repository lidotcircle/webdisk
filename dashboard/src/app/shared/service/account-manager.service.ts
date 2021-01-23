import { Injectable } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { WSChannelService } from './wschannel.service';
import {
    CONS, Token, UserMessage, UserMessageLoginRequest, UserMessageLoginResponse,
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
    UserMessageShortTermTokenClearRequest,
    NameEntry,
    UserMessageNewNameEntryRequest,
    UserMessageGetNameEntryRequest,
    UserMessageGetNameEntryResponse,
    UserMessageGetAllNameEntryRequest,
    UserMessageGetAllNameEntryResponse,
    UserMessageDeleteNameEntryRequest,
    UserMessageDeleteAllNameEntryRequest
} from '../common';
import { Router } from '@angular/router';
import { EventEmitter } from 'events';
import { assignTargetEnumProp, cons, CopySourceEnumProp, nextTick, toInstanceOfType } from '../utils';
import { Observable, Subject } from 'rxjs';
import { SessionStorageService } from './session-storage.service';
import { AsyncKVStorage } from './AsyncKVStorage';

const ShortTermTokenStore = "SHORT_TERM_TOKEN_STATE";

function AsyncMethodTokenNotNull(assert: boolean = true, returnAns?: any) {
    return function(target: AccountManagerService, propertyName: string, descriptor: PropertyDescriptor) {
        const originFunction: Function = descriptor.value;
        descriptor.value = async function(...args) {
            if (this.LoginToken == null) {
                if (assert) {
                    console.assert(this.LoginToken != null);
                } else {
                    return returnAns;
                }
            }
            return await originFunction.bind(this)(...args);
        };
    }
}

@Injectable({
    providedIn: 'root'
})
export class AccountManagerService {
    private token: Token;
    private changeCallbacks: { (): void }[];
    private _onLogin: Subject<void>;
    private _onLogout: Subject<void>;
    private _accountSpecificStorage: AsyncKVStorage;
    get onLogin(): Observable<void> { return this._onLogin; }
    get onLogout(): Observable<void> { return this._onLogout; }
    get accountStorage() { return this._accountSpecificStorage; }

    constructor(private localstorage: LocalStorageService,
        private sessionstorage: SessionStorageService,
        private wschannel: WSChannelService,
        private router: Router) {
        this.token = this.localstorage.get(CONS.Keys.LOGIN_TOKEN, null);
        this.changeCallbacks = [];
        this._onLogin = new Subject<void>();
        this._onLogout = new Subject<void>();
        this._accountSpecificStorage = new AsyncKVStorage('accountStorage');
        this.onLogin.subscribe(() => this._accountSpecificStorage.clear());
        this.onLogout.subscribe(() => this._accountSpecificStorage.clear());
    }
    get LoginToken(): Token { return this.token; }
    get isLogin(): boolean { return this.token != null; }


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
        } catch { return false; }
    } //}

    @AsyncMethodTokenNotNull()
    async logout(): Promise<void> //{
    {
        let req = new UserMessage() as UserMessageLogoutRequest;
        req.um_type = UserMessageType.Logout;
        req.um_msg.token = this.token;
        this.token = null;
        nextTick(() => this._onLogout.next());

        try {
            await this.wschannel.send(req);
        } catch { }
    } //}

    @AsyncMethodTokenNotNull(false)
    async getUserinfo(): Promise<UserInfo> //{
    {
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
    async setUserinfo(info: UserInfo): Promise<boolean> { return false; }

    @AsyncMethodTokenNotNull()
    async changePassword(oldpass: string, newpass: string): Promise<void> //{
    {
        let req = new UserMessage() as UserMessageChangePasswordRequest;
        req.um_type = UserMessageType.ChangePassword;
        req.um_msg.token = this.token;
        req.um_msg.oldpass = oldpass;
        req.um_msg.newpass = newpass;
        await this.wschannel.send(req);
    } //}

    @AsyncMethodTokenNotNull()
    async addUser(username: string, password: string, invCode: string): Promise<boolean> //{
    {
        let req = new UserMessage() as UserMessageAddUserRequest;
        req.um_type = UserMessageType.AddUser;
        req.um_msg.token = this.LoginToken;
        req.um_msg.username = username;
        req.um_msg.password = password;
        req.um_msg.invitationCode = invCode;

        try {
            await this.wschannel.send(req);
            return true;
        } catch { return false; }
    } //}

    @AsyncMethodTokenNotNull()
    async removeUser(username: string, password: string): Promise<boolean> //{
    {
        let req = new UserMessage() as UserMessageRemoveUserRequest;
        req.um_type = UserMessageType.RemoveUser;
        req.um_msg.token = this.LoginToken;
        req.um_msg.username = username;
        req.um_msg.password = password;

        try {
            await this.wschannel.send(req);
        } catch { return false; }
    } //}

    @AsyncMethodTokenNotNull()
    async genInvCodes(n: number): Promise<void> //{
    {
        let req = new UserMessage() as UserMessageGenInvCodeRequest;
        req.um_type = UserMessageType.GenerateInvitationCode;
        req.um_msg.token = this.token;
        req.um_msg.n = n;
        await this.wschannel.send(req);
    } //}

    @AsyncMethodTokenNotNull()
    async getInvCodes(): Promise<string[]> //{
    {
        let req = new UserMessage() as UserMessaageGetInvCodeRequest;
        req.um_type = UserMessageType.GetInvitationCode;
        req.um_msg.token = this.token;

        const resp = await this.wschannel.send(req) as UserMessaageGetInvCodeResponse;
        return resp.um_msg.InvCodes;
    } //}

    @AsyncMethodTokenNotNull()
    async getUserSettings(): Promise<UserSettings> //{
    {
        let req = new UserMessage() as UserMessageGetUserSettingsRequest;
        req.um_type = UserMessageType.GetUserSettings;
        req.um_msg.token = this.token;
        const resp = await this.wschannel.send(req) as UserMessageGetUserSettingsResponse;
        return resp.um_msg.userSettings;
    } //}

    @AsyncMethodTokenNotNull()
    async updateUserSettings(settings: UserSettings): Promise<void> //{
    {
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
    @AsyncMethodTokenNotNull()
    async refreshShortTermToken(): Promise<Token> //{
    {
        let req = new UserMessage() as UserMessageShortTermTokenGenerateRequest;
        req.um_type = UserMessageType.ShortTermTokenGenerate;
        req.um_msg.token = this.token;
        const resp = await this.wschannel.send(req) as UserMessageShortTermTokenGenerateResponse;
        this.shortTermToken = resp.um_msg.shortTermToken;
        this.shortTermTokenStartPoint = Date.now();
        this.sessionstorage.set(ShortTermTokenStore, { token: this.shortTermToken, start: this.shortTermTokenStartPoint });

        return this.shortTermToken;
    } //}
    @AsyncMethodTokenNotNull()
    async clearShortTermToken(): Promise<void> //{
    {
        this.shortTermToken = null;
        this.shortTermTokenStartPoint = null;
        this.sessionstorage.remove(ShortTermTokenStore);

        let req = new UserMessage() as UserMessageShortTermTokenClearRequest;
        req.um_type = UserMessageType.ShortTermTokenClear;
        req.um_msg.token = this.token;
        await this.wschannel.send(req) as UserMessageShortTermTokenGenerateResponse;
    } //}
    @AsyncMethodTokenNotNull()
    async getShortTermToken(): Promise<Token> //{
    {
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

    @AsyncMethodTokenNotNull()
    async newNameEntry(name: string, destination: string, validPeriodMS: number = null): Promise<void> {
        let req = new UserMessage() as UserMessageNewNameEntryRequest;
        req.um_type = UserMessageType.NewNameEntry;
        req.um_msg.token = this.token;
        req.um_msg.name = name;
        req.um_msg.destination = destination;
        req.um_msg.validPeriodMS = validPeriodMS;
        await this.wschannel.send(req);
    }

    @AsyncMethodTokenNotNull()
    async getNameEntry(name: string): Promise<NameEntry> {
        let req = new UserMessage() as UserMessageGetNameEntryRequest;
        req.um_type = UserMessageType.GetNameEntry;
        req.um_msg.token = this.token;
        req.um_msg.name = name;
        const resp = await this.wschannel.send(req) as UserMessageGetNameEntryResponse;
        return toInstanceOfType(NameEntry, resp.um_msg.entry) as NameEntry;
    }

    @AsyncMethodTokenNotNull()
    async getAllNameEntry(): Promise<NameEntry[]> {
        let req = new UserMessage() as UserMessageGetAllNameEntryRequest;
        req.um_type = UserMessageType.GetAllNameEntry;
        req.um_msg.token = this.token;
        const resp = await this.wschannel.send(req) as UserMessageGetAllNameEntryResponse;
        let ans = [];
        for(const entry of resp.um_msg.entries) ans.push(toInstanceOfType(NameEntry, entry) as NameEntry);
        return ans;
    }

    @AsyncMethodTokenNotNull()
    async deleteNameEntry(name: string): Promise<void> {
        let req = new UserMessage() as UserMessageDeleteNameEntryRequest;
        req.um_type = UserMessageType.DeleteNameEntry;
        req.um_msg.token = this.token;
        req.um_msg.name = name;
        await this.wschannel.send(req);
    }

    @AsyncMethodTokenNotNull()
    async deleteAllNameEntry(): Promise<void> {
        let req = new UserMessage() as UserMessageDeleteAllNameEntryRequest;
        req.um_type = UserMessageType.DeleteAllNameEntry;
        req.um_msg.token = this.token;
        await this.wschannel.send(req);
    }
}

