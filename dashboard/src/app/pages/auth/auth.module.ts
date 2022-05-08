import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './login/login.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { RegisterComponent } from './register/register.component';
import { NbAuthModule } from '@nebular/auth';
import { RequestPasswordComponent } from './request-password/request-password.component';
import { NbInputModule, NbButtonModule, NbCheckboxModule, NbCardModule } from '@nebular/theme';
import { FormsModule } from '@angular/forms';
import { NbEvaIconsModule } from '@nebular/eva-icons';


@NgModule({
    declarations: [LoginComponent, ResetPasswordComponent, RegisterComponent, RequestPasswordComponent ],
    imports: [
        CommonModule,
        AuthRoutingModule,
        NbAuthModule.forRoot(),
        FormsModule,
        NbCardModule,
        NbInputModule,
        NbButtonModule,
        NbCheckboxModule,
        NbEvaIconsModule,
    ],
})
export class AuthModule { }
