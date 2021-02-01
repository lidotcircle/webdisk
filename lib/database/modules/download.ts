import { KEY_DOWNLOAD, KEY_USER } from "../constants";
import { WDDatabase } from "../database";
import { Constructor, createSQLInsertion } from "../utils";
import { DBRelations } from "../relations";
import { DownloadTask } from "../../common/db_types";
import { ErrorMSG } from "../../common/string";
import { IDBUtils } from "./utils";
import { assignTargetEnumProp } from "../../utils";

export interface IDBDownload {
    /** this methold is slightly diffirent with other exported methods, 
     *  it's call by download module instead of USER RPC */
    CreateNewTask(token: string, task: DownloadTask): Promise<number>;

    DeleteTask(token: string, taskid: number): Promise<void>;
    QueryTasksByToken(token: string): Promise<DownloadTask[]>;


    AssertTaskExists(token: string, taskid: number): Promise<void>;

    QueryUnfinishTasks(limit: number): Promise<DownloadTask[]>;

    PushContent(taskid: number, newlength: number): Promise<void>;

    TaskOver(taskid: number, fail: boolean): Promise<void>;
}


function MixinFunction<T extends Constructor<Object>>(Base: T) { //{
    const Parent = Base as unknown as Constructor<WDDatabase & IDBUtils>; //}

class MixinedDatabase extends Parent implements IDBDownload {

    constructor(...args) //{
    {
        super(...args);
        this.preconditions.push(async () => {
            await this.run(`CREATE TABLE IF NOT EXISTS ${KEY_DOWNLOAD} (
              taskId INTEGER PRIMARY KEY AUTOINCREMENT,
              uid INTEGER NOT NULL,
              url TEXT NOT NULL,
              name TEXT,
              size INTEGER,
              partial BOOLEAN NOT NULL,
              finish BOOLEAN NOT NULL,
              fail BOOLEAN NOT NULL,
              downloaded INTEGER,
              temporaryFile TEXT NOT NULL,
              destination TEXT NOT NULL,
              FOREIGN KEY(uid) references ${KEY_USER}(uid) ON DELETE CASCADE);`);
        });
    } //}

    async CreateNewTask(token: string, task: DownloadTask): Promise<number> //{
    {
        const uid = await this.checkToken(token);
        task.destination = await this.resolvePathByUid(uid, task.destination);

        const perm = await this.getPermisstionByUid(uid);
        if(!perm.offlineDownload) {
            throw new Error(ErrorMSG.AuthenticationFail);
        }

        const dtask = new DBRelations.StreamDownloadTask();
        assignTargetEnumProp(task, dtask);
        dtask.uid = uid;
        const insertData = createSQLInsertion(DBRelations.StreamDownloadTask, [dtask], ['taskId']);

        await this.run(`INSERT INTO ${KEY_DOWNLOAD} ${insertData};`);
        const ans = await this.get(`SELECT last_insert_rowid() FROM ${KEY_DOWNLOAD};`);
        if(!ans['last_insert_rowid()']) {
            throw new Error(ErrorMSG.BadFormat);
        }

        return Number(ans['last_insert_rowid()']);
    } //}

    async DeleteTask(token: string, taskid: number): Promise<void> //{
    {
        await this.run(`DELETE FROM ${KEY_DOWNLOAD} WHERE taskid=${taskid}`);
    } //}

    async QueryTasksByToken(token: string): Promise<DownloadTask[]> //{
    {
        return await this.all<DBRelations.StreamDownloadTask>(`SELECT * FROM ${KEY_DOWNLOAD} WHERE uid=${token}`);
    } //}


    async AssertTaskExists(token: string, taskid: number): Promise<void> //{
    {
        const uid = await this.checkToken(token);
        const data = await this.get(`SELECT * FROM ${KEY_DOWNLOAD} WHERE uid=${uid} AND taskId=${taskid};`);
        if(!data) {
            throw new Error(ErrorMSG.NotFound);
        }
    } //}

    async QueryUnfinishTasks(limit: number): Promise<DownloadTask[]> //{
    {
        return await this.all<DBRelations.StreamDownloadTask>(`
            SELECT * FROM ${KEY_DOWNLOAD} WHERE finish=0 AND fail=0 LIMIT ${limit};`);
    } //}

    async PushContent(taskid: number, newlength: number): Promise<void> //{
    {
        await this.run(`UPDATE ${KEY_DOWNLOAD} SET downloaded=${newlength} WHERE taskId=${taskid};`);
    } //}

    async TaskOver(taskid: number, fail: boolean = false): Promise<void> //{
    {
        await this.run(`UPDATE ${KEY_DOWNLOAD} SET finish=${fail ? 0 : 1}, fail=${fail ? 1 : 0} WHERE taskId=${taskid};`);
    } //}
}

    return MixinedDatabase as Constructor<MixinedDatabase & InstanceType<T>>; //{
} //}


export const DB_Download = MixinFunction as (v: any) => any;

