import { ErrorMSG } from "../../common/string";
import { toInstanceOfType } from "../../utils";
import { NameEntry, Token, UserInfo } from "../../common/db_types";
import { KEY_FILE_ENTRY_MAPPING, KEY_USER } from "../constants";
import { WDDatabase } from "../database";
import { DBRelations } from "../relations";
import { Constructor, createSQLInsertion } from "../utils";

export interface IDBNamedEntry {
    newEntryMapping(token: Token, entryName: string, destination: string, validPeriodMS: number): Promise<void>;
    queryNameEntry(token: Token, name: string): Promise<NameEntry>;
    queryAllNameEntry(token: Token): Promise<NameEntry[]>;
    deleteNameEntry(token: Token, name: string): Promise<void>;
    deleteAllNameEntry(token: Token): Promise<void>;
    queryValidNameEntry(name: string): Promise<{userinfo: UserInfo, destination: string, allowRedirect: boolean}>;
}


function MixinFunction<T extends Constructor<Object>>(Base: T) { //{
    const Parent = Base as unknown as Constructor<WDDatabase>;
//}

class MixinedDatabase extends Parent implements IDBNamedEntry {
    constructor(...args: any[]) //{
    {
        super(...args);

        this.preconditions.push(async () => {
            await this.run(`CREATE TABLE IF NOT EXISTS ${KEY_FILE_ENTRY_MAPPING} (
                name TEXT NOT NULL,
                uid INTEGER NOT NULL,
                destination TEXT NOT NULL,
                validEnd INTEGER NOT NULL,
                PRIMARY KEY(name),
                FOREIGN KEY(uid) references ${KEY_USER}(uid) ON DELETE CASCADE);`);
        });
    } //}

    async newEntryMapping(token: Token, entryName: string, destination: string, validPeriodMS: number = null): Promise<void> //{
    {
        validPeriodMS = validPeriodMS || 1000 * 60 * 60 * 24 * 365 * 20;
        const uid = await this.checkToken(token);
        const perm = await this.getPermisstionByUid(uid);
        const data = await this.all(`SELECT COUNT(*) FROM ${KEY_FILE_ENTRY_MAPPING} WHERE uid=${uid};`);
        if(data && perm.exceedLinkQuota(data['COUNT(*)'])) {
            throw new Error(ErrorMSG.ExceedQuota);
        }

        let record = new DBRelations.FileEntryNameMapping();
        record.name = entryName;
        record.uid = uid;
        record.destination = destination;
        record.validEnd = validPeriodMS + Date.now();
        let insert_data = createSQLInsertion(DBRelations.FileEntryNameMapping, [record]);
        await this.run(`INSERT INTO ${KEY_FILE_ENTRY_MAPPING} ${insert_data};`);
    } //}

    async queryNameEntry(token: Token, name: string): Promise<NameEntry> //{
    {
        const uid = await this.checkToken(token);

        let ans: NameEntry[] = [];
        const q = await this.all(`SELECT * FROM ${KEY_FILE_ENTRY_MAPPING} WHERE uid=${uid} AND name='${name}';`);
        return toInstanceOfType(NameEntry, q) as NameEntry;
    } //}

    async queryAllNameEntry(token: Token): Promise<NameEntry[]> //{
    {
        const uid = await this.checkToken(token);

        let ans: NameEntry[] = [];
        const q = await this.all(`SELECT * FROM ${KEY_FILE_ENTRY_MAPPING} WHERE uid=${uid};`);
        for(const m of q) {
            ans.push(toInstanceOfType(NameEntry, m) as NameEntry);
        }
        return ans;
    } //}

    async deleteNameEntry(token: Token, name: string): Promise<void> //{
    {
        const uid = await this.checkToken(token);

        await this.run(`DELETE FROM ${KEY_FILE_ENTRY_MAPPING} WHERE name='${name}' AND uid=${uid};`);
    } //}

    async deleteAllNameEntry(token: Token): Promise<void> //{
    {
        const uid = await this.checkToken(token);

        await this.run(`DELETE FROM ${KEY_FILE_ENTRY_MAPPING} WHERE uid=${uid};`);
    } //}

    async queryValidNameEntry(name: string): Promise<{userinfo: UserInfo, destination: string, allowRedirect: boolean}> //{
    {
        const _record = await this.get(`SELECT * FROM ${KEY_FILE_ENTRY_MAPPING} WHERE name='${name}';`);
        if(!_record) throw new Error(`without named link '${name}'`);

        const record = toInstanceOfType(DBRelations.FileEntryNameMapping, _record) as DBRelations.FileEntryNameMapping;
        if(!record.uid || !record.destination || !record.validEnd || record.validEnd < Date.now() || record.uid < 0) {
            throw new Error('bad record');
        }
        const userinfo = await this.getUserRecordByUid(record.uid);
        const redirect = await this.allowRedirectByUID(record.uid);
        return {
            userinfo: userinfo,
            destination: record.destination,
            allowRedirect: redirect
        };
    } //}
}

    return MixinedDatabase as Constructor<MixinedDatabase & InstanceType<T>>; //{
} //}


export const DB_NamedEntry = MixinFunction as (v: any) => any;

