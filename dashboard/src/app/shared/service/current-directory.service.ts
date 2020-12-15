import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { UserDBService } from './user-db.service';

@Injectable({
    providedIn: 'root'
})
export class CurrentDirectoryService {
    private _cwd: Subject<string> = new Subject<string>();
    get cwd(): Observable<string> {return this._cwd;}

    private _history: string[] = [];
    get history(): string[] {return this._history.slice(0);}
    
    constructor() {}

    public cd(dir: string) {
        this._cwd.next(dir);
        this._history.push(dir);
    }

    public back(): string {
        if(this._history.length > 0)
            this._history.pop();
        return this._history.pop();
    }

    public justRefresh() {
        this._cwd.next(this.now);
    }

    public get now(): string {return this._history[this._history.length - 1];}
}

