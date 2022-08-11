import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbWindowService } from '@nebular/theme';
import { TranslocoService } from '@ngneat/transloco';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/service/auth';
import { UserBasicInfo, UserService } from 'src/app/service/user';
import { MessageBoxService } from 'src/app/shared/service/message-box.service';
import { NotifierService } from 'src/app/shared/service/notifier.service';
import { NotifierType } from 'src/app/shared/shared-component/notifier/notifier.component';
import { ProfilePhotoUploadComponent } from './profile-photo-upload.component';


@Component({
    selector: 'app-user-account',
    templateUrl: './user-account.component.html',
    styleUrls: ['./user-account.component.scss']
})
export class UserAccountComponent implements OnInit, OnDestroy {
    private destroy$: Subject<void>;
    modifypass = {oldpassword: '', newpassword: '', confirmpass: ''};
    userinfo: UserBasicInfo;
    avatar: string;

    constructor(private authService: AuthService,
                private userService: UserService,
                private windowService: NbWindowService,
                private translocoService: TranslocoService,
                private notifier: NotifierService,
                private messagebox: MessageBoxService)
    {
        this.destroy$ = new Subject();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngOnInit(): void {
        this.userService.basicInfo
            .pipe(takeUntil(this.destroy$))
            .subscribe(info => {
                this.userinfo = info;
            });

        this.userService.avatar
            .pipe(takeUntil(this.destroy$))
            .subscribe(avatar => {
                this.avatar = avatar;
            });
    }

    get createTime() {
        if (this.userinfo)
            return (new Date(this.userinfo.createdAt)).toLocaleString();
        else
            return '';
    }

    async editAvatar() {
        const win = this.windowService.open(ProfilePhotoUploadComponent, {
            title: this.translocoService.translate('change avatar'),
            context: {
                photo: this.avatar
            },
            buttons: {
                minimize: false,
                maximize: false,
                fullScreen: false,
            }
        });
        await win.onClose.toPromise();

        if(win.config.context['isConfirmed']) {
            const photo = win.config.context['photo'];
            try {
                if (typeof photo == 'string') {
                    await this.userService.setAvatar(photo);
                } else if (photo instanceof ArrayBuffer) {
                    await this.userService.setAvatarBlob(photo);
                }

                this.notifier.create({
                    message: this.translocoService.translate("changed avatar!")
                });
            } catch {
                this.notifier.create({
                    message: this.translocoService.translate("fail to change avatar"),
                    mtype: NotifierType.Error}
                );
            }
        }
    }

    async refreshAvatar() {
        await this.userService.refreshAvatar();
        this.notifier.create({
            message: this.translocoService.translate("Refresh")
        });
    }

    async changepassword() {
        if(this.modifypass.newpassword.length < 6) {
            await this.notifier.create({message: 'password is too short', mtype: NotifierType.Warn}).wait();
        } else if (this.modifypass.newpassword != this.modifypass.confirmpass) {
            await this.notifier.create({message: 'confirm password doesn\'t match new password', mtype: NotifierType.Warn}).wait();
        } else {
            try {
                await this.userService.changePassword(this.modifypass.oldpassword, this.modifypass.newpassword);
                await this.notifier.create({message: 'change password successfully, logout'}).wait();
                location.reload();
            } catch (err) {
                this.notifier.create({message: JSON.stringify(err), mtype: NotifierType.Error});
            }
        }
    }

    async logout() {
        await this.authService.logout();
        this.notifier.create({message: 'logout', duration: 1000}).wait().then(() => location.reload());
    }

    async deleteAccount() {
        const ans = await this.messagebox.create({
            title: this.translocoService.translate('Delete Account'),
            message: this.translocoService.translate('Do you confirm delete account ?'),
            inputs: [
                {label: this.translocoService.translate(`username`), name: 'username', type: 'text'},
                {label: this.translocoService.translate(`password`), name: 'password', type: 'password'},
            ],
            buttons:[
                {name: this.translocoService.translate('confirm')},
                {name: this.translocoService.translate('cancel')}
            ]
        }).wait();

        if(!ans.closed && ans.buttonValue == 0) {
            if (ans.inputs['username'] != this.userinfo.username) {
                await this.notifier.create({
                    message: this.translocoService.translate(`unmatched username`),
                    mtype: NotifierType.Error
                }).wait();
                return;
            }

            try {
                await this.userService.deleteAccount(ans.inputs['password']);
                await this.notifier.create({
                    message: this.translocoService.translate('delete user {{user}} success, goodbey.', {user: ans.inputs['username']})
                }).wait();
                location.reload();
            } catch (err) {
                await this.notifier.create({
                    message: this.translocoService.translate('delete user {{user}} fail.', {user: ans.inputs['username']}),
                    mtype: NotifierType.Error
                }).wait();
            }
        }
    }
}
