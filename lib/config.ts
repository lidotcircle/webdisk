import * as fs from 'fs';
import * as utils from './utils';
import * as proc from 'process';
import path from 'path';
import { constants } from './constants';
import { FileSystem } from './fileSystem/fileSystem';
import { LocalFileSystem } from './fileSystem/localFileSystem';
import { Database } from './database';


class Config {
    private __init: boolean = false;
    private listen_addr: string      = '127.0.0.1';
    private listen_port: number      = 5445;
    private static_resources: string = 'resources';
    private sqlite3_database: string = '~/.webdisk/wd.db';
    private filesystem: {type: string, data?: {}} = {type: 'local'};

    private constructor() {};
    public static global_config: Config = new Config();

    /** this function call should await immediately */
    public static async GetConfig(conf: string): Promise<void> {
        const _this = Config.global_config;
        console.assert(_this.__init == false);
        _this.__init = true;

        const data = await fs.promises.readFile(conf);
        const d = JSON.parse(data.toString());
        utils.assignTargetEnumProp(d, _this);

        { 
            let dbpath = _this.sqlite3_database;
            if(_this.sqlite3_database.startsWith('~')) {
                dbpath = proc.env.HOME + dbpath.substring(1);
            }
            await _this.DB.init(dbpath);
        }
    }

    public get listenAddress() {
        return this.listen_addr;
    }
    public get listenPort() {
        return this.listen_port;
    }
    public get staticResources() {
        if (this.static_resources.startsWith('/')) {
            return this.static_resources;
        } else if (this.static_resources.startsWith('~')) {
            return proc.env.HOME + this.static_resources.substring(1);
        } else {
            return path.join(constants.rootdir, this.static_resources);
        }
    }

    private _db: Database;
    public get DB() {
        if(this._db == null) {
            this._db = new Database();
        }
        return this._db;
    }

    private fsabs: FileSystem;
    public get FSAbstraction(): FileSystem {
        if(this.fsabs) return this.fsabs;

        switch(this.filesystem.type) {
            case 'local': this.fsabs = new LocalFileSystem(); break;
        }

        if(this.fsabs == null) {
            throw new Error(`file system abstraction ${this.filesystem.type} isn't implemented`); 
        }
        return this.fsabs;
    }
}

export const conf: Config = Config.global_config;
export function GetConfig(configfile: string) {
    Config.GetConfig(configfile);
}

