#!/usr/bin/env node

import * as http_server   from 'webdisk/lib/http_server';
import * as util          from 'webdisk/lib/util';
import * as constants     from 'webdisk/lib/constants';
import * as server_config from 'webdisk/lib/server_config';
import * as child_process from 'child_process';
import * as process from 'process';
import * as timer from 'timers';

import * as proc from 'process';

const getopt = require('node-getopt');

let __opt = getopt.create([
    ["a", "addr=<listening addr>", "listening address", constants.DEFAULT_ADDR],
    ["p", "port=<listening port>", "listening port",    constants.DEFAULT_PORT],
    ["c", "config=<config file>",  "config file",       constants.CONFIG_PATH],
    ["d", "daemon",                "daemonize"],
    ["h", "help",                  "show this help"]
]);

let opt = __opt.bindHelp().parseSystem();
let options = opt.options;

if (options["h"] == true) {
    __opt.showHelp();
    proc.exit(0);
}

let listen_port = parseInt(options["p"]);
let listen_addr = options["a"];
let config_file = options["c"];
let daemonized  = options["d"];


function main() //{
{
    let server = new http_server.HttpServer(config_file);
    server.on("error", (err) => {
        throw err;
    });
    server.on("listening", () => {
        console.log(`listening at ${listen_addr}:${listen_port}`)
    });
    server.listen(listen_port, listen_addr);
} //}

if (daemonized) {
    let child = child_process.execFile(process.argv[0], 
        [__filename, "-a", listen_addr, "-p", listen_port, "-c", config_file], 
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

