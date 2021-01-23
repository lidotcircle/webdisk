import { Component, OnInit } from '@angular/core';
import { AccountManagerService } from 'src/app/shared/service/account-manager.service';
import { Router } from '@angular/router';
import { NotifierService } from 'src/app/shared/service/notifier.service';
import { NotifierType } from 'src/app/shared/shared-component/notifier/notifier.component';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    inputState = {
        username: '',
        password: ''
    };
    loginFail = false;

    constructor(private accountManager: AccountManagerService,
                private router: Router,
                private notifier: NotifierService) {}

    ngOnInit(): void {
    }

    async login() {
        this.loginFail = false;
        try {
            await this.accountManager.login(this.inputState.username, this.inputState.password);
            await this.notifier.create({message: 'login success', duration: 1000}).wait();
            await this.router.navigateByUrl('/home');
        } catch(err) {
            this.notifier.create({message: `login in fail: ${err.message}`, mtype: NotifierType.Error}).wait();
            this.loginFail = true;
        }
    }
}

