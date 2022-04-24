import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbAuthService, NbRequestPasswordComponent } from '@nebular/auth';
import { NbToastrService } from '@nebular/theme';
import { AuthService } from 'src/app/service/auth';


@Component({
    selector: 'ngx-request-password',
    templateUrl: './request-password.component.html',
    styleUrls: ['./request-password.component.scss']
})
export class RequestPasswordComponent extends NbRequestPasswordComponent implements OnInit {
    user: {
        username: string;
        invitecode: string;
    };

    constructor(service: NbAuthService, cd: ChangeDetectorRef, router: Router,
                private activatedRoute: ActivatedRoute,
                private toastrService: NbToastrService,
                private authService: AuthService) { 
        super(service, {}, cd, router);

        this.user = {} as any;
    }

    ngOnInit(): void {
    }

    async requestPass() {
        try {
            const resetToken = await this.authService.requestReset(this.user);
            this.router.navigate(['../reset-password'], {
                relativeTo: this.activatedRoute,
                queryParams: {
                    'reset-token': resetToken
                }
            });
        } catch (err) {
            if (err instanceof HttpErrorResponse) {
                this.toastrService.danger(err.error, 'Error');
            } else {
                this.toastrService.danger(err.message, 'Error');
            }
        }
    }
}
