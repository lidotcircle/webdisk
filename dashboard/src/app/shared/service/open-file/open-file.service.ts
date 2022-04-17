import { Injectable } from '@angular/core';
import { SoleAudioPlayerComponent } from '../../shared-component/sole-window/sole-audio-player/sole-audio-player.component';
import { SoleImageViewerComponent } from '../../shared-component/sole-window/sole-image-viewer/sole-image-viewer.component';
import { SolePdfViewerComponent } from '../../shared-component/sole-window/sole-pdf-viewer/sole-pdf-viewer.component';
import { SoleTextViewerComponent } from '../../shared-component/sole-window/sole-text-viewer/sole-text-viewer.component';
import { SoleVideoPlayerComponent } from '../../shared-component/sole-window/sole-video-player/sole-video-player.component';
import { AccountManagerService } from '../account-manager.service';
import { InjectViewService } from '../inject-view.service';
import { OpenFileHandler } from './open-file-handler';

const PDFIndexPrefix = 'PDF_PAGE_SAVE';


@Injectable({
    providedIn: 'root'
})
export class OpenFileService {
    constructor(private injector: InjectViewService,
                private accountManager: AccountManagerService) { }

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

    createImage(data: {
        images: string[],
        index: number
    }): OpenFileHandler<SoleImageViewerComponent> {
        const injecthandler = this.injector.inject(SoleImageViewerComponent, data);
        return new OpenFileHandler(injecthandler);
    }

    createTextViewer(data: {
        code: string,
        language: string,
        filename: string,
    }): OpenFileHandler<SoleTextViewerComponent> {
        const injecthandler = this.injector.inject(SoleTextViewerComponent, data);
        return new OpenFileHandler(injecthandler);
    }

    async createPdf(data: {
        src: string,
        filename?: string,
        page?: number
    }, fullpathname?: string): Promise<OpenFileHandler<SolePdfViewerComponent>> {
        data.page = data.page || await this.accountManager.accountStorage.get(PDFIndexPrefix + fullpathname || '');

        const injecthandler = this.injector.inject(SolePdfViewerComponent, data, {'pageChange': n =>{
            this.accountManager.accountStorage.set(PDFIndexPrefix + fullpathname || '', n);
        }});
        return new OpenFileHandler(injecthandler);
    }
}

