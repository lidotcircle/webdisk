import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { NotifierService } from './notifier.service';
import { UserDBService } from './user-db.service';

@Injectable({
    providedIn: 'root'
})
export class CurrentDirectoryService {
    private _cwd: Subject<string> = new Subject<string>();
    get cwd(): Observable<string> {return this._cwd;}

    private _history: string[] = [];
    get history(): string[] {return this._history.slice(0);}
    
    constructor(private notifier: NotifierService) {}

    private in_cd: boolean = false;
    private last: string = null;
    private inner_cd(dir: string) {
        if(this.in_cd) {
            this.last = dir;
            return;
        }
        this.in_cd = true;
        this._history.push(dir);
        this._cwd.next(dir);
    }

    private _back_history: string[] = [];
    public back(): void {
        if(this._history.length > 1) {
            this._back_history.push(this._history.pop());
            this.inner_cd(this._history.pop());
        } else {
            return;
        }
    }

    public forward(): void {
        if(this._back_history.length > 0)
            this.inner_cd(this._back_history.pop());
    }

    public cd(dir: string) {
        this._back_history = [];
        this.inner_cd(dir);
    }

    public confirmCD() {
        this.in_cd = false;

        if(this.last) {
            this.cd(this.last);
            this.last = null;
        }
    }

    public rejectCD() {
        this.in_cd = false;
        this.notifier.create({message: `cd fail`, duration: 3000});
        this.back();
    }

    public get inCD() {return this.in_cd;}

    public justRefresh() {
        this._cwd.next(this.now);
    }

    public get now(): string {return this._history[this._history.length - 1];}
    public get backable():    boolean {return this._history.length > 1;}
    public get forwardable(): boolean {return this._back_history.length > 0;}
}

