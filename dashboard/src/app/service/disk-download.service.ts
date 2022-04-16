import { Injectable } from '@angular/core';
import { downloadURI } from '../shared/utils';
import { STokenService } from './user';


@Injectable({
    providedIn: 'root'
})
export class DiskDownloadService {
    constructor(private stokenService: STokenService) {}

    async getDownloadUrls(filenames: string[]): Promise<string[]> {
        const token = await this.stokenService.getSToken(["download"]);
        if (!token) return null;
        return filenames.map(filename => `${window.location.origin}/disk${filename}?stoken=${token}`);
    }

    async download(filenames: [string,string?][]): Promise<boolean> {
        const urls = await this.getDownloadUrls(filenames.map(x => x[0]));
        if (!urls) return false;
        for (let i=0;i<filenames.length;i++) {
            const url = urls[i];
            const name = filenames[i][1];
            downloadURI(url, name);
        }
        return true;
    }
}
