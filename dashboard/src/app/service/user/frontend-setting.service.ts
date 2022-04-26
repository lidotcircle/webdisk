import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { LocalStorageService } from 'src/app/service/storage';
import { UserService } from 'src/app/service/user';
import { assignTargetEnumProp, CopySourceEnumProp, nextTick } from 'src/app/shared/utils';


class FrontendEndUserSettings {
    ContinueSendFileWithSameMD5: boolean = true;
    MoveFolderWithoutConfirm: boolean = false;
    UsingLoginTokenInPlayer: boolean = true;
    HttpRedirect: boolean = true;
    
    Note_Editor_ShowButtons: boolean = false;
    Note_Editor_SavingInterval: number = 1000 * 60;

    static fromJSON(json: string): FrontendEndUserSettings {
        const ans = new FrontendEndUserSettings();
        const j = JSON.parse(json);

        for(const key in ans) {
            ans[key] = j[key] === undefined ? ans[key] : j[key];
        }

        return ans;
    }
}

function AutoUpdateInChange(sm: string, gm?: string) {
    return function<T extends { new (...args: any[]): {}}>(constructor: T) {
        return class extends constructor {
            constructor(...args: any[]) {
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
class Setting extends FrontendEndUserSettings {}

@Injectable({
    providedIn: 'root'
})
export class FrontendSettingService extends Setting {
    private _save_error: Error;
    private _save_error_sub: Subject<Error>;
    private stopAutomateSaving: boolean;
    get saveError(): Observable<Error> {
        return new Observable(observer => {
            if (this._save_error)
                observer.next(this._save_error);

            this._save_error_sub.subscribe(observer);
        });
    }

    constructor(private localstorage: LocalStorageService,
                private userService: UserService) {
        super();
        this._save_error_sub = new Subject<Error>();
        this.userService.fronted_setting.subscribe(setting => {
            if (!setting) {
                this.localstorage.set(SETTING_KEY, setting);
                const o = new FrontendEndUserSettings();
                this.stopAutomateSaving = true;
                CopySourceEnumProp(o, this);
                this.localstorage.remove(SETTING_KEY);
                return;
            }
            const obj = FrontendEndUserSettings.fromJSON(setting);
            this.stopAutomateSaving = true;
            CopySourceEnumProp(obj, this);
            this.stopAutomateSaving = false;
            this.localstorage.set(SETTING_KEY, setting);
        });

        const oldsetting = this.localstorage.get(SETTING_KEY, null);
        if (oldsetting) {
            const obj = FrontendEndUserSettings.fromJSON(oldsetting);
            this.stopAutomateSaving = true;
            CopySourceEnumProp(obj, this);
            this.stopAutomateSaving = false;
        }
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
        const sobj = new FrontendEndUserSettings();
        assignTargetEnumProp(this, sobj);
        const setting = JSON.stringify(sobj);
        try {
            await this.userService.setFrontendSetting(setting);
            this.localstorage.set(SETTING_KEY, setting);
        } catch (err) {
            this._save_error = err;
            this._save_error_sub.next(err);
        }
        this.inSaving = false;

        if(this.doubleSave) {
            this.doubleSave = false;
            nextTick(() => this.saveSettings());
        }
    }
}
