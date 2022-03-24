import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NbAuthService, NbLoginComponent } from '@nebular/auth';
import { NbToastrService } from '@nebular/theme';
import { AuthService } from 'src/app/service/auth';

@Component({
    selector: 'ngx-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent extends NbLoginComponent implements OnInit {
    user: {
        username: string;
        password: string;
    };
    enableRememberMe: boolean = true;
    rememberMe: boolean = true;

    constructor(service: NbAuthService, cd: ChangeDetectorRef, router: Router,
                private authService: AuthService,
                private toastService: NbToastrService) {
        super(service, {}, cd, router);
    }

    ngOnInit(): void {}

    async login() {
        this.errors = [];
        this.messages = [];
        this.showMessages = {};
        this.submitted = false;

        try {
            await this.authService.login(this.user);
            this.toastService.show("登录成功, 跳转到首页", "登录", {status: 'primary'});
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.submitted = true;
            this.router.navigateByUrl('/wd/dashboard');

            if(!this.rememberMe) {
                this.authService.forgetLogin();
            }
        } catch (e: any) {
            let errorMsg = "unknown error";
            if(e instanceof HttpErrorResponse) {
                errorMsg = e.error.reason || errorMsg;
            }

            this.toastService.danger(errorMsg, "login");
            this.errors.push(errorMsg);
            this.showMessages = {error: true};
        }
    }
}

