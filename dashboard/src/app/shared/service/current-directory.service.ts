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

    private inner_cd(dir: string) {
        this._cwd.next(dir);
        this._history.push(dir);
    }

    private _back_history: string[] = [];
    public back(): void {
        if(this._history.length > 0)
            this._history.pop();

        this.inner_cd(this._history.pop());
    }

    public forward(): void {
        if(this._back_history.length > 0)
            this.inner_cd(this._back_history.pop());
    }

    public cd(dir: string) {
        this._back_history = [];
        this.inner_cd(dir);
    }

    public justRefresh() {
        this._cwd.next(this.now);
    }

    public get now(): string {return this._history[this._history.length - 1];}
    public get backable():    boolean {return this._history.length > 1;}
    public get forwardable(): boolean {return this._back_history.length > 0;}
}

