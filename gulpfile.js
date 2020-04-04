"use strict";
exports.__esModule = true;
var gulp = require("gulp");
var ts = require("gulp-typescript");
var path = require("path");
var merge = require("merge2");
var rimraf = require("rimraf");
var release_root = "./release";
var test_root = "./testme";
function compile_ts() {
    var ts_project = ts.createProject("./tsconfig.json", {
        declaration: true
    });
    var ts_pipe = gulp.src("lib/**/*.ts")
        .pipe(ts_project());
    return merge([
        ts_pipe.dts.pipe(gulp.dest(path.join(release_root, "@types", "webdisk", "lib"))),
        ts_pipe.js.pipe(gulp.dest(path.join(release_root, "webdisk", "lib")))
    ]);
}
function compile_index() {
    var ts_project = ts.createProject("./tsconfig.json", {
        declaration: true
    });
    var ts_pipe = gulp.src("./index.ts")
        .pipe(ts_project());
    return merge([
        ts_pipe.dts.pipe(gulp.dest(path.join(release_root, "@types", "webdisk"))),
        ts_pipe.js.pipe(gulp.dest(path.join(release_root, "webdisk")))
    ]);
}
function link_to_node_modules() {
    return merge([
        gulp.src("./release/webdisk/*").pipe(gulp.symlink("./node_modules/webdisk")),
        gulp.src("./release/@types/webdisk/*").pipe(gulp.symlink("./node_modules/@types/webdisk"))
    ]);
}
gulp.task("ts", gulp.series(compile_index, compile_ts, link_to_node_modules));
function compile_test() {
    var ts_project = ts.createProject("./tsconfig.json");
    return gulp.src("test/**/*.ts")
        .pipe(ts_project())
        .pipe(gulp.dest(test_root));
}
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
gulp.task("default", gulp.series("ts", build_test));
gulp.task("watch", function () {
    var watcher = gulp.watch(["lib/**/*.ts", "test/**/*.ts"]);
    var handle = function (fp, stat) {
        console.log("----- file [" + fp + "]");
        var fp_split = fp.split("/");
        switch (fp_split[0]) {
            case "lib":
                console.log("build lib");
                return gulp.series("ts");
            case "test":
                console.log("build test");
                return build_test();
        }
    };
    watcher.on("change", handle);
    watcher.on("add", handle);
    watcher.on("unlink", handle);
});
gulp.task("clean", function () {
    var dirs = [
        "./testme",
        "./release",
        "./dist",
        "./node_modules/webdisk",
        "./node_modules/@types/webdisk"
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
