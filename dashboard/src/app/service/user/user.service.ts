import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { RESTfulAPI } from '../../restful';
import { AuthService  } from '../auth';
import { LocalStorageService } from '../storage';
declare var require: any;
export const defaultProfileImage = require('!url-loader!./profile-image.png').default;


const avatar_storage_key = 'avatar';
export interface UserBasicInfo {
    username: string;
    createdAt: Date;
};
@Injectable({
    providedIn: 'root'
})
export class UserService {
    private _avatar: string;
    private avatar_subscrption_count: number;
    private avatar_subject: Subject<string>;

    private _frontend_setting: string;
    private frontend_setting_subject: Subject<string>;
    private frontend_setting_subscrption_count: number;

    private _user_basic_info: UserBasicInfo;
    private _user_basic_info_subscrption_count: number;
    private _user_basic_info_sub: Subject<UserBasicInfo>;

    get basicInfo(): Observable<UserBasicInfo> {
        return new Observable(subscriber => {
            if (this._user_basic_info) {
                subscriber.next(this._user_basic_info);
            } else if (this._user_basic_info_subscrption_count == 0) {
                this.refreshBasicInfo();
            }
            this._user_basic_info_subscrption_count++;
            const sub = this._user_basic_info_sub.subscribe(subscriber);
            return new Subscription(() => {
                this._user_basic_info_subscrption_count--;
                sub.unsubscribe();
            });
        });
    }

    get avatar(): Observable<string> {
        return new Observable(subscriber => {
            if (this._avatar) {
                subscriber.next(this._avatar);
            } else if (this.avatar_subscrption_count == 0) {
                this.refreshAvatar();
            }
            this.avatar_subscrption_count++;
            const sub = this.avatar_subject.subscribe(subscriber);
            return new Subscription(() => {
                this.avatar_subscrption_count--;
                sub.unsubscribe();
            });
        });
    }

    get fronted_setting(): Observable<string> {
        return new Observable(subscriber => {
            if (this._frontend_setting) {
                subscriber.next(this._frontend_setting);
            } else if (this.frontend_setting_subscrption_count == 0) {
                this.refreshFrontendSetting();
            }
            this.frontend_setting_subscrption_count++;
            const sub = this.frontend_setting_subject.subscribe(subscriber);
            return new Subscription(() => {
                this.frontend_setting_subscrption_count--;
                sub.unsubscribe();
            });
        });
    }

    private load_old_avatar() {
        const old_avatar_val = this.localStorageService.get<string>(avatar_storage_key, null);
        if (old_avatar_val) {
            try {
                const val = JSON.parse(old_avatar_val)
                if (val.avatar && Date.now() - val.date < 1000 * 60 * 60 * 8) 
                {
                    this._avatar = val.avatar;
                }
            } catch {}
        }
    }

    private save_avatar(avatar: string) {
        this.localStorageService.set(avatar_storage_key, JSON.stringify({
            avatar: avatar,
            date: Date.now()
        }));
    }

    constructor(
        private http: HttpClient,
        private localStorageService: LocalStorageService,
        private authService: AuthService)
    { 
        this.avatar_subject = new Subject<string>();
        this.avatar_subscrption_count = 0;
        this.frontend_setting_subject = new Subject<string>();
        this.frontend_setting_subscrption_count = 0;
        this._user_basic_info_sub = new Subject<UserBasicInfo>();
        this._user_basic_info_subscrption_count = 0;

        this.load_old_avatar();

        this.authService.getJwtClaim().subscribe(claim => {
            if (claim) {
                if (this.avatar_subscrption_count > 0)
                    this.refreshAvatar();
                if (this.avatar_subscrption_count > 0)
                    this.refreshFrontendSetting();
                if (this._user_basic_info_subscrption_count > 0)
                    this.refreshBasicInfo();
            } else {
                this.avatar_subject.next(null);
                this.frontend_setting_subject.next(null);
                this._user_basic_info_sub.next(null);
            }
        });
    }

    private async refreshAvatar() {
        try {
            const { avatar } = await this.http.get(RESTfulAPI.User.avatar).toPromise() as { avatar: string };
            if (avatar != null && avatar != "")
                this.save_avatar(avatar);
            this._avatar = avatar == "" ? defaultProfileImage : avatar;
            this.avatar_subject.next(this._avatar);
        } catch {
            this.avatar_subject.next(null);
        }
    }

    public async setAvatar(avatar: string) {
        await this.http.post(RESTfulAPI.User.avatar, { avatar: avatar }).toPromise();
        this._avatar = avatar;
        this.avatar_subject.next(avatar);
    }

    private async refreshFrontendSetting() {
        try {
            const { setting } = await this.http.get(RESTfulAPI.User.frontendSetting).toPromise() as { setting: string };
            this._frontend_setting = setting;
            this.frontend_setting_subject.next(setting);
        } catch {
            this.frontend_setting_subject.next(null);
        }
    }

    public async setFrontendSetting(setting: string) {
        await this.http.post(RESTfulAPI.User.frontendSetting, { setting: setting }).toPromise();
        this._frontend_setting = setting;
        this.frontend_setting_subject.next(setting);
    }

    public async refreshBasicInfo() {
        try {
            const { username, createdAt } = 
                await this.http.get(RESTfulAPI.User.basicInfo).toPromise() as { username: string, createdAt: string };
            this._user_basic_info = { username, createdAt: new Date(createdAt) };
            this._user_basic_info_sub.next(this._user_basic_info);
        } catch {
            this._user_basic_info_sub.next(null);
        }
    }

    public async changePassword(old_password: string, new_password: string) {
        await this.http.post(RESTfulAPI.User.password, { oldpassword: old_password, password: new_password }).toPromise();
        try {
            await this.authService.logout();
        } catch {}
    }

    public async deleteAccount(password: string) {
        await this.http.delete(RESTfulAPI.User.deleteUser, { 
            params: { password: password }
        }).toPromise();
        try {
            await this.authService.logout();
        } catch {}
    }
}
