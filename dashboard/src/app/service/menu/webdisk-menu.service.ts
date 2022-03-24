import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class WebdiskMenuService {
    constructor() {
    }

    public menuOnReady(): Observable<void> {
        return new Observable(subscriber => {
            subscriber.next();
        });
    }

    test(_: string): boolean {
        return true;
    }
}

