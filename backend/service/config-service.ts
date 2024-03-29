import * as fs from 'fs';
import path from 'path';
import { FileSystemType, IFileSystemConfig } from '../lib/fileSystem/fileSystem';
import * as yaml from 'js-yaml';
import { Injectable } from '../lib/di/di';
import { ObjectFreezeRecursively } from '../lib/utils';
import assert from 'assert';


class ConfigMap {
    listen_addr: string      = '127.0.0.1';
    listen_port: number      = 5445;
    static_resources: string = 'resources';
    password_salt: string    = 'salt';
    sqlite3_database: string = '~/.webdisk/wd.db';

    jwt: {
        secret: string,
        expiresIn_s: number,
    } = {
        secret: 'secret',
        expiresIn_s: 60 * 10,
    };

    allow_http_redirect?: boolean = true;

    filesystem: IFileSystemConfig = {type: FileSystemType.local};

    logger?: {
        level?: string,
        console?: boolean,
        file?: string,
    } = {console: true};
};


function resolveHome(path: string): string {
    return path.replace(/^~/, process.env.HOME || process.env.USERPROFILE);
}


@Injectable({
    paramtypes: ["config-path"],
    afterInit: async (config: Config) => await config.init(),
})
export class Config extends ConfigMap {
    private __init: boolean = false;

    constructor(private config_path: string) {
        super();
    }

    get ConfigPath(): string {return this.config_path;}

    /** this function call should await immediately */
    async init(): Promise<void> //{
    {
        console.assert(this.__init == false, 'fail: init config twice');
        this.__init = true;

        const data = await fs.promises.readFile(this.config_path);
        let d: ConfigMap;
        const extension = path.extname(this.config_path);
        switch(extension) {
            case '.yaml':
            case '.yml':
                d = yaml.load(data.toString()) as ConfigMap;
                break;
        }

        const resolveDstHome = (obj: object) => {
            assert(typeof obj === 'object');
            const keys = Object.getOwnPropertyNames(obj);
            for (const key of keys) {
                const val = obj[key];
                if (key === 'dstPrefix' && typeof val === 'string') {
                    let resolved = resolveHome(val);
                    if (!resolved.endsWith('/'))
                        resolved += '/';
                    obj[key] = resolved;
                } else if (typeof val === 'object') {
                    resolveDstHome(val);
                }
            }
        }
        resolveDstHome(d.filesystem);

        d.sqlite3_database = resolveHome(d.sqlite3_database);
        Object.assign(this, d);
        ObjectFreezeRecursively(this);
    } //}
    
    initialized(): boolean {return this.__init;}
};

