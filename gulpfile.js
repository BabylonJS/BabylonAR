var gulp = require("gulp");
var exec = require("child_process").exec;
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var tsify = require("tsify");

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

// TODO: Create an example of building a WASM, something like the following.
gulp.task("webpiled-aruco-ar", function () {
    process.chdir("src/cpp/webpiled-aruco-ar");
    var ret = exec("./build.sh", function (error, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
    });
    process.chdir("../..");
    return ret;
});

gulp.task("default", gulp.parallel(
    "exampleWorker", 
    "exampleObjectTracker"
));