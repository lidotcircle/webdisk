import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginBGComponent } from './login-bg/login-bg.component';
import { MessageBoxComponent } from './message-box/message-box.component';
import { ProgressBarComponent } from './progress-bar/progress-bar.component';
import { UploadFileViewComponent } from './upload-file-view/upload-file-view.component';
import { ContextMenuComponent } from './context-menu/context-menu.component';
import { WindowToolbarComponent } from './window-toolbar/window-toolbar.component';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FilePropertiesComponent } from './file-properties/file-properties.component';
import { NotifierComponent } from './notifier/notifier.component';


@NgModule({
    declarations: [
        LoginBGComponent, MessageBoxComponent, ProgressBarComponent,
        UploadFileViewComponent, ContextMenuComponent, WindowToolbarComponent, 
        FilePropertiesComponent, NotifierComponent
    ],
    imports: [
        CommonModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        FormsModule,
        HttpClientModule
    ],
    exports: [
        LoginBGComponent,
        MessageBoxComponent,
        NotifierComponent,
        ProgressBarComponent
    ]
})
export class SharedComponentModule { }

