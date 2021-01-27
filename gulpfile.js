const gulp   = require('gulp');
const srcmap = require('gulp-sourcemaps');
const ts     = require('gulp-typescript');
const merge  = require('merge2');

const fs          = require('fs');
const util        = require('util');
const path        = require('path');
const proc        = require('process');
const child_proc  = require('child_process');

const rimraf    = require('rimraf');
const annautils = require('annautils');
const killport  = require('kill-port');


const release_root = "./release";
const project_name = "webdisk";

function onerror(err) {
    console.log(err.toString());
    this.emit("end");
}

/** package.json, README.md */
function copy_misc() //{
{
    return merge([
        gulp.src("./package.json").pipe(gulp.dest(path.join(release_root, project_name))),
        gulp.src("./README.md").pipe(gulp.dest(path.join(release_root, project_name))),
        gulp.src("./package.json").pipe(gulp.dest(path.join(release_root, "@types", project_name))),
        gulp.src("./README.md").pipe(gulp.dest(path.join(release_root, "@types", project_name)))
    ]);
} //}

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
            const _reject =  () => {
                if(end) return;
                end = true;
                reject()
            }
            const _resolve = () => {
                if(end) return;
                end = true;
                resolve();
            }
            ans.on('end',    () => _resolve());
            ans.on('finish', () => _resolve());
            ans.on('error',  () => _reject());
        });
    }
} //}

/** compile lib */
function compile_lib_ts() //{
{ 
    return compile_ts_dir("lib/**/*.ts", 
                    path.join(release_root, project_name, "lib"),
                    true, 
                    path.join(release_root, "@types", project_name, "lib"))();
} //}
/** compile bin */
function compile_bin_ts() //{
{
    return compile_ts_dir("bin/*.ts", 
                           path.join(release_root, project_name, "bin"))();
} //}
/** chmod 777 to all of excutable file */
function chmod_bin_js() //{
{
    return annautils.fs.promisify.chmodRecursive(path.join(release_root, project_name, "bin"), "777", 1, /.*/).then((num) => {
        console.log(`change ${num} files to permission '777'`);
    }, (err) => {
        console.log(err);
    });
} //}
/** compile index.ts */
function compile_index_ts() //{
{
    return compile_ts_dir("./index.ts", 
                    path.join(release_root, project_name),
                    true, 
                    path.join(release_root, "@types", project_name))();
} //}
let ts_task = gulp.series(compile_index_ts, compile_lib_ts, compile_bin_ts, chmod_bin_js);

/** copy static resources */
function copy_resources() //{
{
    return gulp.src("resources/**")
               .pipe(gulp.dest(path.join(release_root, project_name, 'resources')));
} //}

/** copy etc */
function copy_etc() //{
{
    return gulp.src("etc/**")
               .pipe(gulp.dest(path.join(release_root, project_name, 'etc')));
} //}

/** build dashboard with [ng build --prod] */
async function build_dashboard() //{
{
    await new Promise((resolve, reject) => {
        const child = child_proc.spawn('ng', ['build', '--prod'], {
            cwd: path.join(proc.cwd(), 'dashboard'), 
            stdio: ['ignore', 'inherit', 'inherit'],
            shell: true
        });
        child.once('exit', (code, signal) => {
            if(code == 0) {
                console.info('build dashboard successful');
                resolve();
            } else {
                console.error('build dashboard fail');
                reject();
            }
        });
    });

    await gulp.src("dashboard/dist/dashboard/**")
              .pipe(gulp.dest(path.join(release_root, project_name, 'dashboard')));
} //}
gulp.task('dashboard', build_dashboard);

/** TASK release */
gulp.task("release", gulp.parallel(ts_task, copy_misc, build_dashboard, copy_resources, copy_etc));

/** TASK default */
gulp.task("default", gulp.series("release"));

function try_watch(restart) //{
{
    let watcher = gulp.watch(["lib/**/*.ts", "./*.ts", "bin/*.ts", "resources/**"]);
    let handle = async (fp, stat) => {
        console.log(`----- file [${fp}]`);
        let fp_split = fp.split("/");
        switch (fp_split[0]) {
            case "lib":
                console.log("build lib");
                await compile_lib_ts();
                if(restart) await restart_backend_server();
                break;
            case "bin":
                console.log("build bin");
                await compile_bin_ts();
                if(restart) await restart_backend_server();
                break;
            case "index.ts":
                console.log("build index.ts");
                await compile_index_ts();
                if(restart) await restart_backend_server();
                break;
        }
    }
    watcher.on("change", handle);
    watcher.on("add", handle);
    watcher.on("unlink", handle);
    watcher.on("error", onerror);
} //}
/** TASK watch */
gulp.task("watch", () => try_watch(false));

async function start_ng_serve() //{
{
    await new Promise((resolve, reject) => {
        const child = child_proc.spawn('ng', ['serve'], {
            cwd: path.join(proc.cwd(), 'dashboard'), 
            stdio: ['ignore', 'inherit', 'inherit'],
            shell: true
        });
        child.once('exit', (code, signal) => {
            if(code == 0) {
                resolve();
            } else {
                reject();
            }
        });
    });
} //}
let BackendProcessHandler = null;
let inkill = false;
async function restart_backend_server() //{
{
    if(BackendProcessHandler == null) {
        console.info('start backend server');
        return await new Promise((resolve, reject) => {
            const child = child_proc.spawn('npm', ['run', 'test'], {
                stdio: ['ignore', 'inherit', 'inherit'],
                shell: true
            });
            child.once('exit', (code, signal) => resolve());
            BackendProcessHandler = child;
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
    const backend = restart_backend_server();
    const ng = start_ng_serve();
    const watch = try_watch(true);
    await backend;
    await ng;
    await watch;
} //}
gulp.task("serve", serve);

async function host() //{
{
    await restart_backend_server();
} //}
gulp.task("host", gulp.series("release", host));

/** TASK clean */
gulp.task("clean", () => {
    let dirs = [
        release_root, 
        "dashboard/dist",
    ];
    for (let vv of dirs) {
        try {
            rimraf.sync(vv);
        } catch {}
    }
    return Promise.resolve(true);
});

