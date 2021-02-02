import { ErrorMSG } from "../../common/string";
import { StorePassword, Token } from "../../common/db_types";
import { UserSettings } from "../../common/user_settings";
import { KEY_STORE_PASS, KEY_USER } from "../constants";
import { WDDatabase } from "../database";
import { DBRelations } from "../relations";
import { Constructor, createSQLInsertion } from "../utils";

export interface IDBStorePass {
    newPass(token: Token, where: string, account: string, pass: string): Promise<number>;
    getAllPass(token: Token): Promise<StorePassword[]>;
    deletePass(token: Token, passId: number): Promise<void>;
}
const UserSettingsCache: {[key: string]: UserSettings} = {};


function MixinFunction<T extends Constructor<Object>>(Base: T) { //{
    const Parent = Base as unknown as Constructor<WDDatabase>;
//}

class MixinedDatabase extends Parent implements IDBStorePass {
    constructor(...args: any[]) //{
    {
        super(...args);

        this.preconditions.push(async () => {
            await this.run(`
                CREATE TABLE IF NOT EXISTS ${KEY_STORE_PASS} (
                    passid INTEGER PRIMARY KEY AUTOINCREMENT,
                    uid INTEGER NOT NULL,
                    where TEXT NOT NULL,
                    account TEXT NOT NULL,
                    pass TEXT NOT NULL,
                    FOREIGN KEY (uid) references ${KEY_USER}(uid) ON DELETE CASCADE);`);
        });
    } //}

    async newPass(token: string, where: string, account: string, pass: string): Promise<number> //{
    {
        const uid = await this.checkToken(token);
        const record = new DBRelations.StoredPass();
        record.uid = uid;
        record.where = where;
        record.account = account;
        record.pass = pass;
        const ins = createSQLInsertion(DBRelations.StoredPass, [record], ['passid']);
        await this.run(`INSERT INTO ${KEY_STORE_PASS} ${ins};`);
        const ans = await this.get(`SELECT last_insert_rowid() FROM ${KEY_STORE_PASS};`);
        return Number(ans['last_insert_rowid()']);
    } //}
    async getAllPass(token: string): Promise<StorePassword[]> //{
    {
        const uid = await this.checkToken(token);
        return await this.all<StorePassword>(`SELECT * FROM ${KEY_STORE_PASS} WHERE uid=${uid};`);
    } //}
    async deletePass(token: string, passId: number): Promise<void> //{
    {
        const uid = await this.checkToken(token);
        const check = await this.get(`SELECT * FROM ${KEY_STORE_PASS} WHERE uid=${uid} passid=${passId};`);
        if(!check) {
            throw new Error(ErrorMSG.NotFound);
        }
        await this.run(`DELETE FROM ${KEY_STORE_PASS} WHERE passid=${passId};`);
    } //}
}

    return MixinedDatabase as Constructor<MixinedDatabase & InstanceType<T>>; //{
} //}


export const DB_StorePass = MixinFunction as (v: any) => any;

