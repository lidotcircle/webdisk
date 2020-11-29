import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginBGComponent } from './login-bg/login-bg.component';
import { NotifierComponent } from './notifier/notifier.component';
import { ProgressBarComponent } from './progress-bar/progress-bar.component';
import { UploadFileViewComponent } from './upload-file-view/upload-file-view.component';



@NgModule({
    declarations: [LoginBGComponent, NotifierComponent, ProgressBarComponent, UploadFileViewComponent],
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
