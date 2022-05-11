import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class CurrentDirectoryService {
    private _cwd: string;
    private _cwdSubject: Subject<string> = new Subject<string>();
    private _cwdSubjectO2: Subject<string> = new Subject<string>();
    get cwd(): Observable<string> {
        return new Observable<string>(observer => {
            const subscription = this._cwdSubject.subscribe(observer);
            if (this._cwd)
                observer.next(this._cwd);
            return subscription;
        });
    }

    get betterCWD(): Observable<string> {
        return new Observable<string>(observer => {
            const subscription = this._cwdSubjectO2.subscribe(observer);
            if (this._cwd)
                observer.next(this._cwd);
            return subscription;
        }
        );
    }

    constructor() {
    }

    public cd(dir: string) {
        this._cwd = dir;
        this._cwdSubject.next(this._cwd);
        this._cwdSubjectO2.next(this._cwd);
    }

    public justRefresh() {
        this._cwdSubject.next(this._cwd || '/');
        this._cwdSubjectO2.next(this._cwd || '/');
    }

    public get now(): string {return this._cwd || '/';}

    public suggestWhere(dir: string) {
        if (this._cwd == dir) return;
        this._cwd = dir;
        this._cwdSubjectO2.next(this._cwd);
    }
}
