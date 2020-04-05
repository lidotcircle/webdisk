import * as gulp   from 'gulp';
import * as srcmap from 'gulp-sourcemaps';
import * as ts     from 'gulp-typescript';
import * as path   from 'path';
import * as merge  from 'merge2';

import * as fs from 'fs';
import * as util from 'util';
import * as rimraf from 'rimraf';

import * as proc from 'process';
import * as child_proc from 'child_process';

import * as annautils from 'annautils';

const release_root = "./release";
const test_root    = "./testme";
const project_name = "webdisk";

// function chmod_files() //{
function chmod_files(dir: string, mode: any, level: number = 1/* start with 1 */, 
                            filematch: RegExp = /.*/, cb: (err: Error, num: number) => void = null): void {
    let num: number = 0;
    let nerr: number = 0;
    let callback_m = (err, num: number) => {
        if (err) throw err;
    }
    let error: Error = null;
    let cn: number = 0;
    cb = cb || callback_m;
    let callback_x = (err) => {
        error = err;
        dec_cn();
    }
    let inc_cn = () => {
        cn += 1;
    }
    let dec_cn = () => {
        cn -= 1;
        if(cn == 0) cb(error, num);
    }
    let ffff = (d, l) => {
        if (l == 0) return;
        inc_cn();
        fs.readdir(d, "utf8", (err, files) => {
            if(err) nerr += 1;
            if(err || error) return callback_x(err || error);
            for (let file of files) {
                let new_path = path.join(dir, file);
                inc_cn();
                fs.stat(new_path, (err, stat) => {
                    if(err) nerr += 1;
                    if(err || error) return callback_x(err || error);
                    if(stat.isDirectory()) {
                        ffff(new_path, l - 1);
                    } else if (stat.isFile()) {
                        if (!filematch.test(new_path)) return dec_cn();
                        inc_cn();
                        fs.chmod(new_path, mode, (err) => {
                            if (!err) num += 1;
                            if(err) nerr += 1;
                            if(err || error) return callback_x(err || error);
                            dec_cn();
                        });
                    }
                    dec_cn();
                });
            }
            dec_cn();
        });
    }
    ffff(dir, level);
}

const chmodFiles: (dir: string, mode: any, level: number, filematch: RegExp) => Promise<number>
    = util.promisify(chmod_files);
//}

function onerror(err) {
    console.log(err.toString());
    this.emit("end");
}

function copy_misc() {
    return merge([
        gulp.src("./package.json").pipe(gulp.dest(path.join(release_root, project_name))),
        gulp.src("./README.md").pipe(gulp.dest(path.join(release_root, project_name))),
        gulp.src("./package.json").pipe(gulp.dest(path.join(release_root, "@types", project_name))),
        gulp.src("./README.md").pipe(gulp.dest(path.join(release_root, "@types", project_name)))
    ]);
}

function compile_ts_dir(glob: string, destination: string, declaration: boolean = false, decl_dest: string = null) {
    return function() {
        let ts_project = ts.createProject("./tsconfig.json", {
            declaration: declaration
        });

        let ts_pipe = gulp.src(glob)
            .pipe(ts_project()).on("error", onerror);
        if (declaration) {
            if (decl_dest == null) throw new Error("fix here");
            return merge([
                ts_pipe.js .pipe(gulp.dest(destination)),
                ts_pipe.dts.pipe(gulp.dest(decl_dest))
            ]);
        } else {
            return ts_pipe.js.pipe(gulp.dest(destination));
        }
    }
}

let compile_lib_ts = compile_ts_dir(
    "lib/**/*.ts", 
    path.join(release_root, project_name, "lib"),
    true, 
    path.join(release_root, "@types", project_name, "lib")
);

let compile_bin_ts = compile_ts_dir(
    "bin/*.ts", 
    path.join(release_root, project_name, "bin")
);

function chmod_bin_js() {
    return annautils.fs.promisify.chmodRecursive(path.join(release_root, project_name, "bin"), "777", 1, /.*/).then((num) => {
        console.log(`change ${num} files to permission '777'`);
    }, (err) => {
        console.log(err);
    });
}

let compile_index_ts = compile_ts_dir(
    "./index.ts", 
    path.join(release_root, project_name),
    true, 
    path.join(release_root, "@types", project_name)
);

function link_to_node_modules() {
    return merge([
        gulp.src(path.join(release_root, project_name, "*")).pipe(gulp.symlink(path.join("node_modules", project_name))),
        gulp.src(path.join(release_root, "@types", project_name, "*")).
        pipe(gulp.symlink(path.join("node_modules", "@types", project_name)))
    ]);
}

let ts_task = gulp.series(compile_index_ts, compile_lib_ts, compile_bin_ts, chmod_bin_js, link_to_node_modules);
gulp.task("compileTypescripts", ts_task);

gulp.task("release", gulp.parallel("compileTypescripts", copy_misc));

let compile_test = compile_ts_dir("./test/**/*.ts", test_root);
function link_test_html() {
    return gulp.src("test/*.html")
    .pipe(gulp.symlink(test_root));
}
function link_test_json() {
    return gulp.src("test/*.json")
    .pipe(gulp.symlink(test_root));
}
function build_test() {
    return merge([
        compile_test(),
        link_test_html(),
        link_test_json()
    ]);
}
gulp.task("buildtest", build_test);

gulp.task("default", gulp.series("compileTypescripts", build_test));

gulp.task("watch", () => {
    let watcher = gulp.watch(["lib/**/*.ts", "test/**/*.ts", "./*.ts", "bin/*.ts"]);
    let handle = (fp: string, stat) => {
        console.log(`----- file [${fp}]`);
        let fp_split = fp.split("/");
        switch (fp_split[0]) {
            case "lib":
                console.log("build lib");
                return compile_lib_ts(); // index.ts should be compile first, but ...
            case "bin":
                console.log("build bin");
                return compile_bin_ts(); // index.ts should be compile first, but ...
            case "test":
                console.log("build test");
                return build_test();
            case "index.ts":
                console.log("build index.ts");
                return compile_index_ts();
        }
    }
    watcher.on("change", handle);
    watcher.on("add", handle);
    watcher.on("unlink", handle);
    watcher.on("error", onerror);
});

gulp.task("test", () => {
    let test_task = proc.env["test"];
    if (test_task == null) return Promise.resolve("empty");
    let test_ret;
    try {
        test_ret = child_proc.execSync(`cd testme && node ${test_task}_test.js`);
    } catch {}
    console.log((test_ret || "").toString());
    return Promise.resolve("yes");
});

gulp.task("clean", () => {
    let dirs = [
        test_root, 
        release_root, 
        "./dist", 
        path.join("node_modules", project_name),
        path.join("node_modules", "@types", project_name)
    ];
    for (let vv of dirs) {
        try {
            rimraf.sync(vv);
        } catch {}
    }
    return Promise.resolve(true);
});

