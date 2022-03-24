#!/usr/bin/env node

import * as child_process from 'child_process';
import * as process       from 'process';
import * as timer         from 'timers';
import * as proc          from 'process';
import { Config } from '../service/config-service';
import { info } from '../service/logger-service';
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
    ProvideDependency(null, {name: "config-path", object: config_file});
    ProvideDependency(null, {name: "webroot", object: webroot});
    const config = await AsyncQueryDependency(Config);
    await ResolveInitPromises();
    if (!config) {
        console.log("Failed to load config");
        proc.exit(1);
    }
    await require('../index').ExpressAppListen(
        config.listen_port, 
        config.listen_addr, 100, () => {
        info(`listening on ${config.listen_addr}:${config.listen_port}`);
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

