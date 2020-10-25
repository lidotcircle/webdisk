import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatInputModule } from '@angular/material/input';

import { PassportRoutingModule } from './passport-routing.module';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { RetrievePasswordComponent } from './retrieve-password/retrieve-password.component';


@NgModule({
    declarations: [LoginComponent, SignupComponent, RetrievePasswordComponent],
    imports: [
        CommonModule,
        FormsModule,
        MatInputModule,
        PassportRoutingModule
    ]
})
export class PassportModule { }

