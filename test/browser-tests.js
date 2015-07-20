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

/**
 * Reads jsFixtures and jsonFixtures into cases dictionary
 */
function createTestCases(jsFixtures, jsonFixtures) {
    var cases = {};

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
                // strip away the `var` in `var source = "foo"`.
                eval(value.substring(4));
                newValue = source;
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

    _.each(jsFixtures, addJSFixture);
    _.each(jsonFixtures, addJsonFixture);
    return cases;
}

/**
 * Loops over the test cases and uses mocha `describe` and `it`
 * to run through the tests.
 */
function browserRunner(cases) {
    var keys, tree;

    /**
     * Takes a list of file paths and returns a tree, that will be
     * used to create the nested describes.
     */
    function buildTree(keys) {
        var subTrees;

        function firstPart(key) {
            return key.split('/')[0];
        }

        function dropFirst(key) {
            return _.drop(key.split('/')).join('/');
        }

        if (keys[0] == "") {
            return null;
        }

        subTrees = _.groupBy(keys, firstPart);
        return _.mapValues(subTrees, function (keys, key) {
            keys = _.map(keys, dropFirst);
            return buildTree(keys);
        });
    }

    function describeTests(tree, path) {
        var tests, testDirectory;

        // Create `it` for tests
        tests = _.omit(tree, _.isObject);
        _.each(_.keys(tests), function (testPath) {
            var testCases = _.omit(cases, function (testCase, key) {
                return !_.contains(key, path + "/" + testPath);
            })

            _.each(testCases, function (testCase) {
                var source, testCaseCase, name;

                source = testCase.source || '';
                testCaseCase = testCase.case || '';
                name = testCase.key + " - " + source  + testCaseCase;

                it(name, function () {
                    evaluateTestCase(testCase);
                });
            });
        })

        // Create `describe` for test directories
        testDirectory = _.omit(tree, _.isNull);
        _.each(testDirectory, function (subTree, key) {
            describe(key, function () {
                var newPath = path != "" ? path + "/" + key : key;
                describeTests(subTree, newPath)
            })
        })
    }

    describeTests(buildTree(_.keys(cases)), '');
}

var cases = createTestCases(window.fixtures_js, window.fixtures_json);
browserRunner(cases);
