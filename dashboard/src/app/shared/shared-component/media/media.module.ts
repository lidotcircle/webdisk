import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module';
import { AudioPlayerComponent } from './audio-player/audio-player.component';
import { VideoPlayerComponent } from './video-player/video-player.component';
import { VimeModule } from '@vime/angular';


@NgModule({
    declarations: [AudioPlayerComponent, VideoPlayerComponent],
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

