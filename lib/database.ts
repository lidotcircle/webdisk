import * as sqlite from 'sqlite3';
import * as xutils from './xutils';
import * as MD5 from 'md5';
import { makeid, validation } from './xutils';

/** TODO */
const LAST_ACTIVATION_SPAN = (5 * 24 * 60 * 60 * 1000);
const MAX_INVITATION_CODE = 20;
const INVITAION_CODE_LENGTH = 56;
const TOKEN_LENGTH = 56;

export type Token = string;
export class UserInfo {
    username: string = null;
    rootPath: string = null;
    ring:     number = null;
}
export module DBRelations {
    export class User extends UserInfo {
        uid: number;
        password: string;
        invitationCode: string;
    }

    export class InvitationCode {
        ownerUid: number;
        invitationCode: string;
        invitedUid: number;
    }

    export class AuthenticationToken {
        token: Token;
        uid:   number;
        last:  number;
    }
}
const KEY_USER = 'users';
const KEY_INVITATION = 'invitation';
const KEY_TOKEN = 'tokens';

const RootUserInfo: DBRelations.User = new DBRelations.User();
RootUserInfo.uid            = 1;
RootUserInfo.username       = 'administrator';
RootUserInfo.password       = 'f447b20a7fcbf53a5d5be013ea0b15af'; // MD5 of 123456
RootUserInfo.rootPath       = '/';
RootUserInfo.ring           = 0;
RootUserInfo.invitationCode = 'ROOT_DOESNT_NEED_INVITATION_CODE';

const RootInvitation: DBRelations.InvitationCode = new DBRelations.InvitationCode();
RootInvitation.ownerUid       = RootUserInfo.uid;
RootInvitation.invitationCode = RootUserInfo.invitationCode;
RootInvitation.invitedUid     = RootUserInfo.uid;

type SQLFiled = string | number | null | undefined;
function mergeToTuple(values: SQLFiled[], escapeString: boolean = false) //{
{
    let ans = '(';

    for(let i=0;i<values.length;i++) {
        if (typeof(values[i]) == 'string' && escapeString) {
            ans += `'${values[i]}'`;
        } else {
            ans += values[i];
        }
        if(i != values.length-1) {
            ans += ', ';
        }
    }

    ans += ')';
    return ans;
} //}

export function createSQLInsertion(relation: Function, records: any[], ignore: string[] = []): string //{
{
    if (records.length == 0) {
        throw new Error('bad sql insert: without records');
    }

    let keys: string[] = [];
    if (!(records[0] instanceof relation)) {
        throw new Error('bad instance');
    }
    for (let prop in records[0]) {
        if(ignore.indexOf(prop) < 0) {
            keys.push(prop);
        }
    }
    let ans = mergeToTuple(keys);
    ans += ' VALUES ';
    for(let record of records) {
        if(!(record instanceof relation)) {
            throw new Error('bad instance');
        }
        let np = [];
        for (let prop of keys) {
            np.push(record[prop]);
        }
        ans += mergeToTuple(np, true);
    }
    return ans;
} //}

export class Database {
    private m_database: sqlite.Database;

    constructor(db: string) {
        this.m_database = new sqlite.Database(db);
    }

    private async run(sql: string): Promise<void> //{
    {
        return await new Promise((resolve, reject) => {
            this.m_database.run(sql, err => {
                if(err) return reject(err);
                else    return resolve();
            });
        });
    } //}

    private async get(sql: string): Promise<any> //{
    {
        return await new Promise((resolve, reject) => {
            this.m_database.get(sql, (err, data) => {
                if(err) return reject(err);
                else    return resolve(data);
            });
        });
    } //}

    private async all(sql: string): Promise<any[]> //{
    {
        return await new Promise((resolve, reject) => {
            this.m_database.all(sql, (err, datas) => {
                if(err) return reject(err);
                else    return resolve(datas);
            });
        });
    } //}

    private async ensure_tables() //{
    {
        await this.run(`CREATE TABLE IF NOT EXISTS ${KEY_TOKEN} (
                            token TEXT(256) PRIMARY KEY,
                            uid   INTEGER NOT NULL CHECK(uid >= 0),
                            last  INTEGER   NOT NULL CHECK(last > 0),
                            FOREIGN KEY (uid) references ${KEY_USER}(uid) ON DELETE CASCADE);`);
    } //}

    private async __init__(): Promise<void> //{
    {
        await this.run('PRAGMA FOREIGN_KEYS=ON');

        const da = await this.get(`SELECT name from sqlite_master
                                   WHERE type='table' AND name='${KEY_USER}';`);

        if(da) return;

        await this.run('PRAGMA FOREIGN_KEYS=OFF');
        await this.run(`CREATE TABLE ${KEY_USER} (
                            uid      INTEGER PRIMARY KEY AUTOINCREMENT,
                            username TEXT(128) NOT NULL UNIQUE,
                            password TEXT(256) NOT NULL,
                            rootPath TEXT(512) NOT NULL,
                            ring     INTEGER NOT NULL CHECK(ring >= 0),
                            invitationCode TEXT(256) NOT NULL UNIQUE,
                            FOREIGN KEY (invitationCode) references ${KEY_INVITATION}(invitationCode));`);
        await this.run(`CREATE TABLE ${KEY_INVITATION} (
                            ownerUid INTEGER NOT NULL,
                            invitationCode TEXT(256) PRIMARY KEY,
                            invitedUid INTEGER,
                            FOREIGN KEY (ownerUid)   references ${KEY_USER}(uid),
                            FOREIGN KEY (invitedUid) references ${KEY_USER}(uid));`);

        let insert_data_user = createSQLInsertion(DBRelations.User, [RootUserInfo]);
        await this.run(`INSERT INTO ${KEY_USER} ${insert_data_user};`);

        let insert_data_invite = createSQLInsertion(DBRelations.InvitationCode, [RootInvitation]);
        await this.run(`INSERT INTO ${KEY_INVITATION} ${insert_data_invite};`);

        await this.run('PRAGMA FOREIGN_KEYS=ON');
    } //}

    async init(): Promise<void> //{
    {
        await this.__init__();
        await this.ensure_tables();
    } //}

    private async checkToken(token: Token): Promise<number> //{
    {
        const now = Date.now();
        const data = await this.get(`SELECT uid, last FROM ${KEY_TOKEN} WHERE token='${token}';`);
        if(!data) return -1;

        if ((now - data.last) > LAST_ACTIVATION_SPAN) {
            await this.run(`DELETE ${KEY_TOKEN} WHERE token='${token}';`);
            return -1;
        } else {
            await this.run(`UPDATE FROM ${KEY_TOKEN} SET last=${now} WHERE token='${token}';`);
            return data['uid'];
        }
    } //}

    private async generateToken(uid: number): Promise<Token> //{
    {
        if (uid < 0) {
            throw new Error('Bad uid which must greater than 0');
        };

        let new_record = new DBRelations.AuthenticationToken();
        new_record.last  = Date.now();
        new_record.token = makeid(56);
        new_record.uid   = uid;
        const insert = createSQLInsertion(DBRelations.AuthenticationToken, [new_record]);
        await this.run(`INSERT INTO ${KEY_TOKEN} ${insert};`);

        return new_record.token;
    } //}

    private async getUserRecord(token: Token): Promise<DBRelations.User> //{
    {
        const uid = await this.checkToken(token);
        if(uid < 0) return null;

        const data = await this.get(`SELECT * FROM ${KEY_USER} WHERE uid=${uid}`);
        return data;
    } //}
    
    async logout(token: Token): Promise<void> //{
    {
        await this.run(`DELETE ${KEY_TOKEN} WHERE token='${token}';`);
        return;
    } //}

    async getUserInfo(token: Token): Promise<UserInfo> //{
    {
        const data = this.getUserRecord(token);
        if(!data) return null;

        let ans = new UserInfo();
        xutils.assignTargetEnumProp(data, ans);
        return ans;
    } //}

    private async removeUserByUid(uid: number): Promise<boolean> //{
    {
        if(uid <= 1) return false;
        let ans: boolean = false;

        try {
            await this.run('BEGIN TRANSACTION;');
            await this.run(`UPDATE FROM ${KEY_INVITATION} SET invitedUid=NULL WHERE invitedUid=${uid};`);
            await this.run(`DELETE ${KEY_USER} WHERE uid=${uid};`);
            await this.run('COMMIT;');
            ans = true;
        } catch {
            await this.run('ROLLBACK;');
        }

        return ans;
    } //}

    async login(username: string, password: string): Promise<Token> //{
    {
        const data = this.get(`SELECT uid, password FROM ${KEY_USER} WHERE username=${username};`);
        if(!data) return null;
        const uid: number = data["uid"];

        if(MD5(password) == data["password"]) {
            return await this.generateToken(uid);
        } else {
            return null;
        }
    } //}

    async addUser(username: string, password: string, invitation: string): Promise<boolean> //{
    {
        if(!validation.name(username) || !validation.password(password)) return false;

        const data = await this.get(`SELECT uid FROM ${KEY_USER} WHERE username='${username}';`);
        if(data) return false;

        const dx = await this.get(`SELECT ownerUid, invitedUid FROM ${KEY_INVITATION}
                                   WHERE invitationCode='${invitation}';`);
        if(!dx || dx['invitedUid']) return false;

        let user = new DBRelations.User();
        user.invitationCode = invitation;
        user.username = username;
        user.password = MD5(password);

        const dy = await this.get(`SELECT ring, rootPath FROM ${KEY_USER} WHERE uid=${data["ownerUid"]};`);
        if(!dy) throw new Error("database error");

        user.ring     = dy["ring"];
        user.rootPath = dy["rootPath"];
        const insert  = createSQLInsertion(DBRelations.User, [user], ['uid']);
        await this.run(`INSERT INTO ${KEY_USER} ${insert};`);
    } //}

    async removeUser(token: Token, username: string, password: string): Promise<boolean> //{
    {
        const info = await this.getUserRecord(token);
        if(!info) return false;

        if(info.username == username && info.password == MD5(password)) {
            await this.removeUserByUid(info.uid);
        } else {
            return false;
        }
    } //}

    async generateInvitationCode(token: Token, n: number): Promise<boolean> //{
    {
        if(n > MAX_INVITATION_CODE) return false;
        const uid = await this.checkToken(token);
        if (uid < 0) return false;

        const da = this.get(`SELECT COUNT(*) from ${KEY_INVITATION} WHERE ownerUid=${uid};`);
        const total = n + da["COUNT(*)"];
        if(total > MAX_INVITATION_CODE) return false;

        let objs: DBRelations.InvitationCode[] = [];
        for(let i=0;i<n;i++) {
            let obj = new DBRelations.InvitationCode();
            obj.invitationCode = makeid(INVITAION_CODE_LENGTH);
            obj.ownerUid = uid;
            obj.invitedUid = null;
            objs.push(obj);
        }

        const insert = createSQLInsertion(DBRelations.InvitationCode, objs);
        await this.run(`INSERT INTO ${KEY_INVITATION} ${insert};`);
        return true;
    } //}

    async getInvitationCodes(token: Token): Promise<[string, number][]> //{
    {
        const uid = await this.checkToken(token);
        if(uid < 0) return [];

        const datas = await this.all(`SELECT invitationCode, invitedUid from ${KEY_INVITATION} WHERE ownerUid=${uid};`);
        return datas.map(dt => [dt["invitationCode"], dt["invitedUid"]]);
    } //}

    async ShowUser(): Promise<void> {
        const users = await this.all(`SELECT * FROM ${KEY_USER};`);
        console.log(JSON.stringify(users, null, 2));
    }

    async ShowInvitationCode(): Promise<void> {
        const invites = await this.all(`SELECT * FROM ${KEY_INVITATION};`);
        console.log(JSON.stringify(invites, null, 2));
    }

    async ShowToken(): Promise<void> {
        const tokens = await this.all(`SELECT * FROM ${KEY_TOKEN};`);
        console.log(JSON.stringify(tokens, null, 2));
    }
}

