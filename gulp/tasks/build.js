var gulp = require('gulp'),
usemin = require('gulp-usemin'),
rev = require('gulp-rev'), //updatuje nazwy
cssnano = require('gulp-cssnano');

gulp.task('usemin', gulp.series('styles', function(){
    return gulp.src('./public/temp/backend/index.html')
        .pipe(usemin({
            css: [
                function(){
                    return rev()
                },
                function(){
                    return cssnano()
                }
            ]
        }))
        .pipe(gulp.dest('./public'))
}));
