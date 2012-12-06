var formatter;

(function() {
  var removeLineNumRegEx = /^Line\ [0-9]*\:\ /;

  formatter =  {
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
    endSection: function()  {
      log('</testsuite>');
    },
    endLog: function() {
      log('</testsuites>');
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = formatter;
  }
})();