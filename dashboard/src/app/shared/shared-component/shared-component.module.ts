import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginBGComponent } from './login-bg/login-bg.component';



@NgModule({
    declarations: [LoginBGComponent],
    imports: [
        CommonModule
    ],
    exports: [
        LoginBGComponent
    ]
})
export class SharedComponentModule { }
