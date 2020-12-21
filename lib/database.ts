import * as sqlite from 'sqlite3';
import * as proc from 'process';
import * as fs from 'fs';
import * as path from 'path';
import { makeid, validation, assignTargetEnumProp, cons, toInstanceOfType } from './common/utils';
import { NameEntry, Token, UserInfo } from './common/db_types';
import { debug, info, warn, error } from './logger';
import { UserSettings } from './common/user_settings';
const MD5 = require('md5');

/** TODO */
const LAST_ACTIVATION_SPAN       = (5 * 24 * 60 * 60 * 1000);
const SHORT_TERM_TOKEN_LIVE_TIME = cons.ShortTermTokenValidPeriod;
const MAX_INVITATION_CODE        = 20;
const INVITAION_CODE_LENGTH      = 56;
const TOKEN_LENGTH               = 56;

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

    export class ShortTermToken {
        token:   Token;
        ATtoken: Token;
        start:   number;
    }

    export class UserSettings {
        uid: number;
        settings: string;
    }

    export class FileEntryNameMapping extends NameEntry {
        uid: number;
    }
}
const KEY_USER = 'users';
const KEY_INVITATION = 'invitation';
const KEY_TOKEN = 'tokens';
const KEY_SHORTTERM_TOKEN = 'short_term_token';
const KEY_USER_SETTINGS = 'settings';
const KEY_FILE_ENTRY_MAPPING = 'entry_mapping';

const RootUserInfo: DBRelations.User = new DBRelations.User();
RootUserInfo.uid            = 1;
RootUserInfo.username       = 'administrator';
RootUserInfo.password       = 'e10adc3949ba59abbe56e057f20f883e'; // MD5 of 123456
RootUserInfo.rootPath       = proc.env["HOME"];
RootUserInfo.ring           = 0;
RootUserInfo.invitationCode = 'ROOT_DOESNT_NEED_INVITATION_CODE';
RootUserInfo.createTime     = Date.now();

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
    for(let i=0;i<records.length;i++) {
        const record = records[i]
        if(!(record instanceof relation)) {
            throw new Error('bad instance');
        }
        let np = [];
        for (let prop of keys) {
            np.push(record[prop]);
        }
        ans += mergeToTuple(np, true);
        if(i < records.length - 1)
            ans += ', ';
    }
    return ans;
} //}


export class Database {
    private m_database: sqlite.Database;

    constructor() {}

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

        await this.run(`CREATE TABLE IF NOT EXISTS ${KEY_SHORTTERM_TOKEN} (
            token   TEXT(256) PRIMARY KEY,
            ATtoken TEXT(256) NOT NULL,
            start   INTEGER   NOT NULL CHECK(start > 0),
            FOREIGN KEY (ATtoken) references ${KEY_TOKEN} (token) ON DELETE CASCADE);`);

        await this.run(`CREATE TABLE IF NOT EXISTS ${KEY_USER_SETTINGS} (
            uid INTEGER PRIMARY KEY,
            settings TEXT NOT NULL,
            FOREIGN KEY (uid) references ${KEY_USER}(uid) ON DELETE CASCADE);`);

        await this.run(`CREATE TABLE IF NOT EXISTS ${KEY_FILE_ENTRY_MAPPING} (
            name TEXT NOT NULL,
            uid INTEGER NOT NULL,
            destination TEXT NOT NULL,
            validEnd INTEGER NOT NULL,
            PRIMARY KEY(name),
            FOREIGN KEY(uid) references ${KEY_USER}(uid) ON DELETE CASCADE);`);
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
                            createTime INTEGER NOT NULL CHECK(createTime > 0),
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

    async init(db: string): Promise<void> //{
    {
        if(!path.isAbsolute(db)) {
            console.error(db);
            throw new Error("require absolute path");
        }
        fs.mkdirSync(path.dirname(db), {recursive: true});
        this.m_database = new sqlite.Database(db);

        await this.__init__();
        await this.ensure_tables();
        info('initialize database success');
    } //}


    private async checkToken(token: Token): Promise<number> //{
    {
        const now = Date.now();
        const data = await this.get(`SELECT uid, last FROM ${KEY_TOKEN} WHERE token='${token}';`);
        if(!data) return -1;

        if ((now - data.last) > LAST_ACTIVATION_SPAN) {
            await this.run(`DELETE FROM ${KEY_TOKEN} WHERE token='${token}';`);
            return -1;
        } else {
            await this.run(`UPDATE ${KEY_TOKEN} SET last=${now} WHERE token='${token}';`);
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


    async UserInfoByShortTermToken(stoken: Token): Promise<UserInfo> //{
    {
        console.log("asdf");
        const record = await this.get(`SELECT * FROM ${KEY_SHORTTERM_TOKEN} WHERE token='${stoken}';`) as DBRelations.ShortTermToken;
        if(!record) return null;

        const now = Date.now();
        if((now - record.start) > SHORT_TERM_TOKEN_LIVE_TIME) {
            await this.run(`DELETE FROM ${KEY_SHORTTERM_TOKEN} WHERE token='${stoken}';`);
            return null;
        } else {
            return await this.getUserInfo(record.ATtoken);
        }
    } //}

    async RequestShortTermToken(token: Token): Promise<Token> //{
    {
        const uid = await this.checkToken(token);
        if(uid < 0) return null;

        let obj = new DBRelations.ShortTermToken();
        obj.token = makeid(TOKEN_LENGTH);
        obj.start = Date.now();
        obj.ATtoken = token;
        let insert = createSQLInsertion(DBRelations.ShortTermToken, [obj]);
        await this.run(`INSERT INTO ${KEY_SHORTTERM_TOKEN} ${insert}`);

        return obj.token;
    } //}

    async DeleteShortTermToken(token: Token): Promise<void> //{
    {
        await this.run(`DELETE FROM ${KEY_SHORTTERM_TOKEN} WHERE token='${token}';`);
    } //}


    private async getUserRecordByUid(uid: number): Promise<DBRelations.User> //{
    {
        console.assert(uid >= 0);
        const data = await this.get(`SELECT * FROM ${KEY_USER} WHERE uid=${uid}`);
        return data;
    } //}

    private async getUserRecord(token: Token): Promise<DBRelations.User> //{
    {
        const uid = await this.checkToken(token);
        if(uid < 0) return null;

        return await this.getUserRecordByUid(uid);
    } //}

    async getUserInfo(token: Token): Promise<UserInfo> //{
    {
        const data = await this.getUserRecord(token);
        if(!data) return null;

        let ans = new UserInfo();
        assignTargetEnumProp(data, ans);
        return ans;
    } //}


    async login(username: string, password: string): Promise<Token> //{
    {
        const data = await this.get(`SELECT uid, password FROM ${KEY_USER} WHERE username='${username}';`);
        if(!data) return null;
        const uid: number = data["uid"];

        if(MD5(password) == data["password"]) {
            return await this.generateToken(uid);
        } else {
            return null;
        }
    } //}

    async logout(token: Token): Promise<void> //{
    {
        await this.run(`DELETE FROM ${KEY_TOKEN} WHERE token='${token}';`);
        return;
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
        user.createTime = Date.now();

        const dy = await this.get(`SELECT ring, rootPath FROM ${KEY_USER} WHERE uid=${dx["ownerUid"]};`);
        if(!dy) throw new Error("database error");

        user.ring     = dy["ring"];
        user.rootPath = dy["rootPath"];
        const insert  = createSQLInsertion(DBRelations.User, [user], ['uid']);
        let ans = true;
        try {
            await this.run('BEGIN TRANSACTION;');
            await this.run(`INSERT INTO ${KEY_USER} ${insert};`);
            const new_user = await this.get(`SELECT * FROM ${KEY_USER} WHERE username='${username}';`);
            await this.run(`UPDATE ${KEY_INVITATION} 
                            SET invitedUid=${new_user['uid']}
                            WHERE invitationCode='${new_user.invitationCode}';`);
            await this.run('COMMIT;');
        } catch (err) {
            await this.run('ROLLBACK;');
            ans = false;
        }
        return ans;
    } //}

    private async removeUserByUid(uid: number): Promise<boolean> //{
    {
        if(uid <= 1) return false;
        let ans: boolean = false;

        try {
            await this.run('BEGIN TRANSACTION;');
            await this.run(`UPDATE ${KEY_INVITATION} SET invitedUid=NULL WHERE invitedUid=${uid};`);
            await this.run(`DELETE FROM ${KEY_USER} WHERE uid=${uid};`);
            await this.run('COMMIT;');
            ans = true;
        } catch {
            await this.run('ROLLBACK;');
        }

        return ans;
    } //}

    async removeUser(token: Token, username: string, password: string): Promise<boolean> //{
    {
        const info = await this.getUserRecord(token);
        if(!info) return false;

        if(info.username == username && info.password == MD5(password)) {
            return await this.removeUserByUid(info.uid);
        } else {
            return false;
        }
    } //}

    private async removeTokenByUid(uid: number): Promise<void> //{
    {
        await this.run(`DELETE FROM ${KEY_TOKEN} WHERE uid=${uid};`);
    } //}
    
    async changePassword(token: Token, oldPassword: string, newPassword: string): Promise<boolean> //{
    {
        const user = await this.getUserRecord(token);
        if(!user) return false;

        if(user.password == MD5(oldPassword) && validation.password(newPassword)) {
            const md5_new = MD5(newPassword);
            await this.run(`UPDATE ${KEY_USER} SET password='${md5_new}' WHERE uid=${user.uid}`);
            await this.removeTokenByUid(user.uid);
            return true;
        } else {
            return false;
        }
    } //}

    async resetPassword(username: string, newPassword: string, invitationCode: string): Promise<boolean> //{
    {
        const record = await this.get(`SELECT * FROM ${KEY_USER} WHERE username='${username}';`) as DBRelations.User;
        // ADMINISTRATOR SHOULD RESET PASSWORD BY DIRECTLY MODIFYING DB
        if(record.uid == RootUserInfo.uid) return false;
        if(!record) return false;

        if(record.invitationCode == invitationCode) {
            await this.run(`UPDATE ${KEY_USER} SET password='${MD5(newPassword)}' WHERE uid=${record.uid};`);
            await this.removeTokenByUid(record.uid);
            return true;
        } else {
            return false;
        }
    } //}


    async generateInvitationCode(token: Token, n: number): Promise<boolean> //{
    {
        if(n > MAX_INVITATION_CODE) return false;
        const uid = await this.checkToken(token);
        if (uid < 0) return false;

        const da = await this.all(`SELECT COUNT(*) FROM ${KEY_INVITATION} WHERE ownerUid=${uid};`);
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


    async updateUserSettings(token: Token, settings: UserSettings): Promise<boolean> //{
    {
        const uid = await this.checkToken(token);
        if(uid < 0) return false;

        const str = JSON.stringify(settings);
        if (await this.getUserSettings(token) == null) {
            const setting = new DBRelations.UserSettings();
            setting.uid = uid;
            setting.settings = str;
            const insert_data = createSQLInsertion(DBRelations.UserSettings, [setting]);
            await this.run(`INSERT INTO ${KEY_USER_SETTINGS} ${insert_data};`);
        } else {
            await this.run(`UPDATE ${KEY_USER_SETTINGS} SET settings='${str}' WHERE uid=${uid};`);
        }
        return true;
    } //}

    async getUserSettings(token: Token): Promise<UserSettings> //{
    {
        const uid = await this.checkToken(token);
        if(uid < 0) return null;

        const data = await this.get(`SELECT * FROM ${KEY_USER_SETTINGS} WHERE uid=${uid}`);
        if (!!data) {
            const ans = JSON.parse(data["settings"]);
            return ans;
        } else {
            return null;
        }
    } //}


    async newEntryMapping(token: Token, entryName: string, destination: string, validPeriodMS: number = null): Promise<void> {
        validPeriodMS = validPeriodMS || 1000 * 60 * 60 * 24 * 365 * 20;
        const uid = await this.checkToken(token);
        if(uid < 0) return;

        let record = new DBRelations.FileEntryNameMapping();
        record.name = entryName;
        record.uid = uid;
        record.destination = destination;
        record.validEnd = validPeriodMS + Date.now();
        let insert_data = createSQLInsertion(DBRelations.FileEntryNameMapping, [record]);
        await this.run("INSERT INTO ${KEY_FILE_ENTRY_MAPPING} ${insert_data};");
    }

    async queryNameEntry(token: Token, name: string): Promise<NameEntry> {
        const uid = await this.checkToken(token);
        if(uid < 0) throw new Error('bad token');

        let ans: NameEntry[] = [];
        const q = await this.all(`SELECT * FROM ${KEY_FILE_ENTRY_MAPPING} WHERE uid=${uid} AND name='${name}';`);
        return toInstanceOfType(NameEntry, q) as NameEntry;
    }

    async queryAllNameEntry(token: Token): Promise<NameEntry[]> {
        const uid = await this.checkToken(token);
        if(uid < 0) throw new Error('bad token');

        let ans: NameEntry[] = [];
        const q = await this.all(`SELECT * FROM ${KEY_FILE_ENTRY_MAPPING} WHERE uid=${uid};`);
        for(const m of q) {
            ans.push(toInstanceOfType(NameEntry, m) as NameEntry);
        }
        return ans;
    }

    async deleteNameEntry(token: Token, name: string): Promise<void> {
        const uid = await this.checkToken(token);
        if(uid < 0) throw new Error('bad token');

        await this.run(`DELETE FROM ${KEY_FILE_ENTRY_MAPPING} WHERE name='${name}' AND uid=${uid};`);
    }

    async deleteAllNameEntry(token: Token): Promise<void> {
        const uid = await this.checkToken(token);
        if(uid < 0) throw new Error('bad token');

        await this.run(`DELETE FROM ${KEY_FILE_ENTRY_MAPPING} WHERE uid=${uid};`);
    }

    async queryValidNameEntry(name: string): Promise<{userinfo: UserInfo, destination: string}> {
        const _record = await this.get(`SELECT * FROM ${KEY_FILE_ENTRY_MAPPING} WHERE name='${name}';`);
        if(!_record) return null;

        const record = toInstanceOfType(DBRelations.FileEntryNameMapping, _record) as DBRelations.FileEntryNameMapping;
        if(!record.uid || !record.destination || !record.validEnd || record.validEnd < Date.now() || record.uid < 0) return null;
        const userinfo = await this.getUserRecordByUid(record.uid);
        if(!userinfo) return null;
        return {
            userinfo: userinfo,
            destination: record.destination
        };
    }


    async GetUser(): Promise<any[]> {
        return await this.all(`SELECT * FROM ${KEY_USER};`);
    }

    async GetInvitationCode(): Promise<any[]> {
        return await this.all(`SELECT * FROM ${KEY_INVITATION};`);
    }

    async ShowToken(): Promise<any[]> {
        return await this.all(`SELECT * FROM ${KEY_TOKEN};`);
    }
}

