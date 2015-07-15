/*
  Copyright (c) jQuery Foundation, Inc. and Contributors, All Rights Reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

'use strict';

var totals = 0,
    cases = {};

function NotMatchingError(expected, actual) {
    Error.call(this, 'Expected ');
    this.expected = expected;
    this.actual = actual;
}
NotMatchingError.prototype = new Error();

function errorToObject(e) {
    'use strict';
    var msg = e.toString();

    // Opera 9.64 produces an non-standard string in toString().
    if (msg.substr(0, 6) !== 'Error:') {
        if (typeof e.message === 'string') {
            msg = 'Error: ' + e.message;
        }
    }

    return {
        index: e.index,
        lineNumber: e.lineNumber,
        column: e.column,
        message: msg
    };
}

function jsonify(obj, predicate) {
  if (!predicate) {
    predicate = null;
  }

  return JSON.stringify(obj, predicate, 4);
}

function handleInvalidRegexFlag() {
  // If handleInvalidRegexFlag is true, an invalid flag in a regular expression
  // will throw an exception. In some old version of V8, this is not the case
  // and hence handleInvalidRegexFlag is false.
  handleInvalidRegexFlag = false;
  try {
      'test'.match(new RegExp('[a-z]', 'x'));
  } catch (e) {
      handleInvalidRegexFlag = true;
  }

  return handleInvalidRegexFlag;
}

function sortedObject(o) {
    var keys, result;
    if (o === null) {
        return o;
    }
    if (Array.isArray(o)) {
        return o.map(sortedObject);
    }
    if (typeof o !== 'object') {
        return o;
    }
    if (o instanceof RegExp) {
        return o;
    }
    keys = Object.keys(o);
    result = {
        range: undefined,
        loc: undefined
    };
    keys.forEach(function (key) {
        if (o.hasOwnProperty(key)) {
            result[key] = sortedObject(o[key]);
        }
    });
    return result;
}

function hasAttachedComment(syntax) {
    var key;
    for (key in syntax) {
        if (key === 'leadingComments' || key === 'trailingComments') {
            return true;
        }
        if (typeof syntax[key] === 'object' && syntax[key] !== null) {
            if (hasAttachedComment(syntax[key])) {
                return true;
            }
        }
    }
    return false;
}

function enumerateFixtures() {
  function addCase(key, kind, item) {
      if (!cases[key]) {
          totals++
          cases[key] = { key: key };
      }

      cases[key][kind] = item;
  }

  _.each(__fixtures_js__, function(value, filePath) {

      function checkType(type) {
        var suffix = '.'+type;
        return filePath.slice(-suffix.length) === suffix
      }

      function getKey(type) {
        return filePath.slice(0, -type.length-1)
      }

      if (checkType('run')) {
        return addCase(getKey('run'), 'run', value);
      }

      if (checkType('source')) {
        return addCase(getKey('source'), 'source', value);
      }

      return addCase(filePath, 'case', value);
  });

  _.each(__fixtures_json__, function(value, filePath) {

      function getType() {
        return _(['module', 'tree', 'tokens', 'failure', 'result']).find(function(type) {
          var suffix = '.'+type;
          return (filePath.slice(-suffix.length) === suffix);
        });
      }

      function getKey() {
        var type = getType()
        return filePath.slice(0, -type.length-1)
      }

      function getValue() {
        return JSON.parse(value);
      }

      return addCase(getKey(), getType(), getValue());
  });
}

enumerateFixtures();
