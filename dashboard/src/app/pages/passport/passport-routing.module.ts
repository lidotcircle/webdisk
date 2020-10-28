import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RetrievePasswordComponent } from './retrieve-password/retrieve-password.component';
import { SignupComponent } from './signup/signup.component';

const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
    },
    {
        path: 'login',
        pathMatch: 'full',
        component: LoginComponent
    },
    {
        path: 'signup',
        pathMatch: 'full',
        component: SignupComponent
    },
    {
        path: 'retrieve-password',
        pathMatch: 'full',
        component: RetrievePasswordComponent
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PassportRoutingModule { }
