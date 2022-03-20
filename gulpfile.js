const gulp   = require('gulp');
const rimraf = require('rimraf');
const path        = require('path');
const proc        = require('process');
const child_proc  = require('child_process');


const child_proc_list = [];
proc.on("exit", () => {
    child_proc_list.forEach(child => {
        child.kill();
    });
});
proc.on("SIGINT",  () => proc.exit(0));
proc.on("SIGTERM", () => proc.exit(0));

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

/** dashboard build with [npx ng build --prod] */
async function dashboard_build() //{
{
    try {
        await run_command_as_promise('npx', ['ng', 'build', '--prod'], path.join(proc.cwd(), "dashboard"));
        console.log("dashboard build success");
    } catch (e) {
        console.error("build dashboard failed", e);
    }
} //}
/** dashboard serve with [npx ng serve] */
async function dashboard_serve() //{
{
    await new Promise((resolve, reject) => {
        const child = child_proc.spawn('npx', ['ng', 'serve'], {
            cwd: path.join(proc.cwd(), 'dashboard'), 
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
} //}

function forward_gulp_command(subdir, gulpcmd) {
    return async () => {
        return await run_command_as_promise('npx', ['gulp', gulpcmd], path.join(proc.cwd(), subdir));
    }
}

function copy_dir(from, to) {
    return () => gulp.src(from).pipe(gulp.dest(to));
}

gulp.task('dashboard', dashboard_build);
gulp.task("release", gulp.parallel(
    gulp.series(dashboard_build, copy_dir("dashboard/dist/**", "release")), 
    gulp.series(forward_gulp_command("backend", "release"), copy_dir("backend/release/**", "release/backend"))));
gulp.task("default", gulp.series("release"));

gulp.task("serve", gulp.parallel(forward_gulp_command("backend", "serve"), dashboard_serve));
gulp.task("test",  gulp.parallel(
    forward_gulp_command("backend", "test"),
    () => run_command_as_promise("npm", ["run", "test"],
                                 path.join(proc.cwd(), "dashboard"))));
gulp.task("host", () =>
    run_command_as_promise("node", ["release/backend/bin/main.js", "-c", "release/backend/etc/webdisk/config.yaml"], proc.cwd()));


gulp.task("clean", () => {
    let dirs = [
        "release",
        "dashboard/dist",
    ];
    for (let vv of dirs) {
        try {
            rimraf.sync(vv);
        } catch {}
    }
    return Promise.resolve(true);
});

