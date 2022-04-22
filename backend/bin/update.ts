#!/usr/bin/env node

import child_process from 'child_process';
import process       from 'process';
import fs            from 'fs';
import os            from 'os';
import path          from 'path';


interface CLIOptions {
    alias: { [short: string]: string };
    boolean?: string[];
};

function parse_options(argv: string[], options: CLIOptions): {[key: string]: string | boolean} {
    const ans = {};

    const booleans = options.boolean || [];
    const alias = options.alias;
    const bls = new Set();
    const longs = new Map<string,string>();
    const shorts = new Map<string,string>();
    for (const b of booleans) bls.add(b);

    for (const k of Object.getOwnPropertyNames(alias)) {
        const v = alias[k];
        shorts.set(k, v);
        if (v)
            longs.set(v, k);
    }

    for (let i=0;i<argv.length;i++) {
        const op = argv[i];
        if (op.startsWith("--")) {
            const l = op.substring(2);
            if (longs.has(l)) {
                const s = longs.get(l);
                if (bls.has(l) || bls.has(s)) {
                    ans[l] = true;
                    if (s) ans[s] = true;
                    continue;
                } else if (i + 1 < argv.length) {
                    i++;
                    ans[l] = argv[i];
                    if (s) ans[s] = argv[i];
                    continue;
                }
            }
        } else if (op.startsWith("-")) {
            const s = op.substring(1);
            if (shorts.has(s)) {
                const l = shorts.get(s);
                if (bls.has(l) || bls.has(s)) {
                    ans[s] = true;
                    if (l) ans[l] = true;
                    continue;
                } else if (i + 1 < argv.length) {
                    i++;
                    ans[s] = argv[i];
                    if (l) ans[l] = argv[i];
                    continue;
                }
            }
        }

        throw new Error(`bad cli '${op}'`);
    }

    return ans;
}

const options = parse_options(process.argv.slice(2), {
    alias: {
        v: "dir",
        l: "dirs",
        c: "cdir",
        h: "help",
        s: "spawn",
        a: "after",
        k: "acwd",
    },
    boolean: ["help", "spawn"]
});

function print_usage() {
    console.log(`
    Usage:
        -v, --dir   <dir>     directory contains updates
        -d, --dirs  <dirs>    update directories separated by comma
        -c, --cdir  <dir>     working directory
        -a, --after <cmd>     run cmd after updating
        -k, --acwd  <dir>     after cwd
        -s, --spawn           be spawned process, otherwise it will spawn same process in /tmp/xxxx
        -h, --help
    `);
}

if (options["h"] == true) {
    print_usage();
    process.exit(0);
}

const dir: string = options["dir"] as string;
const dirs: string = options["dirs"] as string;
const cdir: string = options["cdir"] as string || process.cwd();
const after: string = options["after"] as string;
const acwd: string = options["acwd"] as string;
const spawned: boolean = options["spawn"] as boolean;

if (!dir || !dirs || !cdir || !after || !acwd) {
    print_usage();
    process.exit(1);
}

if (!spawned) {
    const tfile = path.join(os.tmpdir(), path.basename(__filename));
    fs.copyFileSync(__filename, tfile);

    process.on("exit", function () {
        child_process.spawn(process.argv.shift(), 
            [
                tfile, "--spawn", "--dir", dir, "--dirs", dirs, "--cdir", cdir,
                       "--after", after, "--acwd", acwd
            ],
            {
                cwd: cdir,
                detached : true,
                stdio: "inherit"
            }
        );
    });
    process.exit();
}

async function main() {
    const d_dir = decodeURIComponent(dir);
    const d_dirs = decodeURIComponent(dirs);
    const d_cdir = decodeURIComponent(cdir);
    const st = await fs.promises.stat(d_dir);
    if (!st.isDirectory()) {
        throw new Error(`${d_dir} is not a directory`);
    }
    const update_dirs = d_dirs.split(',').map(decodeURIComponent);
    for (const d of update_dirs) {
        const origin = path.join(d_cdir, d);
        const newfs = path.join(d_dir, d);
        await ((fs.promises as any).rm || fs.promises.rmdir)(origin, { recursive: true });
        await fs.promises.rename(newfs, origin);
    }

    const d_after = after.split(",").map(v => decodeURIComponent(v));
    const d_acwd = decodeURIComponent(acwd);

    process.on("exit", function () {
        child_process.spawn(d_after.shift(), d_after, {
            cwd: d_acwd,
            detached : true,
            stdio: "inherit"
        });
    });
    process.exit();
}

main().catch(e => console.error(e));
