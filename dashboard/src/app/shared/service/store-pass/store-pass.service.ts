import { Injectable } from '@angular/core';
import { AES, enc } from 'crypto-js';
import { StorePassword } from '../../common';
import { Observable, Subject, Subscription } from 'rxjs';
import { MessageBoxService } from '../message-box.service';
import { NotifierService } from '../notifier.service';
import { NotifierType } from '../../shared-component/notifier/notifier.component';
import { RESTfulAPI } from 'src/app/restful';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/service/auth';

const prefix: string = 'UVWXYZ@@VV%%&*!()-+=,./\\';
@Injectable({
    providedIn: 'root'
})
export class StorePassService {
    private _stores: StorePassword[];
    private _update: Subject<StorePassword[]>;
    private _subscription_count: number = 0;

    get store(): Observable<StorePassword[]> {
        return new Observable(observer => {
            if (this._stores) {
                observer.next(this._stores);
            } else if (this._subscription_count == 0) {
                this.refreshAllPass();
            }

            const sub = this._update.subscribe(observer);
            this._subscription_count++;
            return new Subscription(() => {
                this._subscription_count--;
                sub.unsubscribe()
            });
        });
    }

    constructor(private http: HttpClient,
                private authService: AuthService,
                private notifier: NotifierService,
                private messagebox: MessageBoxService) 
    {
        this._update = new Subject<StorePassword[]>();
        this.authService.getJwtClaim().subscribe(claim => {
            if (claim) {
                if (this._subscription_count > 0) {
                    this.refreshAllPass();
                }
            } else {
                this._stores = [];
                this._update.next(this._stores);
            }
        });
    }

    async newPass(where: string, account: string, pass: string, password: string, encryptAccount: boolean = false): Promise<void> //{
    {
        const cipher = this.encrypt(pass, password);
        if(encryptAccount) {
            account = this.encrypt(account, password);
        } else {
            account = prefix + account;
        }

        const { id } = await this.http.post(RESTfulAPI.PassStore, {
            site: where,
            account: account,
            password: cipher
        }).toPromise() as { id: number };

        this.notifier.create({ message: 'New password added' });
        const newpass = new StorePassword();
        newpass.passid = id;
        newpass.site = where;
        newpass.account = account;
        newpass.pass = cipher;
        this._stores.push(newpass);
        this._update.next(this._stores);
    } //}

    async deletePass(passid: number): Promise<void> //{
    {
        await this.http.delete(RESTfulAPI.PassStore, {
            params: {
                id: passid
            }
        }).toPromise();

        for(let i=0;i<this._stores.length;i++) {
            const store = this._stores[i];
            if(store.passid == passid) {
                this._stores.splice(i, 1);
                break;
            }
        }
        this._update.next(this._stores);
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
                s.pass = this.encrypt(newpass, password);
            }
        }
        if (!s) {
            throw new Error('not found');
        }

        await this.http.put(RESTfulAPI.PassStore, {
            id: passid,
            site: s.site,
            account: s.account,
            password: s.pass
        }).toPromise();

        this._update.next(this._stores);
    } //}

    private async refreshAllPass() //{
    {
        let list: any[];
        try {
            list = await this.http.get(RESTfulAPI.PassStore).toPromise() as any[];
        } catch {}
        if (!list)
            return;

        this._stores = list.map(item => {
            const store = new StorePassword();
            store.passid = item.id;
            store.site = item.site;
            store.account = item.account;
            store.pass = item.password;
            return store;
        });
        this._update.next(this._stores);
    } //}

    getPassStoreByID(passid: number): StorePassword | null //{
    {
        for(const store of this._stores) {
            if(store.passid == passid) {
                return store;
            }
        }
        return null;
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

