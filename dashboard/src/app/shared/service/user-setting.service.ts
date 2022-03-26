import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { LocalStorageService } from 'src/app/service/storage';
import { UserService } from 'src/app/service/user';
import { UserSettings } from '../common';
import { assignTargetEnumProp, CopySourceEnumProp, nextTick } from '../utils';


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
class Setting extends UserSettings {}

@Injectable({
    providedIn: 'root'
})
export class UserSettingService extends Setting {
}

