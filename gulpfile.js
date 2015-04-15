var gulp = require('gulp');
var path = require('path');
var chug = require('gulp-chug');

var packageJSON = require('./package.json');
delete packageJSON.devDependencies;
delete packageJSON.scripts;
delete packageJSON.jest;
packageJSON.main = 'index.js';

var opts = {
  dist: 'dist/',
  copyAssets: [
   'src/js/**',
   {
      filename: 'package.json',
      asset: JSON.stringify(packageJSON, null, 2)
   }
  ],
  mainJs: 'src/js/index.js',
  mainScss: 'src/scss/ligo-core/index.scss',
  sync: {
    hostname: 'ligo.usa.hp.com',
    username: 'ligo',
    remoteDestination: '/var/www/html/libs'
  },
  webpack: {
    output: {
      filename: 'ligo.min.js',
      libraryTarget: "var",
      library: "Ligo"
    },
    resolve: {
      root: [
        path.resolve(__dirname, 'src/js'),
        path.resolve(__dirname, 'src/scss')
      ]
    }
  }
};

require('./src/js/utils/gulp-tasks')(gulp, opts);

gulp.task('sync-all', function() {
  
  gulp.src('./examples/demo/gulpfile.js').pipe(chug({
     tasks: ['sync']
  }));

  gulp.src('./examples/tour/gulpfile.js').pipe(chug({
     tasks: ['sync']
  }));

  gulp.src('./examples/server/gulpfile.js').pipe(chug({
     tasks: ['sync']
  }));

  gulp.src('./docs/gulpfile.js').pipe(chug({
     tasks: ['sync']
  }));

  gulp.src('./gulpfile.js').pipe(chug({
     tasks: ['sync']
  }));
});