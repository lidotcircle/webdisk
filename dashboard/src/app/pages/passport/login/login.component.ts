import { Component, OnInit } from '@angular/core';
import { AccountManagerService } from 'src/app/shared/service/account-manager.service';
import { Router } from '@angular/router';

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
                private router: Router) {}

    ngOnInit(): void {
    }

    login() {
        this.loginFail = false;
        this.accountManager.login(this.inputState.username, this.inputState.password)
            .then(l => {
                this.loginFail = !l;
                if(l) {
                    setTimeout(() => {
                        this.inputState.username = '';
                        this.inputState.password = '';
                        this.router.navigateByUrl('/home');
                    }, 500);
                }
            });
    }
}

