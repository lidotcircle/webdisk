import { Component, OnInit } from '@angular/core';
import { AccountManagerService } from 'src/app/shared/service/account-manager.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    username: string;
    password: string;
    loginSuccess = false;
    loginFail = false;

    constructor(private accountManager: AccountManagerService) {}

    ngOnInit(): void {
    }

    login() {
        console.log('try login');
        this.accountManager.login('administrator', '123456').then(l => {
            console.log((l ? 'login success' : 'login fail'));
        });
    }
}

