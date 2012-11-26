(function() {
  var removeLineNumRegEx = /^Line\ [0-9]*\:\ /;

  var junit = function(log) { 

    return {
      startLog: function() {
        log('<?xml version="1.0" encoding="UTF-8"?>');
        log('<testsuites>');
      },
      startSection: function(fileName, errors, failures, tests, time) {
          log('<testsuite name="' + fileName + '" errors="' + errors + '" ' +
          ' failures="' + failures + '" ' + ' tests="' + tests + '" ' +
          ' time="' + time + '">');
      },
      writeError: function(fileName, error, errorType) {
        var errorMsg = error.Message;

        if (errorType === "SyntaxError") {
          errorMsg = error.message;
          errorMsg = 'Line ' + error.lineNumber + ': ' + errorMsg.replace(removeLineNumRegEx, '');
        }

        log('  <testcase name="' + errorMsg + '" ' + ' time="0">');
        log('    <error type="' + errorType + '" message="' + error.message + '">' +
                      error.message + '(' + fileName + ':' + ((error.lineNumber) ? ':' + error.lineNumber : '') + ')</error>');
        log('  </testcase>');
      },
      endSection: function(fileName, failures, tests, time)  {
        log('</testsuite>');
      },
      endLog: function() {
        log('</testsuites>');
      }
    };
  };

  var plain = function(log) { 

    return {
      startLog: function() { },
      startSection: function(fileName, failures, tests, time) { },
      writeError: function(fileName, error, errorType) {
        var msg = error.message;
        msg = msg.replace(removeLineNumRegEx, '');
        if(errorType === "SyntaxError") {
          msg = fileName + ':' + error.lineNumber + ': ' + msg;
        } else {
          msg = 'Error: ' + msg;
        }
        log(msg);
      },
      endSection: function(fileName, failures, tests, time)  { },
      endLog: function() { }
    };
  };

  var sublime = function(log) {

      function numberWang(wangaNumb) {
        var
          thatsNumberWang = 8 - wangaNumb,
          stayNumberWang = '', i;

        for (i = 0; i < thatsNumberWang; i += 1) {
          stayNumberWang += ' ';
        }

        return stayNumberWang;
      }

    return {
      startLog: function() { },
      startSection: function(fileName, failures, tests, time) { 
        log("[esvalidate file: " + fileName + "]");
        log(failures + " Errors:");
      },
      writeError: function(fileName, error, errorType) {
        log(numberWang((error.lineNumber.toString() + error.column.toString()).length), error.lineNumber + ',' + error.column + ':', error.message);
      },
      endSection: function(fileName, failures, tests, time) {
        log("[Finished in " + time + "]");
      },
      endLog: function() { }
    };
  };

var formats = {
  plain: plain,
  sublime: sublime, 
  junit: junit
};

module.exports = formats;

})();