var gulp = require('gulp'),
    concat = require('gulp-concat'),
    map = require('map-stream'),
    watch = require('gulp-watch'),
    File = require('vinyl'),
    gulpSequence = require('gulp-sequence'),
    karma = require('karma'),
    _ = require('lodash'),
    Mocha = require('mocha'),
    fs = require('fs'),
    path = require('path');


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

function buildFixture(ext) {
  return function() {
    gulp.src(['test/fixtures/**/*.'+ext])
      .pipe(map(writeFixtures(ext)))
      .pipe(concat('fixtures_'+ext+'.js'))
      .pipe(map(templateFixturesFile(ext)))
      .pipe(gulp.dest('test/dist/'));
  }
}

function karmaStart(browser, options) {
  karma.server.start(_.extend({
    configFile: __dirname + '/karma.conf.js',
    browsers: [browser]
  }, options));
}


gulp.task('jsFixtures', function() {
  return buildFixture('js')();
});

gulp.task('jsonFixtures', function() {
  return buildFixture('json')();
});

gulp.task('watchJsFixtures', function () {
  return watch('test/fixtures/**/*.js', buildFixture('js'));
})

gulp.task('watchJsonFixtures', function() {
  return watch('test/fixtures/**/*.json', buildFixture('json'));
})

gulp.task('karmaSingleRun', function () {
  karmaStart('PhantomJS', {singleRun: true});
});

gulp.task('karmaChrome', function () {
  karmaStart('Chrome');
});

gulp.task('karmaPhantom', function () {
  karmaStart('Phantom');
});

gulp.task('nodeMocha', function(done) {
  var mocha = new Mocha();

  mocha.addFile('test/unit-tests/api.js');
  mocha.addFile('test/unit-tests/failure.js');
  mocha.addFile('test/unit-tests/module.js');
  mocha.addFile('test/unit-tests/tokens.js');
  mocha.addFile('test/unit-tests/tree.js');

  mocha.run(function(failures){
    done();
  });
})

gulp.task('test',
  gulpSequence(
    ['jsFixtures', 'jsonFixtures'],
    'nodeMocha'
  )
);

gulp.task('test-watch',
  gulpSequence(
    ['jsFixtures', 'jsonFixtures', 'karmaPhantom'],
    ['watchJsFixtures', 'watchJsonFixtures']
  )
);

gulp.task('test-chrome',
  gulpSequence(
    ['jsFixtures', 'jsonFixtures', 'karmaChrome'],
    ['watchJsFixtures', 'watchJsonFixtures']
  )
);
