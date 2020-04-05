"use strict";
exports.__esModule = true;
var gulp = require("gulp");
var ts = require("gulp-typescript");
var path = require("path");
var merge = require("merge2");
var fs = require("fs");
var util = require("util");
var rimraf = require("rimraf");
var proc = require("process");
var child_proc = require("child_process");
var release_root = "./release";
var test_root = "./testme";
var project_name = "webdisk";
// function chmod_files() //{
function chmod_files(dir, mode, level /* start with 1 */, filematch, cb) {
    if (level === void 0) { level = 1; }
    if (filematch === void 0) { filematch = /.*/; }
    if (cb === void 0) { cb = null; }
    var num = 0;
    var nerr = 0;
    var callback_m = function (err, num) {
        if (err)
            throw err;
    };
    var error = null;
    var cn = 0;
    cb = cb || callback_m;
    var callback_x = function (err) {
        error = err;
        dec_cn();
    };
    var inc_cn = function () {
        cn += 1;
    };
    var dec_cn = function () {
        cn -= 1;
        if (cn == 0)
            cb(error, num);
    };
    var ffff = function (d, l) {
        if (l == 0)
            return;
        inc_cn();
        fs.readdir(d, "utf8", function (err, files) {
            if (err)
                nerr += 1;
            if (err || error)
                return callback_x(err || error);
            var _loop_1 = function (file) {
                var new_path = path.join(dir, file);
                inc_cn();
                fs.stat(new_path, function (err, stat) {
                    if (err)
                        nerr += 1;
                    if (err || error)
                        return callback_x(err || error);
                    if (stat.isDirectory()) {
                        ffff(new_path, l - 1);
                    }
                    else if (stat.isFile()) {
                        if (!filematch.test(new_path))
                            return dec_cn();
                        inc_cn();
                        fs.chmod(new_path, mode, function (err) {
                            if (!err)
                                num += 1;
                            if (err)
                                nerr += 1;
                            if (err || error)
                                return callback_x(err || error);
                            dec_cn();
                        });
                    }
                    dec_cn();
                });
            };
            for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                var file = files_1[_i];
                _loop_1(file);
            }
            dec_cn();
        });
    };
    ffff(dir, level);
}
var chmodFiles = util.promisify(chmod_files);
//}
function onerror(err) {
    console.log(err.toString());
    this.emit("end");
}
function compile_ts_dir(glob, destination, declaration, decl_dest) {
    if (declaration === void 0) { declaration = false; }
    if (decl_dest === void 0) { decl_dest = null; }
    return function () {
        var ts_project = ts.createProject("./tsconfig.json", {
            declaration: declaration
        });
        var ts_pipe = gulp.src(glob)
            .pipe(ts_project()).on("error", onerror);
        if (declaration) {
            if (decl_dest == null)
                throw new Error("fix here");
            return merge([
                ts_pipe.js.pipe(gulp.dest(destination)),
                ts_pipe.dts.pipe(gulp.dest(decl_dest))
            ]);
        }
        else {
            return ts_pipe.js.pipe(gulp.dest(destination));
        }
    };
}
var compile_lib_ts = compile_ts_dir("lib/**/*.ts", path.join(release_root, project_name, "lib"), true, path.join(release_root, "@types", project_name, "lib"));
var compile_bin_ts = compile_ts_dir("bin/*.ts", path.join(release_root, project_name, "bin"));
function chmod_bin_js() {
    return chmodFiles(path.join(release_root, project_name, "bin"), "777", 1, /.*/).then(function (num) {
        console.log("change " + num + " files to permission '777'");
    }, function (err) {
        console.log(err);
    });
}
var compile_index_ts = compile_ts_dir("./index.ts", path.join(release_root, project_name), true, path.join(release_root, "@types", project_name));
function link_to_node_modules() {
    return merge([
        gulp.src(path.join(release_root, project_name, "*")).pipe(gulp.symlink(path.join("node_modules", project_name))),
        gulp.src(path.join(release_root, "@types", project_name, "*")).
            pipe(gulp.symlink(path.join("node_modules", "@types", project_name)))
    ]);
}
var ts_task = gulp.series(compile_index_ts, compile_lib_ts, compile_bin_ts, chmod_bin_js, link_to_node_modules);
gulp.task("compileTypescripts", ts_task);
var compile_test = compile_ts_dir("./test/**/*.ts", test_root);
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
gulp.task("watch", function () {
    var watcher = gulp.watch(["lib/**/*.ts", "test/**/*.ts", "./*.ts", "bin/*.ts"]);
    var handle = function (fp, stat) {
        console.log("----- file [" + fp + "]");
        var fp_split = fp.split("/");
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
    };
    watcher.on("change", handle);
    watcher.on("add", handle);
    watcher.on("unlink", handle);
    watcher.on("error", onerror);
});
gulp.task("test", function () {
    var test_task = proc.env["test"];
    if (test_task == null)
        return Promise.resolve("empty");
    var test_ret;
    try {
        test_ret = child_proc.execSync("cd testme && node " + test_task + "_test.js");
    }
    catch (_a) { }
    console.log((test_ret || "").toString());
    return Promise.resolve("yes");
});
gulp.task("clean", function () {
    var dirs = [
        test_root,
        release_root,
        "./dist",
        path.join("node_modules", project_name),
        path.join("node_modules", "@types", project_name)
    ];
    for (var _i = 0, dirs_1 = dirs; _i < dirs_1.length; _i++) {
        var vv = dirs_1[_i];
        try {
            rimraf.sync(vv);
        }
        catch (_a) { }
    }
    return Promise.resolve(true);
});
