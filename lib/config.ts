import * as fs from 'fs';
import * as utils from './utils';
import * as proc from 'process';
import path from 'path';
import { constants } from './constants';
import { FileSystem, FileSystemType, IFileSystemConfig } from './fileSystem/fileSystem';
import { LocalFileSystem } from './fileSystem/localFileSystem';
import { Database, createDB } from './database/database';
import { AliOSSFileSystem, IAliOSSFileSystemConfig } from './fileSystem/aliOssFileSystem';
import { IMultiFileSystemConfig, MultiFileSystem } from './fileSystem/multiFileSystem';
import * as yaml from 'js-yaml';


class Config {
    private __init: boolean = false;
    private config_path: string = '';
    private listen_addr: string      = '127.0.0.1';
    private listen_port: number      = 5445;
    private static_resources: string = 'resources';
    private sqlite3_database: string = '~/.webdisk/wd.db';
    private allow_http_redirect: boolean = true;
    private filesystem: IFileSystemConfig = {type: FileSystemType.local};

    private constructor() {};
    public static readonly global_config: Config = new Config();

    /** this function call should await immediately */
    public static async GetConfig(conf_file: string): Promise<void> {
        const _this = Config.global_config;
        _this.config_path = conf_file;
        console.assert(_this.__init == false, 'fail: init config twice');
        _this.__init = true;

        const data = await fs.promises.readFile(conf_file);
        let d;
        const extension = path.extname(conf_file);
        switch(extension) {
            case '.json': 
                d = JSON.parse(data.toString());
                break;
            case '.yaml':
            case '.yml':
                d = yaml.load(data.toString());
                break;
        }
        utils.assignTargetEnumProp(d, _this);

        { 
            let dbpath = _this.sqlite3_database;
            if(_this.sqlite3_database.startsWith('~')) {
                dbpath = proc.env.HOME + dbpath.substring(1);
            } else if(!_this.sqlite3_database.startsWith('/')) {
                dbpath = path.join(path.dirname(_this.config_path), _this.sqlite3_database);
            }
            await _this.DB.init(dbpath);
        }

        {
            const m = _this.FSAbstraction;
        }
    }
    private requireInit() //{
    {
        if(!this.__init) {
            throw new Error('config doesn\'t initialize');
        }
    } //}

    public get listenAddress() {
        this.requireInit();
        return this.listen_addr;
    }
    public get listenPort() {
        this.requireInit();
        return this.listen_port;
    }
    public get staticResources() {
        this.requireInit();
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
            this._db = createDB();
        }
        return this._db;
    }

    private fsabs: FileSystem;
    public get FSAbstraction(): FileSystem {
        this.requireInit();
        if(this.fsabs) return this.fsabs;

        switch(this.filesystem.type) {
            case FileSystemType.local:  this.fsabs = new LocalFileSystem(this.filesystem); break;
            case FileSystemType.alioss: this.fsabs = new AliOSSFileSystem(this.filesystem as IAliOSSFileSystemConfig); break;
            case FileSystemType.multi:  this.fsabs = new MultiFileSystem(this.filesystem as IMultiFileSystemConfig); break;
        }

        if(this.fsabs == null) {
            throw new Error(`file system abstraction ${this.filesystem.type} isn't implemented`); 
        }
        return this.fsabs;
    }

    public get AllowHttpRedirection(): boolean {return this.allow_http_redirect;}
}

export const conf: Config = Config.global_config;
export async function GetConfig(configfile: string) {
    await Config.GetConfig(configfile);
}

