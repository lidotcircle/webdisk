import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PassportRoutingModule } from './passport-routing.module';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { RetrievePasswordComponent } from './retrieve-password/retrieve-password.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
    declarations: [LoginComponent, SignupComponent, RetrievePasswordComponent],
    imports: [
        CommonModule,
        FormsModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        SharedModule,
        PassportRoutingModule
    ]
})
export class PassportModule { }

