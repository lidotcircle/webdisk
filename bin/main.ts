#!/usr/bin/env node

import * as http_server   from '../lib/http_server';
import * as constants     from '../lib/constants';
import * as child_process from 'child_process';
import * as process       from 'process';
import * as timer         from 'timers';
import * as proc          from 'process';

import { Config, conf } from '../lib/config';
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

let config_file = options["c"];
let daemonized  = options["d"];


function main() //{
{
    Config.GetConfig(config_file).then(() => {
        let server = new http_server.HttpServer();

        server.on("error", (err) => {
            throw err;
        });
        server.on("listening", () => {
            console.log(`listening at ${conf.listenAddress}:${conf.listenPort}`)
        });
        server.listen(conf.listenPort, conf.listenAddress);
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

