var gulp = require('gulp'),
postcss = require('gulp-postcss'),
autoprefixer = require('autoprefixer'), //prefixuje
cssImport = require('postcss-import'), //importowaniemodularnych css i scalanie z plikiem głównym
hexrgba = require('postcss-hexrgba'); 

gulp.task('styles', function(){
    
    return gulp.src(['./resources/css/frontend.css'])
        .pipe( postcss([cssImport, hexrgba, autoprefixer]) )
        .on('error', function(errorInfo){
            //wyświetl informacje o błędzie i to w odpowiedni sposób
            console.log( errorInfo.toString() );
            //nie zatrzymuj obserowania jeśli wystąpi błąd w plikach
            this.emit('end'); 
        })
        .pipe( gulp.dest('./public') );
});