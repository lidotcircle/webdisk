import { Injectable } from '../lib/di';
import assert from 'assert';


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

    constructor() {
        this.expired_queue = [];
    }

    public setval(key: string, val: any, duration_ms: number): void {
        const now = Date.now();
        const expiredAt = now + duration_ms;
        const info: ValueInfo = {
            value: val,
            expiredAt: expiredAt,
        };

        if (this.kvstores.has(key)) {
            this.clear(key);
        }

        this.kvstores.set(key, info);
        insert_into_sorted_array(this.expired_queue, [expiredAt,key], (a, b) => {
            return a[0] - b[0];
        });

        this.clean_expired(now);
    }

    private clean_expired(now: number) {
        const ub = lower_bound(this.expired_queue, now, (a, b) => {
            return a[0] - b <= 0 ? -1 : 1;
        });
        if (ub < this.expired_queue.length) {
            const expired = this.expired_queue.splice(0, ub + 1);
            for (const [_, key] of expired) {
                this.kvstores.delete(key);
            }
        }
    }

    public clear(key: string) {
        const info = this.kvstores.get(key);
        if (!info) return;
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
        assert(false, "unreachable");
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
