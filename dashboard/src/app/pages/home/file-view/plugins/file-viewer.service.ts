import { Injectable } from '@angular/core';
import { FileStat } from 'src/app/shared/common';
import { AccountManagerService } from 'src/app/shared/service/account-manager.service';
import { InjectViewService } from 'src/app/shared/service/inject-view.service';
import { OpenFileService } from 'src/app/shared/service/open-file/open-file.service';
import { cons } from 'src/app/shared/utils';

type FOpenFileView = (fileviewservice: FileViewerService, file: FileStat, files: FileStat[], activeIndex: number) => Promise<void>;

import {default as reg_video} from './video';
import {default as reg_audio} from './audio';
import {default as reg_image} from './image';
import {default as reg_pdf  } from './pdf';


@Injectable({
    providedIn: 'root'
})
export class FileViewerService {
    get injector() {return this._injector;}
    get openfile() {return this._openfile;}
    
    private handlerMap: Map<string, FOpenFileView> = new Map();
    constructor(private _injector: InjectViewService,
                private _openfile: OpenFileService,
                private accountManager: AccountManagerService) {
        reg_video(this);
        reg_audio(this);
        reg_image(this);
        reg_pdf  (this);
    }

    public registerHandlerEntries(handle: FOpenFileView, extensions: string[]) {
        for(const ext of extensions) {
            if(this.handlerMap.has(ext)) {
                throw new Error(`bad entry, ${ext}`);
            }
            this.handlerMap.set(ext, handle);
        }
    }

    async view(files: FileStat[], activeIndex: number): Promise<boolean> {
        const handler = this.handlerMap.get(files[activeIndex].extension);
        if(handler != null) {
            await handler(this, files[activeIndex], files, activeIndex);
            return true;
        } else {
            return false;
        }
    }

    async ShortTermToken(): Promise<string> {
        return await this.accountManager.getShortTermToken();
    }

    async Token(): Promise<string> {
        return this.accountManager.LoginToken;
    }

    async ValidHttpResourceURL(filename: string): Promise<string> {
        const token = await this.accountManager.getShortTermToken();
        return `${cons.DiskPrefix}${filename}?${cons.DownloadShortTermTokenName}=${token}`;
    }
}

