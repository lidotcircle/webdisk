import { Injectable } from '@angular/core';


@Injectable({
    providedIn: 'root'
})
export class ObjectSharingService {
    private objstore: Map<number,any>;
    private objcount: number;
    constructor() {
        this.objcount = 0;
        this.objstore = new Map();
    }

    store(val: object): number {
        const ans = ++this.objcount;
        this.objstore.set(ans, val);
        return ans;
    }

    load(key: number): any {
        return this.objstore.get(key);
    }

    loadClear(key: number): any {
        const ans = this.objstore.get(key);
        this.objstore.delete(key);
        return ans;
    }
}

