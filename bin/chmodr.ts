#!/usr/bin/env node

import * as util from 'webdisk/lib/util';
import * as proc from 'process';

const getopt = require('node-getopt');

let __opt = getopt.create([
    ["d", "dir=<dir>",     "directory"],
    ["m", "mode=<mode>",   "file mode [xxx]"],
    ["r", "regex=<regex>", "regular expression, Javascript style", ".*"],
    ["l", "level=<level>", "depth",    "1"],
    ["h", "help",          "show this help"]
]);
let opt = __opt.bindHelp().parseSystem();
let options = opt.options;

if (options["h"] == true) {
    __opt.showHelp();
    proc.exit(0);
}

let dir   = options["d"];
let mode  = options["m"];
let regex = options["r"];
let level = parseInt(options["l"] || "");

if (dir == null || mode == null || level == NaN) {
    __opt.showHelp();
    proc.exit(1);
}

util.chmod_files(dir, mode, level, new RegExp(regex), (err, num) => {
    console.log(`change ${num} files`);
    if(err) throw err;
});

