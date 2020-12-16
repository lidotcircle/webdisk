import { ForwardMethod, TypeOfClassMethod } from '../utils';
import { DexieWrapper } from './IndexDBDexieWrapper';

interface StorageSubscription {
    unsubscribe();
}

class StorageSubscriptionInner implements StorageSubscription {
    callbackIndex: number;
    key: string;
    storage: AsyncKVStorageInner;

    public unsubscribe() {
        this.storage.removeSubscribe(this.key, this.callbackIndex);
    }
}
type hook = (() => void) | (() => Promise<void>);

class AsyncKVStorageInner {
    private mStorage: DexieWrapper;
    private hooks = new Map<string, [number,hook][]>();
    private callbackIndex: number = 0;
    private async invoke_hooks(key: string) {
        for(const h of this.hooks.get(key) || []) {
            try {
                let r = h[1].bind(null)();
                if (r instanceof Promise) {
                    await r;
                }
            } catch(err) {
                console.warn(err);
            }
        }
    }

    constructor(name: string) {
        this.mStorage = new DexieWrapper(name);
        this.mStorage.createTable({kvstorage: "&key, value"});
    }
    private get table() {return this.mStorage.table("kvstorage");}

    public subscribe(key: string, hook: hook): StorageSubscription {
        this.callbackIndex++;
        if (!this.hooks.has(key)) {
            this.hooks.set(key, []);
        }
        let h = this.hooks.get(key);
        h.push([this.callbackIndex, hook]);
        let ans = new StorageSubscriptionInner();
        ans.key = key;
        ans.callbackIndex = this.callbackIndex;
        ans.storage = this;
        return ans;
    }

    public removeSubscribe(key: string, n: number) {
        console.assert(this.hooks.has(key));
        let h = this.hooks.get(key);
        let i = -1;
        for(let j=0;j<h.length;j++) {
            if(h[j][0] == n) {
                i = j;
                break;
            }
        }
        console.assert(i >= 0);
        h = h.splice(i, 1);
        this.hooks.set(key, h);
    }

    public async get<T>(key: string, defaultValue: T=null): Promise<T> {
        let value;
        const result = await this.table.where({key: key}).toArray();
        if (result.length > 0) {
            console.assert(result.length == 1);
            value = result[0].value;
        }
        try {
            value = JSON.parse(value);
        } catch {
            value = null;
        }
        if (value === null && defaultValue) {
            value = defaultValue;
        }
        return value;
    }

    public async set<T>(key: string, value: T): Promise<void> {
        await this.table.put({key: key, value: value});
        await this.invoke_hooks(key);
    }

    public async remove(key: string): Promise<void> {
        await this.table.delete(key);
        await this.invoke_hooks(key);
    }

    public async clear(): Promise<void> {
        await this.table.clear();
    }
}

export class AsyncKVStorage {
    private inner: AsyncKVStorageInner;
    constructor(dbname: string) {
        this.inner = new AsyncKVStorageInner(dbname);
    }

    @ForwardMethod("inner", "subscribe")
    subscribe: TypeOfClassMethod<AsyncKVStorageInner, "subscribe">;

    @ForwardMethod("inner", "get")
    get: TypeOfClassMethod<AsyncKVStorageInner, "get">;

    @ForwardMethod("inner", "set")
    set: TypeOfClassMethod<AsyncKVStorageInner, "set">;

    @ForwardMethod("inner", "remove")
    remove: TypeOfClassMethod<AsyncKVStorageInner, "remove">;

    @ForwardMethod("inner", "clear")
    clear: TypeOfClassMethod<AsyncKVStorageInner, "clear">;
}

