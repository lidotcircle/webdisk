import { Injectable } from '../lib/di';
import assert from 'assert';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';


function lower_bound(array: any[], value: any, comparator: (a: any, b: any) => number) {
    let low = 0;
    let high = array.length;
    while (low < high) {
        const mid = (low + high) >> 1;
        if (comparator(array[mid], value) < 0) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}

function insert_into_sorted_array(array: any[], value: any, comparator: (a: any, b: any) => number) {
    const index = lower_bound(array, value, comparator);
    array.splice(index, 0, value);
}


interface ValueInfo {
    value: any;
    expiredAt: number;
}
@Injectable({
    lazy: true,
})
export class SimpleExpiredStoreService {
    private kvstores: Map<string,ValueInfo> = new Map();
    private expired_queue: Array<[number,string]>;
    private cleaner_timeout: any;
    private next_cleaning_time: number;

    private setvalSubjects: Map<string,Subject<any>>;
    private clearSubjects: Map<string,Subject<any>>;
    private expiredSubjects: Map<string,Subject<any>>;

    onSetval(key: string): Observable<any> {
        if (!this.setvalSubjects.has(key))
            this.setvalSubjects.set(key, new Subject());
        return this.setvalSubjects.get(key);
    }

    onClear(key: string): Observable<any> {
        if (!this.clearSubjects.has(key))
            this.clearSubjects.set(key, new Subject());
        return this.clearSubjects.get(key);
    }

    onExpired(key: string): Observable<any> {
        if (!this.expiredSubjects.has(key))
            this.expiredSubjects.set(key, new Subject());
        return this.expiredSubjects.get(key);
    }

    onClearOrExpired(key: string): Observable<any> {
        return new Observable(subscriber => {
            const s1 = this.onClear(key).subscribe(subscriber);
            const s2 = this.onExpired(key).subscribe(subscriber);
            return () => { s1.unsubscribe(); s2.unsubscribe(); };
        });
    }

    onChange(key: string): Observable<{ etype: string, value: any}> {
        return new Observable(subscriber => {
            const e1 = this.onSetval(key)
                            .pipe(map(e => { return { etype: 'set', value: e}; }))
                            .subscribe(subscriber);
            const e2 = this.onClear(key)
                            .pipe(map(e => { return { etype: 'clear', value: e}; }))
                            .subscribe(subscriber);
            const e3 = this.onExpired(key)
                            .pipe(map(e => { return { etype: 'expired', value: e}; }))
                            .subscribe(subscriber);
            return () => { e1.unsubscribe(); e2.unsubscribe(); e3.unsubscribe(); };
        });
    }

    onKey(key: string): Observable<any> {
        return new Observable(subscriber => {
            const val = this.getval(key);
            if (val)
                subscriber.next(val);

            return this.onSetval(key).subscribe(subscriber);
        });
    }

    constructor() {
        this.expired_queue = [];
        this.setvalSubjects = new Map();
        this.clearSubjects = new Map();
        this.expiredSubjects = new Map();
    }

    private ensure_cleaner() {
        if (this.expired_queue.length == 0) {
            return;
        }

        if (!this.cleaner_timeout || this.next_cleaning_time > this.expired_queue[0][0]) {
            if (this.cleaner_timeout) {
                clearTimeout(this.cleaner_timeout);
                this.cleaner_timeout = null;
            }

            const cleaningTime = this.expired_queue[0][0];
            this.next_cleaning_time = cleaningTime;
            const waitingTime = Math.max(this.next_cleaning_time - Date.now(), 0);
            this.cleaner_timeout = setTimeout(() => {
                this.clean_expired(cleaningTime);
            }, waitingTime);
        }
    }

    public setval(key: string, val: any, duration_ms: number): void {
        const now = Date.now();
        const expiredAt = now + duration_ms;
        const info: ValueInfo = {
            value: val,
            expiredAt: expiredAt,
        };

        if (this.kvstores.has(key)) {
            this.clear_internal(key);
        }

        this.kvstores.set(key, info);
        insert_into_sorted_array(this.expired_queue, [expiredAt,key], (a, b) => {
            return a[0] - b[0];
        });

        if (this.setvalSubjects.get(key))
            this.setvalSubjects.get(key).next(val);

        this.ensure_cleaner();
    }

    private clean_expired(now: number) {
        this.cleaner_timeout = null;
        this.next_cleaning_time = null;

        const ub = lower_bound(this.expired_queue, now, (a, b) => {
            return a[0] - b <= 0 ? -1 : 1;
        });
        if (ub > 0) {
            assert(this.expired_queue[ub - 1][0] <= now);
            const expired = this.expired_queue.splice(0, ub);
            for (const [_, key] of expired) {
                const val = this.kvstores.get(key);
                this.kvstores.delete(key);
                if (this.expiredSubjects.has(key)) {
                    this.expiredSubjects.get(key).next(val);
                }
            }
        }

        this.ensure_cleaner();
    }

    private clear_internal(key: string): [boolean,any] {
        const info = this.kvstores.get(key);
        if (!info) return [false,info];
        this.kvstores.delete(key);

        const lb = lower_bound(this.expired_queue, info.expiredAt, (a, b) => {
            return a[0] - b;
        });
        assert(lb < this.expired_queue.length);

        for (let i = lb; i < this.expired_queue.length && this.expired_queue[i][0] == info.expiredAt; i++) {
            if (this.expired_queue[i][1] === key) {
                this.expired_queue.splice(i, 1);
                break;
            }
        }

        return [true,info];
    }

    public clear(key: string) {
        const ci = this.clear_internal(key);
        if (ci[0] && this.clearSubjects.get(key)) {
            this.clearSubjects.get(key).next(ci[1].value);
        }
    }

    public getval<T>(key: string): T {
        if (this.kvstores.has(key)) {
            const info = this.kvstores.get(key);
            if (info.expiredAt > Date.now()) {
                return info.value;
            }
        }

        return null;
    }
}
