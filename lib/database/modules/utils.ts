import { WDDatabase } from "../database";
import { Constructor } from "../utils";
import path from 'path';

export interface IDBUtils {
    resolvePathByUid(uid: number, filepath: string): Promise<string>;
    resolvePathByToken(token: string, filepath: string): Promise<string>;
}


function MixinFunction<T extends Constructor<Object>>(Base: T) { //{
    const Parent = Base as unknown as Constructor<WDDatabase>; //}

class MixinedDatabase extends Parent implements IDBUtils {

    constructor(...args) //{
    {
        super(...args);
        this.preconditions.push(async () => {
        });
    } //}

    async resolvePathByUid(uid: number, filepath: string): Promise<string> //{
    {
        const user = await this.getUserRecordByUid(uid);
        return path.join(user.rootPath, filepath);
    } //}

    async resolvePathByToken(token: string, filepath: string): Promise<string> //{
    {
        const uid = await this.checkToken(token);
        return await this.resolvePathByUid(uid, filepath);
    } //}
}

    return MixinedDatabase as Constructor<MixinedDatabase & InstanceType<T>>; //{
} //}


export const DB_Utils = MixinFunction as (v: any) => any;

