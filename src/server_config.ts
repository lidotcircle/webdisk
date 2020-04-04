/* parse config file */

import * as fs from 'fs';

class User {
    public UserName: string;
    public Password: string;
    public SID:      string;
    public DocRoot:  string;
};

interface IServerConfig {
    GetProfile(name: string): User;
    ParseFile(): void;
    WriteBack(): void;

    set(user: string, key: string, val: string): void;
    get(user: string, key: string): string;

    parsed(): boolean;

    LookupUserRootBySID(sid: string);
};

/*
 * Config File Specify
 * {
 *     Users: [
 *         {
 *             UserName: <string>,
 *             Password: <string>,
 *             SID: <string>,
 *             DocRoot: <string>
 *         }
 *     ]
 * }
 */
export class ServerConfig implements IServerConfig {
    private configFile: string;
    private users: Map<string, User>;
    private _parsed: boolean;

    constructor (ConfigFile: string) {
        this.configFile = ConfigFile;
        this.users = null;
        this._parsed = false;
    }

    public GetProfile(name: string): User {
        return this.users.get(name);
    }

    public async ParseFile() {
        let fd: fs.promises.FileHandle;
        try {
            fd = await fs.promises.open(this.configFile, "r");
            let data = JSON.parse(await fd.readFile("utf8"));
            if (data["Users"] == null) throw new Error("format error");
            for (let i of data["Users"]) {
                this.users.set(i["UserName"], i);
            }
            this._parsed = true;
        } finally {
            if (fd != null)
                fd.close();
        }
    }

    public async WriteBack() {
        let fd: fs.promises.FileHandle;
        try {
            fd = await fs.promises.open(this.configFile, "w");
            await fd.writeFile(JSON.stringify(this.users, null, 1));
        } finally {
            fd.close();
        }
    }

    public set(user: string, key: string, val: string) {
        let profile = this.users.get(user);
        if (profile == null) throw new Error(`user (${user}) doesn't exist`);
        profile[key] = val;
    }

    public get(user: string, key: string): string {
        let profile = this.users.get(user);
        if (profile == null) throw new Error(`user (${user}) doesn't exist`);
        return profile[key];
    }

    public parsed(): boolean {
        return this._parsed;
    }

    public LookupUserRootBySID(sid: string) {
        for (let vv of this.users) {
            if(vv[1].SID == sid) return vv[1];
        }
        return null;
    }
}
