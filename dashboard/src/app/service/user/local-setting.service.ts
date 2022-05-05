import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { LocalStorageService } from 'src/app/service/storage';
import { assignTargetEnumProp, CopySourceEnumProp } from 'src/app/shared/utils';


class LocalUserSettings {
    Fullscreen_exit_single_click: boolean = true;
    Fullscreen_enter_single_click: boolean = false;
    Fullscreen_exit_button_always_show: boolean = true;
    
    Note_Editor_ShowButtons: boolean = false;
    Note_Editor_SavingInterval_s: number = 60;
    Note_Editor_ShowPatchLength: boolean = true;

    Markdown_Editor_Saving_When_Leave: boolean = true;
    Markdown_Editor_Apply_Local_Patch: boolean = true;

    File_Upload_ValidateMD5: boolean = true;
    File_Upload_Just_Continue: boolean = false;
    File_Upload_Always_Overwrite: boolean = false;

    Explorer_Default_Item_Per_Page: number = 50;
    Explorer_Filesize_Unit_Always_KB: boolean = true;

    Websocket_Reconnect_Interval_s: number = 2;
    Websocket_Request_Timeout_s: number = 8;

    Markdown_Show_Heading_NO: boolean = true;
    Markdown_Show_TOC: boolean = true;

    Group_Delete_Without_Confirm: boolean = false;

    static fromJSON(json: string): LocalUserSettings {
        const ans = new LocalUserSettings();
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
                const keys = Object.getOwnPropertyNames(this);

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
                        Reflect.set(target, prop, value, receiver);
                        if (keys.indexOf(prop as string) >= 0) {
                            const f = Reflect.get(target, sm) as Function;
                            console.assert(typeof f === 'function');
                            f.bind(target)(prop);
                        }
                        return true;
                    }
                });
            }
        }
    }
}

const SETTING_KEY = "LOCAL_USER_SETTING";
@AutoUpdateInChange("saveSettings")
class Setting extends LocalUserSettings {}

@Injectable({
    providedIn: 'root'
})
export class LocalSettingService extends Setting {
    private stopAutomateSaving = false;
    private settingSubject: Subject<LocalUserSettings> = new Subject();
    private CopyThisSetting(): LocalUserSettings {
        const sobj = new LocalUserSettings();
        assignTargetEnumProp(this, sobj);
        return sobj;
    }

    get setting(): Observable<LocalUserSettings> {
        return new Observable(observer => {
            observer.next(this.CopyThisSetting());
            return this.settingSubject.subscribe(observer);
        });
    }

    constructor(private localstorage: LocalStorageService) {
        super();

        const oldsetting = this.localstorage.get(SETTING_KEY, null);
        if (oldsetting) {
            const obj = LocalUserSettings.fromJSON(oldsetting);
            this.stopAutomateSaving = true;
            CopySourceEnumProp(obj, this);
            this.stopAutomateSaving = false;
        }
    }

    async saveSettings() {
        if (this.stopAutomateSaving) return;

        const sobj = this.CopyThisSetting();
        const setting = JSON.stringify(sobj);
        this.localstorage.set(SETTING_KEY, setting);
        this.settingSubject.next(sobj);
    }
}
