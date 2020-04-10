/* parse config file */

import * as fs from 'fs';

export class User {
    public UserName: string;
    public Password: string;
    public SID:      string;
    public DocRoot:  string;
};

interface IServerConfig {
    GetProfile(name: string): User;
    ParseFile(cb: (err) => void): void;
    WriteBack(cb: (err) => void): void;

    set(user: string, key: string, val: string): void;
    get(user: string, key: string): string;

    newUser(userName: string): boolean;

    parsed(): boolean;

    LookupUserRootBySID(sid: string);
};

/*
 * Config File Specify
 * {
 *     "Users": [
 *         {
 *             "UserName": <string>,
 *             "Password": <string>,
 *             "SID": <string>,
 *             "DocRoot": <string>
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
        this.users = new Map<string, User>();
        this._parsed = false;
    }

    public GetProfile(name: string): User {
        return this.users.get(name);
    }

    private __parseData(_data)
    {
        let data = JSON.parse(_data);
        if (data["Users"] == null) throw new Error("format error");
        for (let i of data["Users"]) {
            if (i["UserName"] == null) throw new Error("format error");
            this.users.set(i["UserName"], {
                UserName: i["UserName"],
                Password: i["Password"] || "",
                DocRoot:  i["DocRoot"]  || "/",
                SID:      i["SID"]      || ""
            });
        }
        this._parsed = true;
    }

    public ParseFile(cb: (err) => void = null) {
        let callback = (err) => {
            if (cb == null) {
                if (err == null) return;
                throw err;
            }
            cb(err);
        }
        fs.readFile(this.configFile, {encoding: "utf8", flag: "r"}, (err, data) => {
            if(err != null) return callback(err);
            try {
                this.__parseData(data);
            } catch (err) {
                return callback(err);
            }
            callback(null);
        });
    }

    private __write_back_data(): string {
        let _userJSON: any[] = [];
        for (let vv of this.users)
            _userJSON.push({
                UserName: vv[1].UserName,
                DocRoot:  vv[1].DocRoot,
                SID:      vv[1].SID,
                Password: vv[1].Password
            });
        return JSON.stringify({Users: _userJSON}, null, 1);
    }

    public WriteBack(cb: (err) => void = null) {
        let callback = (err) => {
            if (cb == null) {
                if (err == null) return;
                throw err;
            }
            cb(err);
        }
        let data: string;
        try {
            data = this.__write_back_data();
        } catch (err) {
            callback(err);
        }
        fs.writeFile(this.configFile, data, {encoding: "utf8", flag: "w"}, (err) => callback(err));
    }

    public set(user: string, key: string, val: string) {
        let profile = this.users.get(user);
        if (key == "UserName") {
            if (user == val) return;
            this.users.set(user, null);
            this.users.set(val, profile);
        }
        if (profile == null) throw new Error(`user (${user}) doesn't exist`);
        profile[key] = val;
    }

    public get(user: string, key: string): string {
        let profile = this.users.get(user);
        if (profile == null) throw new Error(`user (${user}) doesn't exist`);
        return profile[key];
    }

    public newUser(name: string, docroot: string = "/", password: string = ""): boolean {
        if (this.users.get(name) != null) return false;
        this.users.set(name, {
            UserName: name,
            DocRoot:  docroot,
            Password: password,
            SID:      ""
        });
        return true;
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

    public getUsers() {
        return new Map<string, User>(this.users);
    }
}
