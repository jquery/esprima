var formatter;

(function() {
  var removeLineNumRegEx = /^Line\ [0-9]*\:\ /;

  function numberWang(wangaNumb) {
    var 
      thatsNumberWang = 8 - wangaNumb,
      stayNumberWang = '', i;

    for (i = 0; i < thatsNumberWang; i += 1) {
      stayNumberWang += ' ';
    }

    return stayNumberWang;
  }

  formatter = function(log) {
    return {
      startLog: function() { },
      startSection: function(fileName, errors, failures, tests, time) { 
        log("[esvalidate file:" + fileName + "]");
        errors = errors + failures;
        
        if(errors > 0) {
          log(errors + " Error" + (errors > 1 ? "s" : "") + ":");
        }
      },
      writeError: function(fileName, error, errorType) {        
        var msg = error.message;
        msg = msg.replace(removeLineNumRegEx, '');
        if(error.lineNumber && error.column) {
          log(numberWang((error.lineNumber.toString() + error.column.toString()).length), error.lineNumber + ',' + error.column + ':', msg);
        } else {
          log(msg);
        }
      },
      endSection: function() { },
      endLog: function() { }
    };
  };

  if (typeof module !== 'undefined') {
    module.exports = formatter;
  }
})();