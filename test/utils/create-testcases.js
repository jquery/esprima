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

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(
            require('lodash'),
            require('../dist/fixtures_js'),
            require('../dist/fixtures_json')
        );
    } else {
        root.createTestCases = factory(_, window.fixtures_js, window.fixtures_json);
    }
}(this, function (_, jsFixtures, jsonFixtures) {

    var cases;

    function addCase(key, kind, item) {
        if (!cases[key]) {
            cases[key] = { key: key };
        }

        cases[key][kind] = item;
    }

    function addJsonFixture(value, filePath) {
        /**
         * Determines which type of test it is based on the filepath
         */
        function getType() {
            return _(['module', 'tree', 'tokens', 'failure', 'result']).find(function (type) {
                var suffix = '.' + type;
                return (filePath.slice(-suffix.length) === suffix);
            });
        }

        function getKey() {
            return filePath.slice(0, -getType().length - 1)
        }

        function getValue() {
            return value;
        }

        return addCase(getKey(), getType(), getValue());
    }

    function addJSFixture(value, filePath) {
        /**
         * checks to see if filepath is a run or source type.
         */
        function checkType(type) {
            var suffix = '.' + type;
            return filePath.slice(-suffix.length) === suffix
        }

        /**
         * builds a case key by stripping away the type
         */
        function getKey(type) {
            return filePath.slice(0, -type.length - 1)
        }

        /**
         * returns the js test case.
         * In the case of source tests, the input needs to be evaluated.
         */
        function getValue(value, shouldEval) {
            var source, newValue;

            if (shouldEval) {
                // return source from the eval
                newValue = eval(value + ';source');
            } else {
                newValue = value;
            }

            return newValue;
        }

        if (checkType('run')) {
            return addCase(getKey('run'), 'run', getValue(value));
        }

        if (checkType('source')) {
            return addCase(getKey('source'), 'source', getValue(value, true));
        }

        return addCase(filePath, 'case', getValue(value));
    }

    /**
     * Reads jsFixtures and jsonFixtures into cases dictionary
     */
    return function () {
        cases = {};
        _.each(jsFixtures, addJSFixture);
        _.each(jsonFixtures, addJsonFixture);
        return cases;
    }
}));
