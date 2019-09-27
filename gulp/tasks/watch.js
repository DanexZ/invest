var gulp = require('gulp'),
watch = require('gulp-watch'),
browserSync = require('browser-sync').create();

gulp.task('watch', function(){

    browserSync.init({
        notify: false, //nie będzie się pojawiał na stronie kwadracik inf. o przeładowaniu
        server: {
            baseDir: 'public'
        }
    });

    //(**) include all folders | (*).css include all css files at current folder /
    watch('./resources/css/**/*.css', function(){
        gulp.start('cssInject');
    })

    watch('./resources/js/**/*.js', function(){
        gulp.start('scriptsRefresh');
    });
});

//drugi argumanet to zależne zadania, podaję w tablicy nazwy zadań
gulp.task('cssInject', gulp.series('styles', function(){
    return gulp.src('./public/css/styles.css')
        .pipe( browserSync.stream() );
}));

gulp.task('scriptsRefresh', gulp.series('scripts', function(){
	//to do
}));