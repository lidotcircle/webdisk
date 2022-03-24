
export enum StorageEvent {
    Change = "CHANGE"
}
export type StorageHook = (oldval: any, newval: any) => void;
type StorageKey = string;

export class CommonStorage {
    protected mStorage: Storage;
    private m_hooks: Map<StorageKey, Map<StorageEvent, StorageHook[]>>;

    public constructor() {
        this.m_hooks = new Map<StorageKey, Map<StorageEvent, StorageHook[]>>();
    }

    private getHooks(key: StorageKey, event: StorageEvent): StorageHook[] {
        if (!this.m_hooks.has(key)) {
            return null;
        }

        let events = this.m_hooks.get(key);
        if (!events.has(event)) {
            return null;
        }

        return events.get(event);
    }

    private fieldChanged(key: StorageKey, oldval: any, newval: any) {
        let hooks = this.getHooks(key, StorageEvent.Change);
        if (hooks) {
            for(let hook of hooks) {
                try {
                    hook(oldval, newval);
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }

    public subscribe(key: StorageKey, event: StorageEvent, hook: StorageHook) {
        if (!this.m_hooks.has(key)) {
            this.m_hooks.set(key, new Map<StorageEvent, StorageHook[]>());
        }

        let events = this.m_hooks.get(key);
        if (!events.has(event)) {
            events.set(event, []);
        }

        let hooks = events.get(event);
        hooks.push(hook);
    }

    public get<T>(key: string, defaultValue: T): T {
        if(this.mStorage == null) {
            console.warn("bad storage");
            return null;
        }

        let value = this.mStorage.getItem(key) as any;
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

    public set<T>(key: string, value: T) {
        if(this.mStorage == null) {
            console.warn("bad storage");
            return null;
        }
        let oldv = this.get(key, null);
        this.mStorage.setItem(key, JSON.stringify(value));
        if (oldv != value)
            this.fieldChanged(key, oldv, value);
    }

    public remove(key: string) {
        if(this.mStorage == null) {
            console.warn("bad storage");
            return null;
        }
        let oldv = this.get(key, null);
        this.mStorage.removeItem(key);

        if (oldv != null)
            this.fieldChanged(key, oldv, null);
    }
}

