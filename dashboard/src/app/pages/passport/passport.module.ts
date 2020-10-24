import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PassportRoutingModule } from './passport-routing.module';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { RetrievePasswordComponent } from './retrieve-password/retrieve-password.component';


@NgModule({
  declarations: [LoginComponent, SignupComponent, RetrievePasswordComponent],
  imports: [
    CommonModule,
    PassportRoutingModule
  ]
})
export class PassportModule { }
