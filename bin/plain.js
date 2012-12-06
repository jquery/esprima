var formatter;

(function() {
  var removeLineNumRegEx = /^Line\ [0-9]*\:\ /;

  formatter = {
    startLog: function() { },
    startSection: function(fileName, errors, failures, tests, time) { },
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
    endSection: function()  { },
    endLog: function() { }
  };

  if (typeof module !== 'undefined') {
    module.exports = formatter;
  }
})();