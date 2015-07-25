'use strict';
var gulp = require('gulp');
var gutil = require('gulp-util');
var gulpif = require('gulp-if');
var browserify = require('browserify');
var watchify = require('watchify');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var size = require('gulp-size');
var source = require('vinyl-source-stream');
var sequence = require('run-sequence');
var rename = require('gulp-rename');
var stylus = require('gulp-stylus');
var minifyCss = require('gulp-minify-css');
var autoprefixer = require('gulp-autoprefixer');
var nib = require('nib');
var browserSync = require('browser-sync');
var jshint = require('gulp-jshint');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');

var config = {
  paths: {
    js: 'src',
    styles: 'src',
    dest: 'dist'
  },
  browserSync: {
    port: '3000',
    server: '.'
  },
  isProd: false
};

function handleErrors(err) {
  gutil.log(err.toString());
  this.emit('end');
}

function buildScript() {

  var bundler = browserify({
    entries: config.paths.js + '/dragular.js',
    debug: true,
    cache: {},
    packageCache: {},
    fullPaths: true
  }, watchify.args);

  if (!config.isProd) {
    bundler = watchify(bundler);
    bundler.on('update', function() {
      rebundle();
    });
  }

  function rebundle() {
    var stream = bundler.bundle();

    return stream.on('error', handleErrors)
      .pipe(source('dragular.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init())
      .pipe(gulpif(config.isProd, uglify({
        compress: { drop_console: true }
      })))
      .pipe(gulpif(config.isProd, rename({
        suffix: '.min'
      })))
      .pipe(size({
        title: 'Scripts: '
      }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(config.paths.dest))
      .pipe(browserSync.stream());
  }

  return rebundle();
}

gulp.task('browserify', function() {
  return buildScript('main.js');
});

gulp.task('styles', function() {

  return gulp.src(config.paths.styles + '/dragular.styl')
    .pipe()
    .pipe(autoprefixer({
      browsers: [ 'last 15 versions', '> 1%', 'ie 8', 'ie 7' ],
      cascade: false
    }))
    .pipe(gulpif(config.isProd, minifyCss()))
    .pipe(gulpif(config.isProd, rename({
      suffix: '.min'
    })))
    .pipe(size({
      title: 'Styles: '
    }))
    .pipe(gulp.dest(config.paths.dest))
    .pipe(gulpif(browserSync.active, browserSync.stream()));
});

gulp.task('lint', function() {

  return gulp.src([config.paths.js + '/**/*.js', './gulpfile.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('serve', function () {

  browserSync({
    port: config.browserSync.port,
    server: {
      baseDir: config.browserSync.server,
    },
    logConnections: true,
    logFileChanges: true,
    notify: true
  });
});

gulp.task('watch', ['serve'], function() {
  gulp.watch(config.paths.styles + '*.styl',  ['styles']);
});

gulp.task('dev', function() {
  config.isProd = false;
  sequence(['browserify', 'styles'], 'watch');
});

gulp.task('build', function() {
  config.isProd = true;
  sequence(['browserify', 'styles']);
});
