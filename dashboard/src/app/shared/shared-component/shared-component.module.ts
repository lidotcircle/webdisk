import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginBGComponent } from './login-bg/login-bg.component';
import { NotifierComponent } from './notifier/notifier.component';
import { ProgressBarComponent } from './progress-bar/progress-bar.component';
import { UploadFileViewComponent } from './upload-file-view/upload-file-view.component';
import { ContextMenuComponent } from './context-menu/context-menu.component';



@NgModule({
    declarations: [LoginBGComponent, NotifierComponent, ProgressBarComponent, UploadFileViewComponent, ContextMenuComponent],
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
