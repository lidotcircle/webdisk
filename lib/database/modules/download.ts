import { WDDatabase } from "../database";
import { Constructor } from "../utils";

export interface IDBDownload {
}


function MixinFunction<T extends Constructor<Object>>(Base: T) { //{
    const Parent = Base as unknown as Constructor<WDDatabase>; //}

class MixinedDatabase extends Parent implements IDBDownload {
    constructor(...args){
        super(...args);
    }
}

    return MixinedDatabase as Constructor<MixinedDatabase & InstanceType<T>>; //{
} //}


export const DB_Download = MixinFunction as (v: any) => any;

