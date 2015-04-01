var del = require('del');
var scsslint = require('gulp-scss-lint');
var react = require('gulp-react');
var jshint = require('gulp-jshint');
var gulpWebpack = require('gulp-webpack');
var runSequence = require('run-sequence');
var assign = require('object-assign');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var assign = require('object-assign');
var rsync = require('gulp-rsync');

var webpackConfig = {
  output: {
    filename: 'index.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'jsx-loader'
      },
      {
        test: /\.svg$/,
        loader: 'file-loader?mimetype=image/svg'
      },
      {
        test: /\.scss$/,
        loader: 'style!css!sass?outputStyle=expanded'
      },
      {
        test: /\.htm$/,
        loader: 'jsx-loader!imports?React=react!html-jsx-loader'
      }
    ]
  }
};

module.exports = function(gulp, opts) {
  var options = opts || {};

  var dist = options.dist;

  if (options.base) {
    process.chdir(options.base);
  }

  gulp.task('copy', function() {
    (options.copyAssets || []).forEach(function(copyAsset) {
      var asset = copyAsset.asset ? copyAsset.asset : copyAsset;
      gulp.src(asset).pipe(gulp.dest(copyAsset.dist ? copyAsset.dist : dist));
    });
  });

  gulp.task('clean', function() {
    del.sync([options.dist]);
  });

  gulp.task('scsslint', function() {
    (options.scssAssets || []).forEach(function(scssAsset) {
      gulp.src(scssAsset).pipe(scsslint({
        'config': '.scss-lint.yml'
      })).pipe(scsslint.failReporter());
    });
  });

  gulp.task('jslint', function() {
    (options.jsAssets || []).forEach(function(jsAsset) {
      gulp.src(jsAsset)
        .pipe(react())
        .pipe(jshint())
        .pipe(jshint.reporter('default', {
          verbose: true
        }))
        .pipe(jshint.reporter('fail'));
    });
  });

  gulp.task('preprocess', function(callback) {
    runSequence('clean', 'copy', 'jslint', 'scsslint', callback);
  });

  gulp.task('dist', ['preprocess'], function() {
    var config = assign({}, webpackConfig, options.webpack, {
      plugins: [
        new webpack.optimize.UglifyJsPlugin({
          compress: {
            warnings: false
          }
        })
      ]
    });

    config.resolve.extensions = ['', '.js', '.json', '.htm', 'html', 'scss'];
    
    return gulp.src(options.mainJs)
      .pipe(gulpWebpack(config))
      .pipe(gulp.dest(dist));
  });

  gulp.task('dev', ['preprocess'], function() {

    var devWebpackConfig = assign({}, webpackConfig, options.webpack, {
      entry: {
        app: ['webpack/hot/dev-server', './' + options.mainJs],
        styles: ['webpack/hot/dev-server', './' + options.mainScss]
      },

      output: {
        filename: 'index.js',
        path: __dirname + dist
      },

      devtool: 'inline-source-map',

      plugins: [new webpack.HotModuleReplacementPlugin()]

    });

    devWebpackConfig.resolve.extensions = ['', '.js', '.json', '.htm', 'html', 'scss'];

    var devServerConfig = {
      contentBase: dist,
      hot: true,
      inline: true,
      stats: {
        colors: true
      }
    };

    if (options.devServerProxy) {
      devServerConfig.proxy = options.devServerProxy;
    } 

    new WebpackDevServer(webpack(devWebpackConfig), devServerConfig).
        listen(options.devServerPort || 8080, "localhost");

  });

  gulp.task('syncPre', function(callback) {
    return runSequence('dist', callback);
  });

  gulp.task('sync', ['syncPre'], function() {
    gulp.src(dist)
      .pipe(rsync({
        root: dist,
        hostname: 'ligo.usa.hp.com',
        username: 'ligo',
        destination: options.remoteDestination,
        recursive: true,
        relative: true,
        progress: true,
        incremental: true,
        clean: true,
        emptyDirectories: true,
        exclude: ['.DS_Store'],
      }));
  });

};