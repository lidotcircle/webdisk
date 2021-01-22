import { Component, OnInit } from '@angular/core';
import { AccountManagerService } from 'src/app/shared/service/account-manager.service';
import { NotifierService } from 'src/app/shared/service/notifier.service';
import { NotifierComponent } from 'src/app/shared/shared-component/notifier/notifier.component';

@Component({
    selector: 'app-user-account',
    templateUrl: './user-account.component.html',
    styleUrls: ['./user-account.component.scss']
})
export class UserAccountComponent implements OnInit {
    private modifypass = {oldpassword: '', newpassword: '', confirmpass: ''};

    constructor(private accountManager: AccountManagerService,
                private notifier: NotifierService) { }

    ngOnInit(): void {
    }

    async changepassword() {
        if(this.modifypass.newpassword.length < 6) {
            await this.notifier.create({message: 'password is too short'}).wait();
        } else if (this.modifypass.newpassword != this.modifypass.confirmpass) {
            await this.notifier.create({message: 'confirm password doesn\'t match new password'}).wait();
        } else {
            try {
                await this.accountManager.changePassword(this.modifypass.oldpassword, this.modifypass.newpassword);
                await this.notifier.create({message: 'change password successfully'}).wait();
            } catch (err) {
                await this.notifier.create({message: JSON.stringify(err)});
            }
        }
    }

    logout() {
        this.accountManager.logout();
        this.notifier.create({message: 'logout', duration: 2000}).wait().then(() => location.reload());
    }
}

