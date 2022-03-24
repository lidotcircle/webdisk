import { Component, OnInit } from '@angular/core';
import { UserInfo } from 'src/app/shared/common';
import { AccountManagerService } from 'src/app/shared/service/account-manager.service';
import { MessageBoxService } from 'src/app/shared/service/message-box.service';
import { NotifierService } from 'src/app/shared/service/notifier.service';
import { NotifierComponent, NotifierType } from 'src/app/shared/shared-component/notifier/notifier.component';

@Component({
    selector: 'app-user-account',
    templateUrl: './user-account.component.html',
    styleUrls: ['./user-account.component.scss']
})
export class UserAccountComponent implements OnInit {
    modifypass = {oldpassword: '', newpassword: '', confirmpass: ''};
    userinfo = new UserInfo();

    constructor(private accountManager: AccountManagerService,
                private notifier: NotifierService,
                private messagebox: MessageBoxService) { }

    ngOnInit(): void {
        this.accountManager.getUserinfo().then(info => {
            this.userinfo = info;
            this.userinfo.createTime
        });
    }
    get createTime() {
        return (new Date(this.userinfo.createTime)).toLocaleString();
    }

    async changepassword() {
        if(this.modifypass.newpassword.length < 6) {
            await this.notifier.create({message: 'password is too short', mtype: NotifierType.Warn}).wait();
        } else if (this.modifypass.newpassword != this.modifypass.confirmpass) {
            await this.notifier.create({message: 'confirm password doesn\'t match new password', mtype: NotifierType.Warn}).wait();
        } else {
            try {
                await this.accountManager.changePassword(this.modifypass.oldpassword, this.modifypass.newpassword);
                await this.notifier.create({message: 'change password successfully, logout'}).wait();
                location.reload();
            } catch (err) {
                await this.notifier.create({message: JSON.stringify(err), mtype: NotifierType.Error});
            }
        }
    }

    logout() {
        this.accountManager.logout();
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

        if(!ans.closed && ans.buttonValue == 0) {
            try {
                await this.accountManager.removeUser(ans.inputs['username'], ans.inputs['password']);
                await this.notifier.create({message: `delete user ${ans.inputs['username']} success, goodbey.`}).wait();
                location.reload();
            } catch (err) {
                await this.notifier.create({message: `delete user ${ans.inputs['username']} fail.`, mtype: NotifierType.Error}).wait();
            }
        }
    }
}

