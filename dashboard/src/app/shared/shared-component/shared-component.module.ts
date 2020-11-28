import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginBGComponent } from './login-bg/login-bg.component';
import { NotifierComponent } from './notifier/notifier.component';
import { FullScreenShadowComponent } from './full-screen-shadow/full-screen-shadow.component';



@NgModule({
    declarations: [LoginBGComponent, NotifierComponent],
    imports: [
        CommonModule
    ],
    exports: [
        LoginBGComponent,
        NotifierComponent
    ]
})
export class SharedComponentModule { }
