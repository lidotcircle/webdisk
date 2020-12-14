import { Injectable } from '@angular/core';
import * as dexie from 'dexie';
import { Observable, Subject } from 'rxjs';
import { UserSettings } from '../common';
import { assignTargetEnumProp, CopySourceEnumProp, nextTick } from '../utils';
import { AccountManagerService } from './account-manager.service';
import { AsyncLocalStorageService } from './async-local-storage.service';
import { UserDBService } from './user-db.service';

function AutoUpdateInChange() {
    return function(target) {
        console.log("feel", target);
        for(let i in target) {
            console.log(i);
        }
    }
}

const SETTING_KEY = "USER_SETTING";
@AutoUpdateInChange()
class Setting extends UserSettings {
    hello: boolean = true;
}

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

