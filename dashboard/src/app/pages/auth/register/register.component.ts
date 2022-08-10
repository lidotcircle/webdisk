import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbAuthService, NbRegisterComponent } from '@nebular/auth';
import { NbToastrService } from '@nebular/theme';
import { TranslocoService } from '@ngneat/transloco';
import { timer } from 'rxjs';
import { AuthService } from 'src/app/service/auth';

@Component({
    selector: 'ngx-signup',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent extends NbRegisterComponent implements OnInit {
    user: {
        username: string;
        password: string;
        invitecode: string;
    };

    confirmPassword: string;
    constructor(service: NbAuthService, cd: ChangeDetectorRef, router: Router,
                private authService: AuthService,
                private translocoService: TranslocoService,
                private activatedRoute: ActivatedRoute,
                private toastrService: NbToastrService) {
        super(service, {}, cd, router);
    }

    ngOnInit(): void {
    }

    async register() {
        try {
            await this.authService.signup(this.user);
            this.toastrService.success(
                this.translocoService.translate("success! goto login page"),
                this.translocoService.translate("signup"));
            timer(1000).subscribe(() => {
                this.router.navigate(['../login'], {
                    relativeTo: this.activatedRoute
                });
            });
        } catch (err) {
            console.log(err);
            if (err instanceof HttpErrorResponse) {
                this.toastrService.warning(
                    this.translocoService.translate(err.error || "failed"),
                    this.translocoService.translate('signup'));
            } else {
                this.toastrService.warning(
                    this.translocoService.translate(err.message || "failed"),
                    this.translocoService.translate('signup'));
            }
        }
    }
}

