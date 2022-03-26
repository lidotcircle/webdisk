import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/service/auth';
import { UserBasicInfo, UserService } from 'src/app/service/user';
import { MessageBoxService } from 'src/app/shared/service/message-box.service';
import { NotifierService } from 'src/app/shared/service/notifier.service';
import { NotifierType } from 'src/app/shared/shared-component/notifier/notifier.component';


@Component({
    selector: 'app-user-account',
    templateUrl: './user-account.component.html',
    styleUrls: ['./user-account.component.scss']
})
export class UserAccountComponent implements OnInit, OnDestroy {
    modifypass = {oldpassword: '', newpassword: '', confirmpass: ''};
    userinfo: UserBasicInfo;

    constructor(private authService: AuthService,
                private userService: UserService,
                private notifier: NotifierService,
                private messagebox: MessageBoxService) { }

    ngOnDestroy(): void {
        this._user_subscription.unsubscribe();
    }

    private _user_subscription: Subscription;
    ngOnInit(): void {
        this._user_subscription = this.userService.basicInfo.subscribe(info => {
            this.userinfo = info;
        });
    }

    get createTime() {
        if (this.userinfo)
            return (new Date(this.userinfo.createdAt)).toLocaleString();
        else
            return '';
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
            title: 'Delete Account',
            message: 'Do you confirm delete account ?',
            inputs: [
                {label: `username`, name: 'username', type: 'text'},
                {label: `password`, name: 'password', type: 'password'},
            ],
            buttons:[
                {name: 'confirm'},
                {name: 'cancel'}
            ]
        }).wait();

        if (ans.inputs['username'] != this.userinfo.username) {
            await this.notifier.create({message: `unmatched username`, mtype: NotifierType.Error}).wait();
            return;
        }
        if(!ans.closed && ans.buttonValue == 0) {
            try {
                await this.userService.deleteAccount(ans.inputs['password']);
                await this.notifier.create({message: `delete user ${ans.inputs['username']} success, goodbey.`}).wait();
                location.reload();
            } catch (err) {
                await this.notifier.create({message: `delete user ${ans.inputs['username']} fail.`, mtype: NotifierType.Error}).wait();
            }
        }
    }
}

