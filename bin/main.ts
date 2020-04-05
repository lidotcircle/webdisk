#!/usr/bin/env node

import * as http_server   from 'webdisk/lib/http_server';
import * as util          from 'webdisk/lib/util';
import * as constants     from 'webdisk/lib/constants';
import * as server_config from 'webdisk/lib/server_config';
// import * as file_server from './lib/file_server';

import * as proc from 'process';

const getopt = require('node-getopt');

let __opt = getopt.create([
    ["h", "host=<listening addr>", "listening address", constants.DEFAULT_ADDR],
    ["p", "port=<listening port>", "listening port",    constants.DEFAULT_PORT],
    ["c", "config=<config file>",  "config file",       constants.CONFIG_PATH],
    ["h", "help",                  "show this help"]
]);

let opt = __opt.bindHelp().parseSystem();
let options = opt.options;

if (options["h"] == true) {
    __opt.showHelp();
    proc.exit(0);
}

let listen_port = parseInt(options["p"]);
let listen_addr = options["h"];
let config_file = options["c"];

let server = new http_server.HttpServer(config_file);
server.on("error", (err) => {
    throw err;
});
server.on("listening", () => {
    console.log(`listening at ${listen_addr}:${listen_port}`)
});
server.listen(listen_port, listen_addr);

