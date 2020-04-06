var gulp = require('gulp');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var uglifycss = require('gulp-uglifycss');

gulp.task('js', function () {
	return gulp.src('excalibur-duallist.js')
    .pipe(babel({
			presets: ['es2015']
		}))
		.pipe(uglify({ mangle: false }))
		.pipe(concat('excalibur-duallist.min.js'))
		.pipe(gulp.dest('dist/js/'));
});

gulp.task('css', function () {
  gulp.src('excalibur-duallist.css')
    .pipe(uglifycss({
      "maxLineLen": 80,
      "uglyComments": true
    }))
		.pipe(concat('excalibur-duallist.min.css'))
    .pipe(gulp.dest('dist/css/'));
});

gulp.task('default', ['css', 'js']);