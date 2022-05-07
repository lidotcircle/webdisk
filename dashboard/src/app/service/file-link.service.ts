import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RESTfulAPI } from '../restful';
import { path } from '../shared/common';


const API = RESTfulAPI.FileLink;
@Injectable({
    providedIn: 'root'
})
export class FileLinkService {
    constructor(private http: HttpClient) {}

    public async newlink(filepath: string, justPath?: boolean): Promise<string> {
        const fileid =  (await this.http.post(API.FileId, {}, {
            params: {
                filepath: filepath
            }
        }).toPromise() as { fileid: string }).fileid;

        const link = `${API.File}/${fileid}?filename=${encodeURIComponent(path.basename(filepath))}`;
        if (justPath) {
            const pro = link.indexOf('://');
            const nv = pro >= 0 ? link.substring(pro+3) : link;
            const ux = nv.indexOf('/');
            return ux >= 0 ? nv.substring(ux) : nv;
        } else {
            return link;
        }
    }
}

