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

var _ = require('lodash');
var jsFixtures = require('../../dist/fixtures_js.js');
var jsonFixtures = require('../../dist/fixtures_json.js');

var cases = {}, totals = 0;

function enumerateFixtures(jsFixtures, jsonFixtures) {
  function addCase(key, kind, item) {
      if (!cases[key]) {
          totals++
          cases[key] = { key: key };
      }

      cases[key][kind] = item;
  }

  _.each(jsFixtures, function(value, filePath) {

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

  _.each(jsonFixtures, function(value, filePath) {

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

enumerateFixtures(jsFixtures, jsonFixtures);

module.exports = cases;
