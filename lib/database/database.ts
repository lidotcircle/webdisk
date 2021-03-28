import sqlite from 'sqlite3';
import proc   from 'process';
import fs     from 'fs';
import path   from 'path';
import assert from 'assert';
import { makeid, validation, assignTargetEnumProp, cons } from '../common/utils';
import { NameEntry, Token, UserInfo, UserPermission } from '../common/db_types';
import { debug, info, warn, error } from '../logger';
import { ErrorMSG } from '../common/string';
import { Config } from '../config';
import { DBRelations } from './relations';
import { createSQLInsertion } from './utils';
const MD5 = require('md5');

import { INVITAION_CODE_LENGTH, KEY_INVITATION, KEY_USER, RootInvitation, RootUserInfo } from './constants';

import { DB_Download,       IDBDownload }       from './modules';
import { DB_UserSettings,   IDBUserSettings }   from './modules';
import { DB_NamedEntry,     IDBNamedEntry }     from './modules';
import { DB_ShortTermToken, IDBShortTermToken } from './modules';
import { DB_Token,          IDBToken }          from './modules';
import { DB_Utils,          IDBUtils }          from './modules';
import { DB_StorePass,      IDBStorePass }      from './modules';

import { EventEmitter } from 'events';
import { Injectable, ProvideDependency, ResolveInitPromises } from '../di';
import { ResolvePathInConfig } from '../utils';


export type Database = WDDatabase & IDBToken & IDBUserSettings & IDBNamedEntry & IDBShortTermToken & IDBDownload & IDBStorePass;
type precond = () => Promise<void>;

export interface WDDatabase {
    on(event: 'select', listener: (tables: string[], sql: string) => void): this;
    on(event: 'update', listener: (table : string  , sql: string) => void): this;
    on(event: 'insert', listener: (table : string  , sql: string) => void): this;
    on(event: 'delete', listener: (table : string  , sql: string) => void): this;

    on(event: 'init', listener: () => void): this;
}

@Injectable({
    afterInit: async (obj: WDDatabase) => await obj.init(),
//    lazy: false,
})
@DB_Utils
@DB_StorePass
@DB_Download
@DB_NamedEntry
@DB_ShortTermToken
@DB_UserSettings
@DB_Token
export class WDDatabase extends EventEmitter {
    private m_database: sqlite.Database;
    protected preconditions: precond[] = [];

    constructor(private config: Config) {
        super();
    }

    protected async run(sql: string): Promise<void> //{
    {
        return await new Promise((resolve, reject) => {
            this.m_database.run(sql, err => {
                if(err) return reject(err);
                else    return resolve();
            });
        });
    } //}

    protected async get<T=any>(sql: string): Promise<T> //{
    {
        return await new Promise((resolve, reject) => {
            this.m_database.get(sql, (err, data) => {
                if(err) return reject(err);
                else    return resolve(data);
            });
        });
    } //}

    protected async all<T=any>(sql: string): Promise<T[]> //{
    {
        return await new Promise((resolve, reject) => {
            this.m_database.all(sql, (err, datas) => {
                if(err) return reject(err);
                else    return resolve(datas);
            });
        });
    } //}

    private async init_user_and_inv(): Promise<void> //{
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
                            invitationCode TEXT(256) NOT NULL UNIQUE,
                            createTime INTEGER NOT NULL CHECK(createTime > 0),
                            FOREIGN KEY (invitationCode) references ${KEY_INVITATION}(invitationCode));`);
        await this.run(`CREATE TABLE ${KEY_INVITATION} (
                            ownerUid INTEGER NOT NULL,
                            invitationCode TEXT(256) PRIMARY KEY,
                            permission TEXT NOT NULL,
                            invitedUid INTEGER,
                            FOREIGN KEY (ownerUid)   references ${KEY_USER}(uid),
                            FOREIGN KEY (invitedUid) references ${KEY_USER}(uid));`);

        let insert_data_user = createSQLInsertion(DBRelations.User, [RootUserInfo]);
        await this.run(`INSERT INTO ${KEY_USER} ${insert_data_user};`);

        let insert_data_invite = createSQLInsertion(DBRelations.InvitationCode, [RootInvitation]);
        await this.run(`INSERT INTO ${KEY_INVITATION} ${insert_data_invite};`);

        await this.run('PRAGMA FOREIGN_KEYS=ON');
    } //}

    private _init_: boolean = false;
    async init(): Promise<void> //{
    {
        assert.equal(this._init_, false, 'double init');
        this._init_ = true;
        const db_path = ResolvePathInConfig(this.config.sqlite3_database, this.config.ConfigPath);

        if(!path.isAbsolute(db_path)) {
            throw new Error(`require absolute path: '${db_path}'`);
        }
        fs.mkdirSync(path.dirname(db_path), {recursive: true});
        this.m_database = new sqlite.Database(db_path);

        await this.init_user_and_inv();

        for(const precond of this.preconditions) {
            await precond();
        }

        this.m_database.on("trace", sql => this.tracesql(sql));
        info('initialize database success');
        this.emit('init');
    } //}
    get initialized(): boolean {return this._init_;}

    private tracesql(sql: string) //{
    {
        sql = sql.trim();
        const op = sql.substr(0, Math.min(sql.length, 6)).toLowerCase();
        switch(op) {
            case 'select': {
                const m = sql.match(/[fF][rR][oO][mM]\s+((\w+\s*([aA][sS]\s+\w+)?,?\s*)+)[wW][hH][eE][rR][eE]/);
                const tables = [];
                if(!!m) {
                    const ts = m[1];
                    const tts = ts.split(',');
                    for(let t of tts) {
                        t = t.trim();
                        const m = t.match(/(\w+)(\s+[aA][sS])?/);
                        t = m[1];
                        tables.push(t);
                    }
                    this.emit('select', tables, sql);
                } else {
                    debug('unrecognized select', sql);
                }
            } break;
            case 'update': {
                const m = sql.match(/[uU][pP][dD][aA][tT][eE]\s+(\w+)/);
                if(!!m) {
                    this.emit('update', m[1], sql);
                } else {
                    debug('unrecognized update', sql);
                }
            } break;
            case 'insert': {
                const m = sql.match(/[iI][nN][sS][eE][rR][tT]\s+[iI][nN][tT][oO]\s+(\w+)/);
                if(!!m) {
                    this.emit('insert', m[1], sql);
                } else {
                    debug('unrecognized insert', sql);
                }
            } break;
            case 'delete': {
                const m = sql.match(/[dD][eE][lL][eE][tT][eE]\s+[fF][rR][oO][mM]\s+(\w+)/);
                if(!!m) {
                    this.emit('delete', m[1], sql);
                } else {
                    debug('unrecognized delete', sql);
                }
            } break;

            default:
                debug('unrecognized sql', sql);
        }
    } //}


    protected async checkToken(token: Token): Promise<number> //{
    {
        throw new Error(ErrorMSG.NotImplemented);
    } //}

    protected async removeTokenByUid(uid: number): Promise<void> //{
    {
        throw new Error(ErrorMSG.NotImplemented);
    } //}


    protected async getUserRecordByUsername(username: string): Promise<DBRelations.User> //{
    {
        const data = await this.get(`SELECT * FROM ${KEY_USER} WHERE username='${username}'`);
        if(!data) {
            throw new Error(ErrorMSG.UserNotFound);
        }
        return data;
    } //}

    protected async getUserRecordByUid(uid: number): Promise<DBRelations.User> //{
    {
        assert.equal(uid >= 0, true);
        const data = await this.get(`SELECT * FROM ${KEY_USER} WHERE uid=${uid}`);
        if(!data) {
            throw new Error(ErrorMSG.AuthenticationFail);
        }
        return data;
    } //}

    protected async getUserRecordByToken(token: Token): Promise<DBRelations.User> //{
    {
        const uid = await this.checkToken(token);
        const perm = await this.getPermisstionByUid(uid);
        if(!perm.enable) {
            throw new Error(ErrorMSG.AccountBeSuspended);
        }
        return await this.getUserRecordByUid(uid);
    } //}

    async getUserInfo(token: Token): Promise<UserInfo> //{
    {
        const data = await this.getUserRecordByToken(token);
        let ans = new UserInfo();
        assignTargetEnumProp(data, ans);
        return ans;
    } //}

    async getUserinfoByInvcode(token: Token, invcode: string): Promise<UserInfo> //{
    {
        const ownerUid = await this.checkToken(token);
        const data = await this.get(`SELECT invitedUid FROM ${KEY_INVITATION}
                                     WHERE ownerUid=${ownerUid} AND invitationCode='${invcode}';`);
        if(!data || !data['invitedUid']) {
            throw new Error(ErrorMSG.NotFound);
        }

        const vvv = await this.getUserRecordByUid(data['invitedUid']);
        let ans = new UserInfo();
        assignTargetEnumProp(vvv, ans);
        return ans;
    } //}


    private   async getPermisstionByInvCode(code: string): Promise<UserPermission> //{
    {
        const data = await this.get(`SELECT permission FROM ${KEY_INVITATION}
                                     WHERE invitationCode='${code}';`);
        if(!data || !data['permission']) {
            throw new Error('bad invitation code, can\'t find this');
        }
        return UserPermission.fromString(data['permission']);
    } //}

    protected async getPermisstionByUid(uid: number): Promise<UserPermission> //{
    {
        const data = await this.get(`SELECT invitationCode FROM ${KEY_USER}
                                     WHERE uid='${uid}';`);
        return await this.getPermisstionByInvCode(data['invitationCode']);
    } //}

    async getPermission(token: Token, invcode: string): Promise<UserPermission> //{
    {
        const uid = await this.checkToken(token);
        const data = await this.get(`SELECT permission FROM ${KEY_INVITATION}
                               WHERE invitationCode='${invcode}' AND ownerUid=${uid};`);
        if(!data || !data['permission']) {
            throw new Error(ErrorMSG.PermissionDenied);
        }
        return UserPermission.fromString(data['permission']);
    } //}

    async setPermission(token: Token, invcode: string, newperm: {[key: string]: any}): Promise<void> //{
    {
        if(invcode == RootUserInfo.invitationCode) {
            throw new Error(ErrorMSG.PermissionDenied + ': modify root user is very danger');
        }
        const uid = await this.checkToken(token);
        const data = await this.get(`SELECT permission FROM ${KEY_INVITATION}
                                     WHERE ownerUid=${uid} AND invitationCode='${invcode}';`);
        if(!data || !data['permission']) {
            throw new Error(ErrorMSG.PermissionDenied);
        }
        const oldperm = UserPermission.fromString(data['permission']);
        if(!UserPermission.validPartial(newperm)) {
            throw new Error(ErrorMSG.BadFormat);
        }
        assignTargetEnumProp(newperm, oldperm);

        const ownerPerm = await this.getPermisstionByUid(uid);
        if(!UserPermission.lessequal(oldperm, ownerPerm)) {
            throw new Error(ErrorMSG.PermissionDenied);
        }
        const permjson = JSON.stringify(oldperm);
        await this.run(`UPDATE ${KEY_INVITATION} SET permission='${permjson}' WHERE invitationCode='${invcode}';`);
    } //}


    async addUser(username: string, password: string, invitation: string): Promise<void> //{
    {
        if(!validation.name(username) || !validation.password(password)) {
            throw new Error(ErrorMSG.BadUsernamePassword);
        }

        const data = await this.get(`SELECT uid FROM ${KEY_USER} WHERE username='${username}';`);
        if(data) {
            throw new Error(ErrorMSG.UserHasExisted);
        }

        const dx = await this.get(`SELECT ownerUid, permission, invitedUid FROM ${KEY_INVITATION}
                                   WHERE invitationCode='${invitation}';`);
        if(!dx || dx['invitedUid']) {
            throw new Error(ErrorMSG.InvalidInvCode);
        }
        const permission = UserPermission.fromString(dx['permission']);

        let user = new DBRelations.User();
        user.invitationCode = invitation;
        user.username = username;
        user.password = MD5(password);
        user.createTime = Date.now();

        const dy = await this.getUserRecordByUid(dx['ownerUid']);

        user.rootPath = path.join(dy.rootPath, permission.relativePath);
        const insert  = createSQLInsertion(DBRelations.User, [user], ['uid']);
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
            throw err;
        }
    } //}

    async removeUser(token: Token, username: string, password: string): Promise<void> //{
    {
        const info = await this.getUserRecordByToken(token);
        if(info.username == username && info.password == MD5(password)) {
            await this.removeUserByUid(info.uid);
        } else {
            throw new Error(ErrorMSG.BadUsernamePassword);
        }
    } //}

    private async removeUserByUid(uid: number): Promise<void> //{
    {
        if(uid <= 1) {
            throw new Error(ErrorMSG.CantRemoveRootUser);
        }

        try {
            await this.run('BEGIN TRANSACTION;');
            await this.run(`UPDATE ${KEY_INVITATION} SET invitedUid=NULL WHERE invitedUid=${uid};`);
            await this.run(`DELETE FROM ${KEY_USER} WHERE uid=${uid};`);
            await this.run('COMMIT;');
        } catch(err) {
            await this.run('ROLLBACK;');
            throw err;
        }

    } //}
    

    async changePassword(token: Token, oldPassword: string, newPassword: string): Promise<void> //{
    {
        const user = await this.getUserRecordByToken(token);
        if(!user) {
            throw new Error(ErrorMSG.AuthenticationFail);
        }

        if(user.password == MD5(oldPassword) && validation.password(newPassword)) {
            const md5_new = MD5(newPassword);
            await this.run(`UPDATE ${KEY_USER} SET password='${md5_new}' WHERE uid=${user.uid}`);
            await this.removeTokenByUid(user.uid);
        } else {
            throw new Error(ErrorMSG.BadOldPasswordOrNewPassword);
        }
    } //}

    async resetPassword(username: string, newPassword: string, invitationCode: string): Promise<void> //{
    {
        const record = await this.get(`SELECT * FROM ${KEY_USER} WHERE username='${username}';`) as DBRelations.User;
        if(!record) {
            throw new Error(ErrorMSG.PermissionDenied);
        }
        // ADMINISTRATOR SHOULD RESET PASSWORD BY DIRECTLY MODIFYING DB
        if(record.uid == RootUserInfo.uid) {
            throw new Error(ErrorMSG.PermissionDenied);
        }

        if(record.invitationCode == invitationCode) {
            await this.run(`UPDATE ${KEY_USER} SET password='${MD5(newPassword)}' WHERE uid=${record.uid};`);
            await this.removeTokenByUid(record.uid);
        } else {
            throw new Error(ErrorMSG.InvalidInvCode);
        }
    } //}


    async generateInvitationCode(token: Token, n: number): Promise<void> //{
    {
        const uid = await this.checkToken(token);
        const perm = await this.getPermisstionByUid(uid);
        if(perm.exceedInvQuota(n)) {
            throw new Error(ErrorMSG.ExceedQuota)
        }

        const da = await this.all(`SELECT COUNT(*) FROM ${KEY_INVITATION} WHERE ownerUid=${uid};`);
        const total = n + da["COUNT(*)"];
        if(perm.exceedInvQuota(total)) {
            throw new Error(ErrorMSG.ExceedQuota)
        }
        const permstr = JSON.stringify(UserPermission.inherit(perm));

        let objs: DBRelations.InvitationCode[] = [];
        for(let i=0;i<n;i++) {
            let obj = new DBRelations.InvitationCode();
            obj.invitationCode = makeid(INVITAION_CODE_LENGTH);
            obj.permission = permstr;
            obj.ownerUid = uid;
            obj.invitedUid = null;
            objs.push(obj);
        }

        const insert = createSQLInsertion(DBRelations.InvitationCode, objs);
        await this.run(`INSERT INTO ${KEY_INVITATION} ${insert};`);
    } //}

    async getInvitationCodes(token: Token): Promise<[string, number][]> //{
    {
        const uid = await this.checkToken(token);

        const datas = await this.all(`SELECT invitationCode, invitedUid from ${KEY_INVITATION} WHERE ownerUid=${uid};`);
        return datas.map(dt => [dt["invitationCode"], dt["invitedUid"]]);
    } //}

    async deleteInvitationCode(token: Token, code: string): Promise<void> //{
    {
        const uid = await this.checkToken(token);

        if(token == RootUserInfo.invitationCode) {
            throw new Error("can't delete root invitation code");
        }

        await this.run(`DELETE FROM ${KEY_INVITATION} WHERE ownerUid='${uid}' AND invitationCode='${code}';`);
    } //}


    async GetUser(): Promise<any[]> {
        return await this.all(`SELECT * FROM ${KEY_USER};`);
    }

    async GetInvitationCode(): Promise<any[]> {
        return await this.all(`SELECT * FROM ${KEY_INVITATION};`);
    }


    protected async allowRedirectByUID(uid: number): Promise<boolean> //{
    {
        if(!this.config.allow_http_redirect) return false;

        const permission = await this.getPermisstionByUid(uid);
        const settings = await (this as any).getUserSettingsByUid(uid); // TODO
        return permission.allowHttpRedirect && settings.HttpRedirect;
    } //}

    async allowRedirectByUsername(username: string): Promise<boolean> //{
    {
        const user = await this.getUserRecordByUsername(username);
        return await this.allowRedirectByUID(user.uid);
    } //}
}

