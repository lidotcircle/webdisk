import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginBGComponent } from './login-bg/login-bg.component';
import { NotifierComponent } from './notifier/notifier.component';
import { ProgressBarComponent } from './progress-bar/progress-bar.component';



@NgModule({
    declarations: [LoginBGComponent, NotifierComponent, ProgressBarComponent],
    imports: [
        CommonModule
    ],
    exports: [
        LoginBGComponent,
        NotifierComponent,
        ProgressBarComponent
    ]
})
export class SharedComponentModule { }
