'use strict';

// Dependencies
const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const sourcemaps = require('gulp-sourcemaps');
const glob = require('glob');

const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');

const kit = require('gulp-kit');

// const watchify = require('watchify');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const es = require('event-stream');

// --------------------------------------------------------------------------------
// ---------------------------------- Package Settings ----------------------------

// Folder settings
const settings = require('./folder-settings.json');
const sassOptions = require('./sass-settings.json');

// --------------------------------------------------------------------------------
// ---------------------------------- Tasks ---------------------------------------

// Kit Gulp Task
gulp.task('kit', function() {
	return gulp.src(settings.src.kit).pipe(kit()).pipe(gulp.dest(settings.dest.html));
});

// Sass Task
gulp.task('sass', function() {
	return gulp
		.src(settings.src.sass)
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sass(sassOptions))
		.on('error', sass.logError)
		.pipe(autoprefixer())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(settings.dest.css))
		.pipe(browserSync.stream());
});

// Transpile ES6 files and concat ES6 require files
gulp.task('babelify', function(done) {
	glob(settings.src.js, function(err, files) {
		if (err) done(err);

		var tasks = files.map(function(entry) {
			var filename = entry.replace('.js', '').replace(settings.src.js_folder + '/', '');
			console.log(filename);

			return (browserify({ entries: entry, debug: true })
					.transform('babelify', { presets: ['es2015'], sourceMapsAbsolute: true })
					// Minify output
					.plugin('minifyify', {
						map: filename + '.min.js.map',
						output: settings.dest.js + '/' + filename + '.min.js.map',
					})
					.bundle()
					.on('error', function(err) {
						console.error(err);
					})
					.pipe(source(filename + '.min.js'))
					.pipe(buffer())
					.pipe(gulp.dest(settings.dest.js)) );
		});
		es.merge(tasks).on('end', done);
	});
});

// Default Gulp Task
gulp.task('default', ['sass', 'babelify', /** 'compressImages'*/ 'kit'], function() {
	// Initialize browserSync
	browserSync.init({
		server: './',
	});

	// Watch changes in Kit files and apply transformation to html
	gulp.watch(settings.src.kit, ['kit']);

	// Watch Sass files and apply transform to css
	gulp.watch(settings.src.sass, ['sass']);

	// Reload browser when a change is observed on html files
	gulp.watch('*.html').on('change', browserSync.reload);

	// Watch changes in javascript files and apply Babel, and Browserify transpilation to ES5
	gulp.watch(settings.src.js, ['babelify']);

	// Reload browser when a change is observed on javascript files in the javascript distribution folder
	gulp.watch(settings.dest.js + '/**/*.js').on('change', browserSync.reload);
});
