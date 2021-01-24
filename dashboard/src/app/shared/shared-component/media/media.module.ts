import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module';
import { AudioPlayerComponent } from './audio-player/audio-player.component';
import { VideoPlayerComponent } from './video-player/video-player.component';
import { VimeModule } from '@vime/angular';
import { ImageViewerComponent } from './image-viewer/image-viewer.component';


@NgModule({
    declarations: [AudioPlayerComponent, VideoPlayerComponent, ImageViewerComponent],
    imports: [
        CommonModule,
        VimeModule
    ],
    exports: [
        AudioPlayerComponent,
        VideoPlayerComponent
    ]
})
export class MediaModule { }

