var gulp = require("gulp");
var exec = require("child_process").exec;
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var tsify = require("tsify");
var header = require("gulp-header");
var footer = require("gulp-footer");

var playgroundProof = function (jsFile) {
    var headerCode = 
        "var externalDefine = window.define;" +
        "var externalRequire = window.require;" +
        "window.define = undefined;" +
        "window.require = undefined;\n";
    var footerCode = 
        "\nwindow.define = externalDefine;" +
        "window.require = externalRequire;\n";
    
    return gulp.src(jsFile)
        .pipe(header(headerCode))
        .pipe(footer(footerCode))
        .pipe(gulp.dest("dist"));
}

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

gulp.task("babylonAr", gulp.series(function () {
    return browserify({
        basedir: ".",
        debug: true,
        entries: ["src/ts/babylonAr.ts"],
        cache: {},
        packageCache: {},
        standalone: "BabylonAR"
    })
    .plugin(tsify)
    .bundle()
    .pipe(source("babylonAr.js"))
    .pipe(gulp.dest("dist"));
},
function () {
    return playgroundProof("./dist/babylonAr.js");
}));

gulp.task("default", gulp.parallel(
    "exampleWorker", 
    "exampleObjectTracker",
    "babylonAr"
));