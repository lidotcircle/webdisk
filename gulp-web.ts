import * as gulp       from 'gulp';
import * as sass       from 'gulp-sass';
import * as sourcemaps from 'gulp-sourcemaps';
import * as merge      from 'merge2';
import * as rimraf     from 'rimraf';
import * as typescript from 'gulp-typescript';
import * as vinyl_buffer from 'vinyl-buffer';
import * as vinyl_source_stream from 'vinyl-source-stream';

import * as browserify from 'browserify';
import * as tsify      from 'tsify';

import * as path from 'path';
import * as util from 'util';
import * as proc from 'process';

import * as annautils from 'annautils';


const project_name = "webdisk-app";

const project_root = "./app";
const doc_root     = "./docroot";
const tsconfig     = "./app/tsconfig.json";

function onerror(err) {
    console.log(err.toString());
    this.emit("end");
}

// browser javascript - compile_webdisk_ts() //{
function browser_compile_ts_dir(entry: string, destination: string, sourceMaps: boolean = false) {
    return function() {
        let sm = browserify()
        .add(entry)
        .plugin("tsify", {target: 'es6'})
        .bundle()
        .pipe(vinyl_source_stream(path.basename(entry.replace(".ts", ".js"))));

        if (sourceMaps)
            return sm.pipe(vinyl_buffer())
                .pipe(sourcemaps.init())
                .pipe(sourcemaps.write("./"))
                .pipe(gulp.dest(destination));
        else
            return sm.pipe(gulp.dest(destination));
    }
}

let compile_webdisk_ts = browser_compile_ts_dir(path.join(project_root, "/ts/webdisk.ts"), doc_root, true);
//}

// server javascript - compile_server_ts() //{
function compile_ts_to_dir(glob: string, destination: string) {
    let ts_project = typescript.createProject(tsconfig, {});
    return gulp.src(glob)
        .pipe(ts_project()).on("error", onerror)
        .js.pipe(gulp.dest(destination));
}

function compile_server_ts_index() {
    return compile_ts_to_dir(path.join(project_root, "index.ts"), doc_root);
}
function compile_server_ts_template() {
    return compile_ts_to_dir(path.join(project_root, "template/**/*.ts"), doc_root);
}
function compile_server_ts() {
    return merge([
        compile_server_ts_index(),
        compile_server_ts_template()
    ]);
}
//}

// styles - sass and css - sytles__() //{
function sass_compile_move() {
    return gulp.src(path.join(project_root, "styles/*.sass"))
    .pipe(sass().on("error", onerror))
    .pipe(gulp.dest(path.join(doc_root, "styles/")));
}
function css_copy() {
    return gulp.src(path.join(project_root, "styles/*.css"))
    .pipe(gulp.dest(path.join(doc_root, "styles/")));
}
function styles__() {
    return merge([
        sass_compile_move(),
        css_copy()
    ]);
}
//}

// asset - images and fonts - images_copy() //{
function images_copy() {
    return gulp.src(path.join(project_root, "imgs/*"))
    .pipe(gulp.dest(path.join(doc_root, "imgs/")));
}
//}

// html - htmls_copy() //{
function htmls_template_copy() {
    return gulp.src(path.join(project_root, "template/*.html"))
    .pipe(gulp.dest(path.join(doc_root, "template/")));
}
function htmls_index_copy() {
    return gulp.src(path.join(project_root, "index.html"))
    .pipe(gulp.dest(doc_root));
}
function htmls_copy() {
    return merge([
        htmls_template_copy(),
        htmls_index_copy()
    ]);
}
//}

export function doit() {
gulp.task("browserjs", compile_webdisk_ts);
gulp.task("app", gulp.parallel(compile_webdisk_ts, compile_server_ts, styles__, images_copy, htmls_copy));

// watch //{
gulp.task("xwatch", () => {
    let watcher = gulp.watch([
        "ts/**/*.ts", "styles/*.sass", 
        "template/*.html", "template/*.ts",
        "imgs/*",
        "index.html",
        "index.ts"
    ].map(x => path.join(project_root, x)));
    let handle = (fp: string, stat) => {
        console.log(`[${fp}] fires event`);
        let fp_split = fp.split("/");
        switch (fp_split[1]) {
            case "ts":
                console.log("browser javascript");
                return compile_webdisk_ts();
            case "styles":
                console.log("styles");
                return styles__();
            case "template":
            case "index.html":
            case "index.ts":
                if (fp.endsWith("html")) {
                    console.log("html template");
                    return htmls_copy();
                } else if (fp.endsWith("ts")) {
                    console.log("server typescript");
                    return compile_server_ts();
                }
            default:
                console.log("unknown");
        }
    }
    watcher.on("change", handle);
    watcher.on("add", handle);
    watcher.on("unlink", handle);
    watcher.on("error", onerror);
});
//}

// clean //{
gulp.task("xclean", () => {
    let dirs = [
        doc_root
    ];
    for (let vv of dirs) {
        try {
            rimraf.sync(vv);
        } catch {}
    }
    return Promise.resolve(true);
});
//}
}

if (require.main === module)
    doit();
