import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { copyTextToClipboard } from '../utils';

export enum ClipboardContentType {
    text,
    files
}

@Injectable({
    providedIn: 'root'
})
export class ClipboardService {
    private data: any;
    private iscut: boolean = false;
    private subject_recv_data: Subject<{iscut: boolean, data: any}> = new Subject();
    private _contenttype: ClipboardContentType;
    get recvdata(): Observable<{iscut: boolean, data: any}> {return this.subject_recv_data;}
    get contenttype() {return this._contenttype;}

    constructor() { }

    async copy(ctype: ClipboardContentType, obj: any): Promise<boolean> {
        this._contenttype = ctype;
        this.data = obj;
        this.iscut = false;
        let ans = true;

        if(this._contenttype == ClipboardContentType.text) {
            ans = await copyTextToClipboard(obj);
        }

        this.subject_recv_data.next({iscut: false, data: this.data});
        return ans;
    }

    cut(ctype: ClipboardContentType, obj: any) {
        this._contenttype = ctype;
        this.data = obj;
        this.iscut = true;
        this.subject_recv_data.next({iscut: true, data: this.data});
    }

    paste(hook: (iscut: boolean, data: any) => void) {
        if(this.data == null) {
            throw new Error('paste empty content');
        }

        hook(this.iscut, this.data);

        if(this.iscut) {
            this.data = null;
            this._contenttype = null;
        }
    }

    peek() {
        return !!this.data ? {iscut: this.iscut, data: this.data} : null;
    }
}

