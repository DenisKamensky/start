'use strict';
const gulp = require('gulp'),
fs = require('fs'),
vfs= require('vinyl-fs'),
sourcemaps = require('gulp-sourcemaps'),
sass = require('gulp-sass'),
plumber = require('gulp-plumber'),
notify = require('gulp-notify'),
autoprefixer= require('gulp-autoprefixer'),
csso = require('gulp-csso'),
rename = require('gulp-rename'),
browserSync = require('browser-sync').create(),
babel = require('gulp-babel'),
tinypng = require('gulp-tinypng'),
newer = require('gulp-newer'),
spritesmith = require('gulp.spritesmith'),
merge = require('merge-stream'),
buffer = require('gulp-buffer'),
uglify = require('gulp-uglify'),
concat= require('gulp-concat'),
apiKey= 'y1HWG6eusFi4SXWsvu0b2dlMsravG15U';
gulp.task('style',()=>{
  return vfs.src('app/styles/main.{sass,scss}')
  .pipe(plumber({
    errorHandler: notify.onError((err)=>{
      return {
        title: 'style error',
        message: err.message
      }
    })
  }))
  .pipe(sourcemaps.init())
  .pipe(sass({style: 'compressed'}))
  .pipe(autoprefixer({
    cascade: 'false',
    browsers: ['last 50 versions']
  }))
  .pipe(csso())
  .pipe(rename({
    suffix: '.min'
  }))
  .pipe(sourcemaps.write('maps'))
  .pipe(vfs.dest(`public/style`))
  .pipe(browserSync.stream({match: '**/*.css'}))
})
gulp.task('js',()=>{
  return vfs.src('app/js/**/main.js')
  .pipe(plumber({
    errerHandler: notify.onError((err)=>{
      return{
        title: 'js error',
        message: err.message
      }
    })
  }))
  .pipe(babel({
    presets: ['es2015']
  }))
  .pipe(uglify())
  .pipe(vfs.dest(`public/js`));
});
gulp.task('server',()=>{
  browserSync.init({
      server: {
        baseDir: "./public"
      }
    });
    gulp.watch('app/*.html',['html']);
    gulp.watch('app/styles/**/*.{sass,scss}',['style']);
    gulp.watch('app/**/*.js',['js']);
    gulp.watch('app/img/**/*.*',['tiny:png']);
    gulp.watch('public/**/*.js').on('change',browserSync.reload);
    gulp.watch('public/*.html').on('change',browserSync.reload);
})
gulp.task('html',()=>{
  return vfs.src('app/**/*.html')
  .pipe(vfs.dest('public'));
})
gulp.task('sprites',()=>{
  let spriteData = gulp.src('app/sprite/*.png').pipe(spritesmith({
   imgName: 'sprite.png',
   cssName: '_sprite.scss',
   padding: 10,
   imgPath: `../img/sprite.png`
 }));
  let  imgStream = spriteData.img
    .pipe(buffer())
    .pipe(tinypng(apiKey))
    .pipe(vfs.dest(`public/img`));
    var cssStream = spriteData.css
     .pipe(vfs.dest('app/styles'));
  return merge(imgStream, cssStream);
});
gulp.task('tiny:png',()=>{
  return vfs.src('app/img/**/*.*')
  .pipe(newer(`public/img`))
  .pipe(tinypng(apiKey))
  .pipe(vfs.dest(`public/img`));
})
function vendorStyles(files){
  return vfs.src(files)
  .pipe(autoprefixer())
  .pipe(concat('vendor.css'))
  .pipe(csso())
  .pipe(vfs.dest('public/style'))

}
function vendorScripts(files){
  return vfs.src(files)
  .pipe(concat('vendor.js'))
  .pipe(uglify())
  .pipe(vfs.dest('public/js'))
}
function vendor(){
  let settings = JSON.parse(fs.readFileSync('libs-path.json','utf8'));
  let styles = settings.styles;
  let scripts = settings.scripts;
  if(styles.length){
    vendorStyles(styles);
  }
  if(scripts.length){
    vendorScripts(scripts);
  }
};
gulp.task('vendor',vendor());
gulp.task('default',['server'],function(){
  try{
    fs.readFileSync('public/styles/vendor.css');
  }catch(e){
    vendor();
  }
  gulp.watch('app/sprite/**/*.png',['sprites']);
  gulp.watch('libs-path.json',['vendor']);
})
