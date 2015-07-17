var gulp = require('gulp'),
    concat = require('gulp-concat'),
    map = require('map-stream'),
    watch = require('gulp-watch'),
    File = require('vinyl'),
    karma = require('karma'),
    _ = require('lodash'),
    Mocha = require('mocha'),
    fs = require('fs');

function karmaStart(browser, options) {
  karma.server.start(_.extend({
    configFile: __dirname + '/karma.conf.js',
    browsers: [browser]
  }, options));
}

function mocha(done) {
  var mocha = new Mocha({
    ui: 'bdd',
    growl: true,
    useColors: true,
    useInlineDiffs: true
  });

  mocha.addFile('test/unit-tests.js');
  return mocha.run(done);
}

function buildFixture(ext) {
    var writeFixtures = function(ext) {
      return function(file, cb) {

       var content = file.contents.toString();
       var filePath = file.path.substring(file.base.length, file.path.length - ext.length -1);

       var newContent = "__fixtures_"+ext+"__['"+filePath+"'] = " + JSON.stringify(content) + ";\n\n";

       var newFile = new File({
         path: file.path,
         contents: new Buffer(newContent)
       });

       cb(null, newFile);
     };
    }

    var templateFixturesFile = function(ext) {
      return function(file, cb) {
         var content = file.contents.toString();

         var newContent = "";
         newContent += "var __fixtures_"+ext+"__ = {};\n";
         newContent += content;
         newContent += "module.exports = __fixtures_"+ext+"__";

         var newFile = new File({
           path: file.path,
           contents: new Buffer(newContent)
         });
        cb(null, newFile)
      }
    }

  return function() {
    gulp.dest('test/dist/');
    return gulp.src(['test/fixtures/**/*.'+ext])
      .pipe(map(writeFixtures(ext)))
      .pipe(concat('fixtures_'+ext+'.js'))
      .pipe(map(templateFixturesFile(ext)))
      .pipe(gulp.dest('test/dist/'));
  }
}

gulp.task('buildFixtures', function() {
  buildFixture('js')();
  buildFixture('json')();
});

gulp.task('watchFixtures', function() {
  gulp.watch('test/fixtures/**/**', ['buildFixtures']);
});

gulp.task('test', ['buildFixtures'], function() {
  return gulp.src('test/unit-tests/*.js')
    .pipe(mocha(function(errCount) {
      if (errCount) {
        console.log(errCount + ' failed tests.');
        process.exit(1);
      }
      process.exit(0);
    }));
});

gulp.task('test-chrome', ['watchFixtures'], function() {
  karmaStart('Chrome');
});
