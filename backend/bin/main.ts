#!/usr/bin/env node

import { initializeDataSource, App } from '../index';
import * as http_server   from '../lib/http_server';
import * as child_process from 'child_process';
import * as process       from 'process';
import * as timer         from 'timers';
import * as proc          from 'process';
import { info } from '../lib/logger';
import { Config, ConfigPathProviderName } from '../lib/config';
import { AsyncQueryDependency, ProvideDependency, ResolveInitPromises } from '../lib/di';
import getopts from 'getopts';


const options = getopts(process.argv.slice(2), {
    alias: {
        d: "daemon",
        w: "webroot",
        c: "config",
        h: "help"
    },
    boolean: ["help"]
});

if (options["h"] == true) {
    console.log(`
    Usage:
        -d, --daemon
        -w, --webroot <webroot>
        -c, --config <config>
        -h, --help
    `);
    proc.exit(0);
}

let config_file: string  = options["c"];
let daemonized:  boolean = options["d"];
let webroot: string      = options["r"];

async function main() //{
{
    ProvideDependency(null, {name: ConfigPathProviderName, object: config_file});
    const config = await AsyncQueryDependency(Config);
    await initializeDataSource();

    let server = new http_server.HttpServer(webroot);
    server.on("error", (err) => {
        throw err;
    });
    server.on("listening", () => {
        info(`listening at ${config.listen_addr}:${config.listen_port}`)
    });
    await ResolveInitPromises();
    server.listen(config.listen_port, config.listen_addr);
    App.listen(4300, () => {
        info("express listening on port 4300");
    });
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

