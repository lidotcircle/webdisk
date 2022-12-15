import { Injectable } from '@angular/core';
import { NbWindowService } from '@nebular/theme';
import { SNWindowService } from '../snwindow/snwindow.service';
import { DownloadProgressBarComponent } from './download-progress-bar/download-progress-bar.component';
import { KkwindowsModule } from './kkwindows.module';


@Injectable({
    providedIn: KkwindowsModule
})
export class KKWindowsService{
    constructor(private windowService: NbWindowService,
                private snwindow: SNWindowService) {}

    public async fetchContent(url: string) {
        const ans = this.snwindow.open(DownloadProgressBarComponent);
        debugger;

        const win = this.windowService.open(DownloadProgressBarComponent, {
        });
        win.componentRef.instance.content;

        const resp = await fetch(url);
        const [ t1, t2 ] = resp.body.tee();

        new Promise((resolve, reject) => {
            const writable = new WritableStream({
                write: (chunk: Uint8Array) => { },
                close: () => resolve(null),
                abort: reject
            });
            t2.pipeTo(writable);
        });

        return t1;
    }
}
