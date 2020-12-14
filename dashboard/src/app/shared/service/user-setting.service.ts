import { Injectable } from '@angular/core';
import * as dexie from 'dexie';
import { Observable, Subject } from 'rxjs';
import { UserSettings } from '../common';
import { assignTargetEnumProp, CopySourceEnumProp, nextTick } from '../utils';
import { AccountManagerService } from './account-manager.service';
import { AsyncLocalStorageService } from './async-local-storage.service';
import { UserDBService } from './user-db.service';

function AutoUpdateInChange(sm: string, gm?: string) {
    return function<T extends { new (...args: any[]): {}}>(constructor: T) {
        return class extends constructor {
            constructor(...args) {
                super(...args);
                let keys = [];
                for(let key in this) keys.push(key);

                return new Proxy(this, {
                    get: function (target, prop, receiver) {
                        if (keys.indexOf(prop as string) >= 0) {
                            if(!!gm) {
                                setTimeout(() => (target as any)[gm](prop), 0);
                            }
                        }
                        return Reflect.get(target, prop, receiver);
                    },
                    set: function (target, prop, value, receiver) {
                        if (keys.indexOf(prop as string) >= 0) {
                            setTimeout(() => (target as any)[sm](prop), 0);
                        }
                        Reflect.set(target, prop,value, receiver);
                        return true;
                    }
                });
            }
        }
    }
}

const SETTING_KEY = "USER_SETTING";
@AutoUpdateInChange("saveSettings")
class Setting extends UserSettings {}

@Injectable({
    providedIn: 'root'
})
export class UserSettingService extends Setting {
    private _saveFail: Subject<Error> = new Subject<Error>();
    get saveFail(): Observable<Error> {return this._saveFail;}

    constructor(private localstorage: AsyncLocalStorageService, 
                private accountManager: AccountManagerService) {
        super();
        this.accountManager.onLogin.subscribe(async () => {
            const settings = await this.accountManager.getUserSettings();
            CopySourceEnumProp(settings, this);
            await this.localstorage.set(SETTING_KEY, settings);
        });
        this.accountManager.onLogout.subscribe(async () => {
            let o = new Setting();
            CopySourceEnumProp(o, this);
            await this.localstorage.remove(SETTING_KEY);
        });

        this.localstorage.get(SETTING_KEY, new Setting()).then(settings => {
            CopySourceEnumProp(settings, this);
        });
    }

    private inSaving = false;
    private doubleSave = false;
    async saveSettings() {
        if (this.inSaving) {
            this.doubleSave = true;
            return;
        }
        this.inSaving = true;
        let settings = new Setting();
        assignTargetEnumProp(this, settings);
        try {
            await this.localstorage.set(SETTING_KEY, settings);
            await this.accountManager.updateUserSettings(settings);
        } catch (err) {
            this._saveFail.next(err);
        }
        this.inSaving = false;

        if(this.doubleSave) {
            this.doubleSave = false;
            nextTick(() => this.saveSettings())
        }
    }
}

