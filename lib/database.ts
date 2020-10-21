import * as sqlite from 'sqlite3';
import * as path from 'path';
import * as os from 'os';


export module DBRelations {
    export class User {
        uid: number;
        username: string;
        password: string;
        rootPath: string;
        ring: number;
        invitationCode: string;
    }

    export class InvitationCode {
        ownerUid: number;
        invitationCode: string;
        invitedUid: number;
    }
}
const KEY_USER = 'users';
const KEY_INVITATION = 'invitation';

const RootUserInfo: DBRelations.User = new DBRelations.User();
RootUserInfo.uid            = 1,
RootUserInfo.username       = 'administrator',
RootUserInfo.password       = 'f447b20a7fcbf53a5d5be013ea0b15af', // MD5 of 123456
RootUserInfo.rootPath       = '/',
RootUserInfo.ring           = 0,
RootUserInfo.invitationCode = 'ROOT_DOESNT_NEED_INVITATION_CODE'

const RootInvitation: DBRelations.InvitationCode = new DBRelations.InvitationCode();
RootInvitation.ownerUid       = RootUserInfo.uid,
RootInvitation.invitationCode = RootUserInfo.invitationCode,
RootInvitation.invitedUid     = RootUserInfo.uid

type SQLFiled = string | number | null | undefined;
function mergeToTuple(values: SQLFiled[], escapeString: boolean = false) {
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
}

export function createSQLInsertion(relation: Function, records: any[], ignore: string[] = []): string {
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
}

export class Database {
    private m_database: sqlite.Database;

    constructor(db: string) {
        this.m_database = new sqlite.Database(db);
    }

    private __init__(cb) {
        this.m_database.run('PRAGMA FOREIGN_KEYS=ON', err => {
            if (err) return cb(err);

            this.m_database.get(`
                SELECT name from sqlite_master
                WHERE
                    type='table' AND name='${KEY_USER}';`,
                (err, data) => {
                if (err) return cb(err);
                if (data) return cb(null);

                this.m_database.run('PRAGMA FOREIGN_KEYS=OFF', err => {
                    if(err) return cb(err);

                    this.m_database.run(`
                    CREATE TABLE ${KEY_USER} (
                        uid      INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT(128) NOT NULL UNIQUE,
                        password TEXT(256) NOT NULL,
                        rootPath TEXT(512) NOT NULL,
                        ring     INTEGER NOT NULL CHECK(ring >= 0),
                        invitationCode TEXT(256) NOT NULL,
                        FOREIGN KEY (invitationCode) references ${KEY_INVITATION}(invitationCode)
                    );`, err => {
                        if (err) return cb(err);

                        this.m_database.run(`
                        CREATE TABLE ${KEY_INVITATION} (
                            ownerUid INTEGER NOT NULL,
                            invitationCode TEXT(256) PRIMARY KEY,
                            invitedUid INTEGER,
                            FOREIGN KEY (ownerUid)   references ${KEY_USER}(uid),
                            FOREIGN KEY (invitedUid) references ${KEY_USER}(uid)
                        );`, err => {
                            if (err) return cb(err);

                            let insert_data = createSQLInsertion(DBRelations.User, [RootUserInfo]);
                            this.m_database.run(`INSERT INTO ${KEY_USER} ${insert_data};`, err => {
                                if (err) return cb(err);

                                let insert_data = createSQLInsertion(DBRelations.InvitationCode, [RootInvitation]);
                                this.m_database.run(`INSERT INTO ${KEY_INVITATION} ${insert_data};`, err => {
                                    if(err) return cb(err);

                                    this.m_database.run('PRAGMA FOREIGN_KEYS=ON', err => {
                                        if(err) return cb(err);

                                        cb(null);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }

    init(): Promise<void> {
        return new Promise((resolve, fail) => {
            this.__init__(err => {
                if (err) return fail(err);
                else resolve();
            });
        });
    }
}

