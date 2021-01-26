import { Injectable } from '@angular/core';
import { FileStat } from 'src/app/shared/common';
import { AccountManagerService } from 'src/app/shared/service/account-manager.service';
import { InjectViewService } from 'src/app/shared/service/inject-view.service';
import { OpenVideoService } from 'src/app/shared/service/open-file/open-video.service';
import { cons } from 'src/app/shared/utils';

type FOpenFileView = (fileviewservice: FileViewerService, file: FileStat) => Promise<void>;

import {default as handler_video} from './video';


@Injectable({
    providedIn: 'root'
})
export class FileViewerService {
    get injector() {return this._injector;}
    get videoplayer() {return this._videoplayer;}
    
    private handlerMap: Map<string, FOpenFileView> = new Map();
    constructor(private _injector: InjectViewService,
                private _videoplayer: OpenVideoService,
                private accountManager: AccountManagerService) {
        this.registerHandlerEntries(handler_video, ['mp4', 'mkv']);
    }

    private registerHandlerEntries(handle: FOpenFileView, extensions: string[]) {
        for(const ext of extensions) {
            if(this.handlerMap.has(ext)) {
                throw new Error(`bad entry, ${ext}`);
            }
            this.handlerMap.set(ext, handle);
        }
    }

    async view(file: FileStat): Promise<boolean> {
        const handler = this.handlerMap.get(file.extension);
        if(handler != null) {
            await handler(this, file);
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

