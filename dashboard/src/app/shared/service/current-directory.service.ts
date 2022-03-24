import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class CurrentDirectoryService {
    private _cwd: string;
    private _cwdSubject: Subject<string> = new Subject<string>();
    get cwd(): Observable<string> {
        return new Observable<string>(observer => {
            this._cwdSubject.subscribe(observer);
            if (this._cwd)
                observer.next(this._cwd);
        });
    }

    constructor() {}

    public cd(dir: string) {
        this._cwd = dir;
        this._cwdSubject.next(this._cwd);
    }

    public justRefresh() {
        if (this._cwd)
            this._cwdSubject.next(this._cwd);
    }

    public get now(): string {return this._cwd;}
}
