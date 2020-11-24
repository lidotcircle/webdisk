import * as fs from 'fs';
import * as utils from './utils';
import * as proc from 'process';
import path from 'path';
import { constants } from './constants';

/*
 * config file format
 * {
 *   "listen_addr": <addr>,
 *   "listen_port": <port>,
 *   "sqlite3_database": <path>
 * }
 */


export class Config {
    private listen_addr: string      = '127.0.0.1';
    private listen_port: number      = 5445;
    private static_resources: string = 'resources';
    private sqlite3_database: string = '~/.webdisk/wd.db';

    private constructor() {};
    public static global_config: Config = new Config();

    public static async GetConfig(conf: string): Promise<void> {
        const data = await fs.promises.readFile(conf);
        const d = JSON.parse(data.toString());

        utils.assignTargetEnumProp(d, Config.global_config);
    }

    public get listenAddress() {
        return this.listen_addr;
    }
    public get listenPort() {
        return this.listen_port;
    }
    public get sqlite3Database() {
        let ans = this.sqlite3_database;
        if(this.sqlite3_database.startsWith('~')) {
            ans = proc.env.HOME + ans.substring(1);
        }
        return ans;
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
}

export const conf: Config = Config.global_config;

