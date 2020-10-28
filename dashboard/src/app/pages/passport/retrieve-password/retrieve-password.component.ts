import { Component, OnInit } from '@angular/core';
import { AccountManagerService } from 'src/app/shared/service/account-manager.service';

@Component({
    selector: 'app-retrieve-password',
    templateUrl: './retrieve-password.component.html',
    styleUrls: ['./retrieve-password.component.scss']
})
export class RetrievePasswordComponent implements OnInit {
    inputState = {
        username: '',
        password: '',
        invCode: ''
    };
    resetFail = false;

    constructor(private accountManager: AccountManagerService) {}

    ngOnInit(): void {
    }

    reset() {
        this.resetFail = false;
        /*
        this.accountManager(this.inputState.username, this.inputState.password, this.inputState.invCode)
            .then(l => {
                this.resetFail = !l;
            });
            */
    }
}

