import { Injectable } from '@angular/core';
import { UploadFileViewComponent } from '../shared-component/upload-file-view/upload-file-view.component';
import { FileSystemEntry } from '../utils';
import { InjectViewService } from './inject-view.service';

class UploadHandler {
    private destoryed = false;
    constructor(private view: UploadFileViewComponent) {
        this.view.registerClose(() => {
            if(this.destoryed) return;

            this.view.destroy();
            this.destoryed = true;
        });
    }

    async upload() {
        await this.view.upload();

        if(this.destoryed) return;
        this.view.destroy();
        this.destoryed = true;
    }
}

@Injectable({
    providedIn: 'root'
})
export class UploadSessionService {
    constructor(private injector: InjectViewService) {}

    create(entry: FileSystemEntry, destination: string) {
        const view = this.injector.inject(UploadFileViewComponent, {fileEntry: entry, destination: destination});
        return new UploadHandler(view);
    }
}

