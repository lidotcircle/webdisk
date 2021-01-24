import { Injectable } from '@angular/core';
import { SoleVideoPlayerComponent } from '../../shared-component/sole-window/sole-video-player/sole-video-player.component';
import { InjectedComponentHandler, InjectViewService } from '../inject-view.service';

class OpenVideoHandler {
    private h: InjectedComponentHandler<SoleVideoPlayerComponent>;
    constructor(handler: InjectedComponentHandler<SoleVideoPlayerComponent>) {
        this.h = handler;
    }

    private destroyed: boolean = false;
    async wait(): Promise<void> {
        await this.h.instance.wait();

        if(!this.destroyed) {
            this.h.destroy();
            this.destroyed = true;
        }
    }
}

@Injectable({
    providedIn: 'root'
})
export class OpenVideoService {
    constructor(private injector: InjectViewService) { }

    create(data: {
        src: string,
    }): OpenVideoHandler {
        const injecthandler = this.injector.inject(SoleVideoPlayerComponent, data);
        return new OpenVideoHandler(injecthandler);
    }
}
