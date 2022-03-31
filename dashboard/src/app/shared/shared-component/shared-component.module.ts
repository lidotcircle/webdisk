import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginBGComponent } from './login-bg/login-bg.component';
import { MessageBoxComponent } from './message-box/message-box.component';
import { ProgressBarComponent } from './progress-bar/progress-bar.component';
import { UploadFileViewComponent } from './upload-file-view/upload-file-view.component';
import { ContextMenuComponent } from './context-menu/context-menu.component';

import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { FilePropertiesComponent } from './file-properties/file-properties.component';
import { NotifierComponent } from './notifier/notifier.component';
import { MessageProgressBarComponent } from './message-progress-bar/message-progress-bar.component';
import { ProgressCircleComponent } from './message-progress-bar/progress-circle/progress-circle.component';
import { FileIconComponent } from './file-icon/file-icon.component';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { WindowComponent } from './window/window.component';
import { PageTopComponent } from './page-top/page-top.component';
import { MediaModule } from './media/media.module';
import { SoleWindowComponent } from './sole-window/sole-window.component';
import { SoleVideoPlayerComponent } from './sole-window/sole-video-player/sole-video-player.component';
import { SoleAudioPlayerComponent } from './sole-window/sole-audio-player/sole-audio-player.component';
import { SoleImageViewerComponent } from './sole-window/sole-image-viewer/sole-image-viewer.component';
import { SolePdfViewerComponent } from './sole-window/sole-pdf-viewer/sole-pdf-viewer.component';
import { SearchBarFloatComponent } from './search-bar-float/search-bar-float.component';
import { ConfirmWindowComponent } from './confirm-window.component';
import { NbButtonModule } from '@nebular/theme';
import { PrismJSComponent } from './ngx-prismjs/ngx-prismjs.component';


@NgModule({
    declarations: [
        LoginBGComponent, MessageBoxComponent, ProgressBarComponent,
        UploadFileViewComponent, ContextMenuComponent,
        FilePropertiesComponent, NotifierComponent, MessageProgressBarComponent, 
        ProgressCircleComponent, FileIconComponent, SearchBarComponent, WindowComponent, PageTopComponent, 
        SoleWindowComponent, SoleVideoPlayerComponent, SoleAudioPlayerComponent, SoleImageViewerComponent, 
        SolePdfViewerComponent, SearchBarFloatComponent, ConfirmWindowComponent,
        PrismJSComponent,
    ],
    imports: [
        CommonModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        FormsModule,
        NbButtonModule,

        MediaModule
    ],
    exports: [
        LoginBGComponent,
        MessageBoxComponent,
        NotifierComponent,
        ProgressBarComponent,
        FileIconComponent,
        SearchBarComponent,
        SearchBarFloatComponent,
        WindowComponent,
        PageTopComponent,
        PrismJSComponent,

        MediaModule
    ]
})
export class SharedComponentModule { }

