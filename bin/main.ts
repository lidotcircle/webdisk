#!/usr/bin/env node

import * as http_server   from '../lib/http_server';
import * as child_process from 'child_process';
import * as process       from 'process';
import * as timer         from 'timers';
import * as proc          from 'process';
import { constants }      from '../lib/constants';
import { info } from '../lib/logger';
import { Config, ConfigPathProviderName } from '../lib/config';
import { AsyncQueryDependency, ProvideDependency, ResolveInitPromises } from '../lib/di';

const getopt = require('node-getopt');

let __opt = getopt.create([
    ["c", "config=<config file>",  "config file", constants.CONFIG_PATH],
    ["d", "daemon",                "daemonize"],
    ["h", "help",                  "show this help"]
]);

let opt = __opt.bindHelp().parseSystem();
let options = opt.options;

if (options["h"] == true) {
    __opt.showHelp();
    proc.exit(0);
}

let config_file: string  = options["c"];
let daemonized:  boolean = options["d"];

async function main() //{
{
    ProvideDependency(null, {name: ConfigPathProviderName, object: config_file});
    const config = await AsyncQueryDependency(Config);

    let server = new http_server.HttpServer();
    server.on("error", (err) => {
        throw err;
    });
    server.on("listening", () => {
        info(`listening at ${config.listen_addr}:${config.listen_port}`)
    });
    await ResolveInitPromises();
    server.listen(config.listen_port, config.listen_addr);
} //}

if (daemonized) {
    let child = child_process.execFile(process.argv[0], 
        [__filename, "-c", config_file],
        (err, stdout, stderr) => {
            if(err) throw err;
            stdout && console.log(stdout);
            stderr && console.error(stderr);
        });
    console.log("run webdisk daemon pid: ", child.pid);
    timer.setTimeout(() => process.exit(0), 1000);
} else {
    main();
}

