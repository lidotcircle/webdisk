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
                                const f = Reflect.get(target, gm) as Function;
                                console.assert(typeof f === 'function');
                                f.bind(target)(prop);
                            }
                        }
                        return Reflect.get(target, prop, receiver);
                    },
                    set: function (target, prop, value, receiver) {
                        if (keys.indexOf(prop as string) >= 0) {
                            const f = Reflect.get(target, sm) as Function;
                            console.assert(typeof f === 'function');
                            f.bind(target)(prop);
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
    private stopAutomateSaving: boolean;
    get saveFail(): Observable<Error> {return this._saveFail;}

    constructor(private localstorage: AsyncLocalStorageService, 
                private accountManager: AccountManagerService) {
        super();
        this.accountManager.onLogin.subscribe(async () => {
            const settings = await this.accountManager.getUserSettings();
            this.stopAutomateSaving = true;
            CopySourceEnumProp(settings, this);
            this.stopAutomateSaving = false;
            await this.localstorage.set(SETTING_KEY, settings);
        });
        this.accountManager.onLogout.subscribe(async () => {
            let o = new UserSettings();
            this.stopAutomateSaving = true;
            CopySourceEnumProp(o, this);
            this.stopAutomateSaving = false;
            await this.localstorage.remove(SETTING_KEY);
        });

        this.localstorage.get(SETTING_KEY, new UserSettings()).then(settings => {
            this.stopAutomateSaving = true;
            CopySourceEnumProp(settings, this);
            this.stopAutomateSaving = false;
        });
    }

    private inSaving = false;
    private doubleSave = false;
    async saveSettings() {
        if (this.stopAutomateSaving) return;
        if (this.inSaving) {
            this.doubleSave = true;
            return;
        }
        this.inSaving = true;
        let settings = new UserSettings();
        assignTargetEnumProp(this, settings);
        try {
            await this.localstorage.set(SETTING_KEY, settings);
            await this.accountManager.updateUserSettings(settings);
        } catch (err) {
            console.warn("save user settings fail", err);
            this._saveFail.next(err);
        }
        this.inSaving = false;

        if(this.doubleSave) {
            this.doubleSave = false;
            nextTick(() => this.saveSettings())
        }
    }
}

