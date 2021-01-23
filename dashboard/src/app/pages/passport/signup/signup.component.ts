import { Component, OnInit } from '@angular/core';
import { AccountManagerService } from 'src/app/shared/service/account-manager.service';
import { NotifierService } from 'src/app/shared/service/notifier.service';
import { NotifierType } from 'src/app/shared/shared-component/notifier/notifier.component';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
    inputState = {
        username: '',
        password: '',
        invCode: ''
    };
    signupFail = false;

    constructor(private accountManager: AccountManagerService,
                private notifier: NotifierService) {}

    ngOnInit(): void {
    }

    async signup() {
        this.signupFail = false;
        try {
            await this.accountManager.addUser(this.inputState.username, this.inputState.password, this.inputState.invCode);
            await this.notifier.create({message: 'signup success, try login', duration: 1000}).wait();
        } catch {
            await this.notifier.create({message: 'signup fail', mtype: NotifierType.Error}).wait();
            return;
        }

        try {
            await this.accountManager.login(this.inputState.username, this.inputState.password);
            await this.notifier.create({message: 'login success', duration: 1000}).wait();
        } catch {
            await this.notifier.create({message: 'login fail', mtype: NotifierType.Error}).wait();
        }
        location.reload();
    }
}

