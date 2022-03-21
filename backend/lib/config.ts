import * as fs from 'fs';
import * as utils from './utils';
import * as proc from 'process';
import path from 'path';
import { FileSystem, FileSystemType, IFileSystemConfig } from './fileSystem/fileSystem';
import * as yaml from 'js-yaml';
import { Injectable } from './di/di';
import { CopySourcePropertiesAsGetter } from './utils';


class ConfigMap {
    listen_addr: string      = '127.0.0.1';
    listen_port: number      = 5445;
    static_resources: string = 'resources';
    password_salt: string    = 'salt';
    sqlite3_database: string = '~/.webdisk/wd.db';
    sqlite3_database2: string = '~/.webdisk/wd2.db';

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


export const ConfigPathProviderName = 'config-path';
@Injectable({
    paramtypes: [ConfigPathProviderName],
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
        CopySourcePropertiesAsGetter(d, this);
    } //}
    
    initialized(): boolean {return this.__init;}
};

