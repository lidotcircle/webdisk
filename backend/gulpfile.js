const gulp   = require('gulp');
const ts     = require('gulp-typescript');
const merge  = require('merge2');

const path       = require('path');
const proc       = require('process');
const child_proc = require('child_process');
const fs         = require('fs');

const killport  = require('kill-port');


const child_proc_list = [];
proc.on("exit", () => {
    child_proc_list.forEach(child => {
        child.kill();
    });
});

proc.on("SIGINT",  () => proc.exit(0));
proc.on("SIGTERM", () => proc.exit(0));

function onerror(err) {
    console.log(err.toString());
    this.emit("end");
}

const copy_stuff = [
    [ "./package.json", "." ],
    [ "./etc/**",        "etc" ],
    [ "./resources/**",  "resources" ],
]

function copy_stuff_task() {
    return merge(copy_stuff.map(
            srctrg => gulp.src(srctrg[0]).pipe(gulp.dest(path.join("release/", srctrg[1])))));
}

/** compile typescript with specified glob */
function compile_ts_dir(glob, destination, declaration = false, decl_dest = null) //{
{
    return function() {
        let ans;
        let ts_project = ts.createProject("./tsconfig.json", {
            declaration: declaration
        });

        let ts_pipe = gulp.src(glob)
            .pipe(ts_project()).on("error", onerror);
        if (declaration) {
            if (decl_dest == null) throw new Error("fix here");
            ans = merge([
                ts_pipe.js .pipe(gulp.dest(destination)),
                ts_pipe.dts.pipe(gulp.dest(decl_dest))
            ]);
        } else {
            ans = ts_pipe.js.pipe(gulp.dest(destination));
        }

        return new Promise((resolve, reject) => {
            let end = false;
            const _reject =  (err) => {
                if(end) return;
                end = true;
                reject(err)
            }
            const _resolve = () => {
                if(end) return;
                end = true;
                resolve();
            }
            ans.on('end',    () => _resolve());
            ans.on('finish', () => _resolve());
            ans.on('error',  (err) => _reject(err));
        });
    }
} //}

const ts_compile_stuff= [
    [ "bin/*.ts",           "bin" ],
    [ "lib/**/*.ts",        "lib" ],
    [ "entity/**/*.ts",     "entity" ],
    [ "repository/**/*.ts", "repository" ],
    [ "routes/**/*.ts",     "routes" ],
    [ "service/**/*.ts",    "service" ],
    [ "middleware/**/*.ts", "middleware" ],
    [ "index.ts",           "." ],
]
function ts_compile_task() {
    return Promise.all(ts_compile_stuff.map(
        srctrg => compile_ts_dir(srctrg[0], path.join("release/", srctrg[1]))()));
}
function chmod_bin_js() {
    fs.chmodSync(path.join("release/bin/main.js"), 0o755);
    return Promise.resolve();
}

gulp.task("release", gulp.series(copy_stuff_task, ts_compile_task, chmod_bin_js));


function stream2promise(stream) {
    return new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
    });
}

async function sleep(timeoutMS) {
    await new Promise(resolve => {
        setTimeout(() => resolve(), timeoutMS);
    });
}

async function try_watch(restart) //{
{
    const threshold = 2000;
    const tscwatch =  run_command_as_promise('npx', ['tsc', '-w', '--outDir', 'release']);
    const watcher = gulp.watch([
        "release/**/*.js", "resources/**"
    ]);
    let prevTime;
    const handle = async (fp, _) => {
        console.log(`----- file [${fp}]`);
        if (prevTime && (Date.now() - prevTime) < threshold) {
            return;
        }
        prevTime = Date.now();

        if (!fp.endsWith(".js")) {
            await(stream2promise(copy_stuff_task()));
        }
        await sleep(threshold);
        if(restart) await restart_backend_server();
    }
    watcher.on("change", handle);
    watcher.on("add", handle);
    watcher.on("error", onerror);
    await tscwatch;
} //}

let BackendProcessHandler = null;
let inkill = false;
async function restart_backend_server() //{
{
    if(BackendProcessHandler == null) {
        console.info('start backend server');
        return await new Promise((resolve, _) => {
            const child = child_proc.spawn('node', 
                ['./release/bin/main.js', '-c', './etc/webdisk.yaml', '-r', 'http://localhost:4200'], {
                    stdio: ['ignore', 'inherit', 'inherit'],
                    shell: true
                });
            child.once('exit', () => resolve());
            BackendProcessHandler = child;
            child_proc_list.push(child);
        });
    } else {
        if(inkill) return;
        inkill = true;
        await killport(5445, 'tcp');
        console.info('backend exit');
        BackendProcessHandler = null;
        restart_backend_server();
        inkill = false;
    }
} //}

async function serve() //{
{
    await killport(5445, 'tcp');
    const backend = restart_backend_server();
    try_watch(true);
    await backend;
} //}
gulp.task("serve", serve);

function run_command_as_promise(command, args, cwd) {
    return new Promise((resolve, reject) => {
        const child = child_proc.spawn(command, args, {
            cwd: cwd, 
            stdio: ['ignore', 'inherit', 'inherit'],
            shell: true
        });
        child.once('exit', (code, _) => {
            if(code == 0) {
                resolve();
            } else {
                reject();
            }
        });
        child_proc_list.push(child);
    });
}
gulp.task("test", async () => {
    await run_command_as_promise("npx", 
                                ["jest", "--detectOpenHandles", "--forceExit", "--rootDir", "."],
                                proc.cwd());
});

