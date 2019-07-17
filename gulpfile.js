var browserify = require("browserify");
var buffer = require("vinyl-buffer");
var cors = require("cors");
var express = require("express");
var footer = require("gulp-footer");
var gulp = require("gulp");
var header = require("gulp-header");
var rename = require("gulp-rename");
var run = require("gulp-run")
var source = require("vinyl-source-stream");
var tsify = require("tsify");
var uglify = require("gulp-uglify");

// ================ WEB-ASSEMBLY BUILD SCRIPTS ================

/*
 * WARNING TO WINDOWS USERS: Some VERY tricky shenanigans can occur due to cross-platform
 * conventions and differences. These helper scripts in particular are known to work in
 * a Linux-style environment, but certain assumptions quickly fall apart when the 
 * environment diverges from expectations. To use these scripts, only install the 
 * Emscripten submodule using the "emscripten" gulp task provided below, and only run that
 * gulp task from a Linux shell. Note that WSL launched via normal means (for example, from
 * the start menu) behaves as a Linux shell in this case, as does a WSL terminal embedded 
 * in an instance of VSCode launched from a Linux shell (i.e., using "code ."). However,
 * a WSL terminal embedded in VSCode launched from a Windows prompt can behave differently,
 * and differences in (for example) the encoding of files downloaded while using such a 
 * terminal may cause malfunctions even if you later switch to a more compliant Linux
 * environment. The problem has its roots in Windows child process environment inheritance 
 * (https://docs.microsoft.com/en-us/windows/win32/procthread/inheritance) which is well 
 * beyond the scope of this comment to address.
 * 
 * As a workaround, if you attempt to use any of the following build tasks to help you
 * use Emscripten, but you find that tasks are failing in strange ways (such as 
 * complaining that they are unable to interpret nonexistent characters), perform the 
 * following procedure.
 * 
 *     1. Close any and all VSCode windows, terminals, etc.
 *     2. In Windows explorer, shift-delete the submodules/emsdk folder.
 *     3. Open a new WSL terminal and navigate back to your repository's root.
 *     4. You can perform all the remaining steps in WSL. Alternatively, you can launch 
 *        VSCode by typing "code ." in your WSL terminal, then use a WSL terminal embedded
 *        in THAT VSCode instance.
 *     5. Execute the command "gulp emscripten" to install the preferred version of 
 *        Emscripten in the preferred way.
 *     6. Test that your installation was successful by attempting to build something.
 *        For example, try "gulp aruco-meta-marker-tracker"
 * 
 * It can be confusing, but even in the worst case the problems aren't that hard to undo.
 * It's also not too difficult to keep problems like this from arising again; just try to
 * avoid workflows that involve crossing from Windows dev tools to Linux ones (the reverse
 * direction seems safer) and you shouldn't encounter these problems.
 */

const EMSDK_VERSION = "1.38.38";
const EMSCRIPTEN_ENV_COMMAND = "submodules/emsdk/emsdk_env.sh; ";
const EMSCRIPTEN_COMPILER_LOCATION = "submodules/emsdk/fastcomp/emscripten";
const EMSCRIPTEN_SERVE_COMMAND = "emrun --no_browser --port 8080 --serve_root dist .";

gulp.task("emscripten-install", function () {
    const shellCommand = 
        "git submodule update --init --recursive; " +
        "cd submodules/emsdk; " +
        "./emsdk install " + EMSDK_VERSION + "; " +
        "./emsdk activate " + EMSDK_VERSION + "; " +
        "cd ../../;";
    return run(shellCommand).exec();
});

gulp.task("aruco-meta-marker-tracker", function () {
    var shellCommand = 
        "cd src/cpp/aruco-meta-marker-tracker; " +
        "./build.sh ../../../" + EMSCRIPTEN_COMPILER_LOCATION + "; " +
        "cd ../../../; " +
        "cp src/cpp/aruco-meta-marker-tracker/build/* dist/wasm/";
    return run(shellCommand).exec();
});

// ================ JAVASCRIPT BUILD SCRIPTS ================

gulp.task("exampleWorker", function () {
    return browserify({
        basedir: ".",
        debug: true,
        entries: ["src/ts/exampleWorker/exampleWorker.ts"],
        cache: {},
        packageCache: {},
        standalone: "BabylonAR"
    })
    .plugin(tsify)
    .bundle()
    .pipe(source("exampleWorker.js"))
    .pipe(gulp.dest("dist"));
});

gulp.task("exampleObjectTracker", function () {
    return browserify({
        basedir: ".",
        debug: true,
        entries: ["src/ts/exampleObjectTracker/exampleObjectTracker.ts"],
        cache: {},
        packageCache: {},
        standalone: "BabylonAR"
    })
    .plugin(tsify)
    .bundle()
    .pipe(source("exampleObjectTracker.js"))
    .pipe(gulp.dest("dist"));
});

gulp.task("arUcoMetaMarkerObjectTracker", function () {
    return browserify({
        basedir: ".",
        debug: true,
        entries: ["src/ts/arUcoMetaMarkerObjectTracker/arUcoMetaMarkerObjectTracker.ts"],
        cache: {},
        packageCache: {},
        standalone: "BabylonAR"
    })
    .plugin(tsify)
    .bundle()
    .pipe(source("arUcoMetaMarkerObjectTracker.js"))
    .pipe(gulp.dest("dist"));
});

gulp.task("babylonAr", function () {
    return browserify({
        basedir: ".",
        debug: false,
        entries: ["src/ts/babylonAr.ts"],
        cache: {},
        packageCache: {},
        standalone: "BabylonAR"
    })
    .plugin(tsify)
    .bundle()
    .pipe(source("babylonAr.js"))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest("dist"));
});

gulp.task("babylonAr.playground", gulp.series("babylonAr", function () {
    var headerCode = 
        "var externalDefine = window.define;" +
        "var externalRequire = window.require;" +
        "window.define = undefined;" +
        "window.require = undefined;\n";
    var footerCode = 
        "\nwindow.define = externalDefine;" +
        "window.require = externalRequire;\n";
    
    return gulp.src("dist/babylonAr.js")
        .pipe(header(headerCode))
        .pipe(footer(footerCode))
        .pipe(rename("babylonAr.playground.js"))
        .pipe(gulp.dest("dist"));
}));

gulp.task("default", gulp.parallel(
    "exampleWorker", 
    "exampleObjectTracker",
    "babylonAr.playground"
));

gulp.task("deploy", gulp.series("default", function () {
    return gulp.src(["dist/**/*"]).pipe(gulp.dest("docs"));
}));

// ================ ADDITIONAL SCRIPTS ================

gulp.task("serve", function () {
    var server = express();
    server.use(cors());
    server.use(express.static("dist"));
    server.listen(8080);
});