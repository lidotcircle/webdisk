import { Injectable } from '@angular/core';
import { AccountManagerService } from '../account-manager.service';
import { WSChannelService } from '../wschannel.service';
import { mode, AES, enc } from 'crypto-js';
import { StorePassword, StorePasswordTypeChangePassMessage, StorePasswordTypeDeletePassMessage, StorePasswordTypeGetPassMessage, StorePasswordTypeGetPassResponseMessage, StorePasswordTypeNewPassMessage, StorePasswordTypeNewPassResponseMessage } from '../../common';
import { Observable, Subject } from 'rxjs';
import { MessageBoxService } from '../message-box.service';
import { NotifierService } from '../notifier.service';
import { NotifierType } from '../../shared-component/notifier/notifier.component';

const prefix: string = 'UVWXYZ@@VV%%&*!()-+=,./\\';
@Injectable({
    providedIn: 'root'
})
export class StorePassService {
    private _update: Subject<number | null> = new Subject<number | null>();
    get update(): Observable<number | null> {return this._update;}
    private _stores: StorePassword[] = [];
    get Stores(): StorePassword[] {return JSON.parse(JSON.stringify(this._stores));}

    constructor(private accountmanager: AccountManagerService,
                private wschannel: WSChannelService,
                private notifier: NotifierService,
                private messagebox: MessageBoxService) {
        this.refreshAllPass();
    }

    async newPass(where: string, account: string, pass: string, password: string, encryptAccount: boolean = false): Promise<void> //{
    {
        const cipher = this.encrypt(pass, password);
        const req = new StorePasswordTypeNewPassMessage();
        const store = new StorePassword();
        if(encryptAccount) {
            store.account = this.encrypt(account, password);
        } else {
            store.account = prefix + account;
        }
        store.pass = cipher;
        store.site = where;
        req.misc_msg.token = this.accountmanager.LoginToken;
        req.misc_msg.store = store;
        const resp = await this.wschannel.send(req) as StorePasswordTypeNewPassResponseMessage;

        store.passid = resp.misc_msg.passid;
        this._stores.push(store);
        this._update.next(store.passid);
        this.saveTo();
    } //}

    async deletePass(passid: number): Promise<void> //{
    {
        const req = new StorePasswordTypeDeletePassMessage();
        req.misc_msg.token = this.accountmanager.LoginToken;
        req.misc_msg.passid = passid;
        await this.wschannel.send(req);

        for(let i=0;i<this._stores.length;i++) {
            const store = this._stores[i];
            if(store.passid == passid) {
                this._stores.splice(i, 1);
                this._update.next(passid);
                break;
            }
        }
        this.saveTo();
    } //}

    async changePassword(passid: number, newpass: string, password: string = ''): Promise<void> //{
    {
        let s: StorePassword;
        for(const store of this._stores) {
            if(store.passid == passid) {
                if(!this.decrypt(store.pass, password)) {
                    throw new Error('wrong password');
                }
                s = store;
            }
        }

        const req = new StorePasswordTypeChangePassMessage();
        req.misc_msg.token = this.accountmanager.LoginToken;
        req.misc_msg.passid = passid;
        req.misc_msg.pass = this.encrypt(newpass, password);
        await this.wschannel.send(req);
        s.pass = req.misc_msg.pass;
        this._update.next(passid);
        this.saveTo();
    } //}

    private async refreshAllPass() //{
    {
        const req = new StorePasswordTypeGetPassMessage();
        req.misc_msg.token = this.accountmanager.LoginToken;
        const resp = await this.wschannel.send(req) as StorePasswordTypeGetPassResponseMessage;
        this._stores = resp.misc_msg.stores;
        this._update.next(null);
        this.saveTo();
    } //}

    getPassStoreByID(passid: number): StorePassword | null //{
    {
        let ans;
        for(const store of this._stores) {
            if(store.passid == passid) {
                ans = store;
                break;
            }
        }
        return ans;
    } //}

    private async saveTo(): Promise<void> //{
    {
        try {
            await this.accountmanager.accountStorage.set('__StorePass__', this._stores);
        } catch {}
    } //}

    private encrypt(text: string, password: string): string {
        const t = enc.Utf8.parse(prefix + text);
        return AES.encrypt(t, password).toString();
    }

    decrypt(cipher: string, password: string): string | null {
        const d = AES.decrypt(cipher, password).toString(enc.Utf8);
        if(d.startsWith(prefix)) {
            return d.substring(prefix.length);
        } else {
            return null;
        }
    }

    eliminatePrefix(val: string): string | null {
        if(val.startsWith(prefix)) return val.substr(prefix.length);
        return null;
    }

    async newPassWithUI(): Promise<void> //{
    {
        const u = await this.messagebox.create({
            title: 'Create new pass store',
            message: '',
            inputs: [
                {name: 'site', label: 'site', type: 'text'},
                {name: 'account', label: 'account', type: 'text'},
                {name: 'pass', label: 'store password', type: 'password'},
                {name: 'password', label: 'password', type: 'password', initValue: ''},
                {name: 'encaccount', label: 'Encrypt Account', type: 'checkbox', initValue: false}
            ],
            buttons: [
                {name: 'Confirm'},
                {name: 'Cancel'}
            ]
        }).wait();

        if(!u.closed && u.buttonValue == 0) {
            try {
                await this.newPass(u.inputs['site'], 
                    u.inputs['account'], u.inputs['pass'], 
                    u.inputs['password'], !!u.inputs['encaccount']);
                await this.notifier.create({message: 'created new pass'}).wait();
            } catch (err) {
                await this.notifier.create({message: `created new pass fail: ${err.message}`, mtype: NotifierType.Error}).wait();
            }
        }
    } //}

    async deletePassWithUI(passid: number): Promise<void> //{
    {
        try {
            await this.deletePass(passid);
            await this.notifier.create({message: 'delete pass'}).wait();
        } catch (err) {
            await this.notifier.create({message: `delete pass fail: ${err.message}`, mtype: NotifierType.Error}).wait();
        }
    } //}

    async changePassWithUI(passid: number): Promise<void> //{
    {
        const u = await this.messagebox.create({
            title: 'change password',
            message: '',
            inputs: [
                {name: 'pass', label: 'store password', type: 'password'},
                {name: 'password', label: 'password', type: 'password', initValue: ''},
            ],
            buttons: [
                {name: 'Confirm'},
                {name: 'Cancel'}
            ]
        }).wait();

        if(!u.closed && u.buttonValue == 0) {
            try {
                await this.changePassword(passid, u.inputs['pass'], u.inputs['password']);
                await this.notifier.create({message: 'change pass'}).wait();
            } catch (err) {
                await this.notifier.create({message: `change pass fail: ${err.message}`, mtype: NotifierType.Error}).wait();
            }
        }
    } //}
}

