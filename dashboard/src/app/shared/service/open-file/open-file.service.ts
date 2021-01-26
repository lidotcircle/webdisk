import { Injectable } from '@angular/core';
import { SoleAudioPlayerComponent } from '../../shared-component/sole-window/sole-audio-player/sole-audio-player.component';
import { SoleVideoPlayerComponent } from '../../shared-component/sole-window/sole-video-player/sole-video-player.component';
import { InjectedComponentHandler, InjectViewService } from '../inject-view.service';
import { OpenFileHandler } from './open-file-handler';

@Injectable({
    providedIn: 'root'
})
export class OpenFileService {
    constructor(private injector: InjectViewService) { }

    createVideo(data: {
        src: string,
    }): OpenFileHandler<SoleVideoPlayerComponent> {
        const injecthandler = this.injector.inject(SoleVideoPlayerComponent, data);
        return new OpenFileHandler(injecthandler);
    }

    createAudio(data: {
        src: string,
        title: string
    }): OpenFileHandler<SoleAudioPlayerComponent> {
        const injecthandler = this.injector.inject(SoleAudioPlayerComponent, data);
        return new OpenFileHandler(injecthandler);
    }
}

