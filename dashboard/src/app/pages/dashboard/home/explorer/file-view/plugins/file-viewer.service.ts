import { Injectable } from '@angular/core';
import { FileStat } from 'src/app/shared/common';
import { InjectViewService } from 'src/app/shared/service/inject-view.service';
import { OpenFileService } from 'src/app/shared/service/open-file/open-file.service';


export interface OpenFileOption {
    extension?: string;
}
type FOpenFileView = (fileviewservice: FileViewerService, file: FileStat, files: FileStat[], activeIndex: number, options: OpenFileOption) => Promise<void>;

import {default as reg_video} from './video';
import {default as reg_audio} from './audio';
import {default as reg_image} from './image';
import {default as reg_pdf  } from './pdf';
import {default as reg_text } from './text';
import { DiskDownloadService } from 'src/app/service/disk-download.service';
import { FileSystemManagerService } from 'src/app/shared/service/file-system-manager.service';
import { NbToastrService } from '@nebular/theme';


@Injectable({
    providedIn: 'root'
})
export class FileViewerService {
    get injector()   {return this._injector;}
    get openfile()   {return this._openfile;}
    get filesystem() {return this._fs;}
    get toastr()     {return this._toastr;}
    
    private handlerMap: Map<string, FOpenFileView> = new Map();
    constructor(private _injector: InjectViewService,
                private _openfile: OpenFileService,
                private _fs: FileSystemManagerService,
                private _toastr: NbToastrService,
                private downloadService: DiskDownloadService) {
        reg_video(this);
        reg_audio(this);
        reg_image(this);
        reg_pdf  (this);
        reg_text (this);
    }

    public registerHandlerEntries(handle: FOpenFileView, extensions: string[]) {
        for(const ext of extensions) {
            if(this.handlerMap.has(ext)) {
                throw new Error(`bad entry, ${ext}`);
            }
            this.handlerMap.set(ext, handle);
        }
    }

    hasHandler(extension: string): boolean {
        return this.handlerMap.has(extension);
    }

    async view(files: FileStat[], activeIndex: number, asExtension?: string): Promise<boolean> {
        asExtension = asExtension || files[activeIndex].extension;
        const handler = this.handlerMap.get(asExtension);
        if(handler != null) {
            await handler(this, files[activeIndex], files, activeIndex, {
                extension: asExtension,
            });
            return true;
        } else {
            return false;
        }
    }

    async ValidHttpResourceURLs(filenames: string[]): Promise<string[]> {
        return await this.downloadService.getDownloadUrls(filenames);
    }


    async ValidHttpResourceURL(filename: string): Promise<string> {
        const urls = await this.ValidHttpResourceURLs([filename]);
        if (!urls) return null;
        return urls[0];
    }
}

