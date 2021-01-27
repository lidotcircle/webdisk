import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module';
import { AudioPlayerComponent } from './audio-player/audio-player.component';
import { VideoPlayerComponent } from './video-player/video-player.component';
import { VimeModule } from '@vime/angular';
import { ImageViewerComponent } from './image-viewer/image-viewer.component';
import { NgxAudioPlayerModule } from 'ngx-audio-player';
import { MatIconModule } from '@angular/material/icon';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';


@NgModule({
    declarations: [AudioPlayerComponent, VideoPlayerComponent, ImageViewerComponent, PdfViewerComponent],
    imports: [
        CommonModule,
        VimeModule,
        MatIconModule,
        NgxAudioPlayerModule,
        NgxExtendedPdfViewerModule
    ],
    exports: [
        AudioPlayerComponent,
        VideoPlayerComponent,
        ImageViewerComponent,
        PdfViewerComponent
    ]
})
export class MediaModule { }

