import { Component, OnInit } from '@angular/core';
import { AccountManagerService } from 'src/app/shared/service/account-manager.service';

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

    constructor(private accountManager: AccountManagerService) {}

    ngOnInit(): void {
    }

    signup() {
        this.signupFail = false;
        this.accountManager.addUser(this.inputState.username, this.inputState.password, this.inputState.invCode)
            .then(l => {
                this.signupFail = !l;
            });
    }
}

