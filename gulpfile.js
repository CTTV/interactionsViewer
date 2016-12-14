const gulp = require('gulp');
const babel = require('gulp-babel');
const rename = require('gulp-rename');

const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const gutil = require('gulp-util');
const babelify = require('babelify');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');

const buildDir = "build";
const browserFile = "browser.js";
const packageConfig = require('./package.json');
const outputFile = packageConfig.name;
const outputFileSt = outputFile + ".js";

gulp.task('sass', function () {
    return gulp.src('./index.scss')
        .pipe(sass({
            errLogToConsole: true
        }))
        .pipe(rename(outputFile + '.css'))
        .pipe(gulp.dest(buildDir));
});

gulp.task('build', ['sass'], () => {
    return browserify({
        entries: browserFile,
        debug: true,
        standalone: "interactionsViewer",
    }).transform(babelify, {presets: ["es2015"], sourceMaps: true})
        .bundle()
        .pipe(source(outputFileSt))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(buildDir))
        .pipe(gutil.noop())
});

// gulp.task('build', ['sass'], () => {
//     let appBundler = browserify({
//         entries: browserFile,
//         debug: true,
//         standalone: "interactionsViewer"
//     });

//     appBundler
//         .transform("babelify", {
//             //presets: ["es2015", "babili"]
//             presets: ['es2015']
//         })
//         .bundle()
//         .on('error', gutil.log)
//         .pipe(source(outputFileSt))
//         .pipe(gulp.dest(buildDir));
// });

