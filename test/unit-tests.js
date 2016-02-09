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

var esprima = require('../'),
    evaluateTestCase = require('./utils/evaluate-testcase'),
    createTestCases = require('./utils/create-testcases'),
    errorToObject = require('./utils/error-to-object'),
    fs = require('fs'),
    path = require('path'),
    diff = require('json-diff').diffString,
    total = 0,
    result,
    failures = [],
    cases = {},
    context = {source: '', result: null},
    tick = new Date(),
    testCase,
    header;

function generateTestCase(testCase) {
    var options, tree, filePath, fileName;

    fileName = testCase.key + ".tree.json";
    try {
        options = {
            jsx: true,
            loc: true,
            range: true,
            tokens: true
        };
        tree = esprima.parse(testCase.case, options);
        tree = JSON.stringify(tree, null, 4);
    } catch (e) {
        if (typeof e.index === 'undefined') {
            console.error("Failed to generate test result.");
            throw e;
        }
        tree = errorToObject(e);
        tree.description = e.description;
        tree = JSON.stringify(tree);
        fileName = testCase.key + ".failure.json";
    }

    filePath = path.join(__dirname, 'fixtures', fileName);
    fs.writeFileSync(filePath, tree);
    console.error("Done.");
}

cases = createTestCases();
total = Object.keys(cases).length;

Object.keys(cases).forEach(function (key) {
    testCase = cases[key];

    if (testCase.hasOwnProperty('module')
        || testCase.hasOwnProperty('tree')
        || testCase.hasOwnProperty('tokens')
        || testCase.hasOwnProperty('failure')
        || testCase.hasOwnProperty('result')) {

        try {
            evaluateTestCase(testCase);
        } catch (e) {
            if (!e.expected) {
                throw e;
            }

            e.source = testCase.case || testCase.key;
            failures.push(e);
        }

    } else {
        console.error('Incomplete test case:' + testCase.key + '. Generating test result...');
        generateTestCase(testCase);
    }
});

tick = (new Date()) - tick;

header = total + ' tests. ' + failures.length + ' failures. ' + tick + ' ms';

if (failures.length) {
    console.error(header);
    failures.forEach(function (failure) {
        var expectedObject, actualObject;
        try {
            expectedObject = JSON.parse(failure.expected);
            actualObject = JSON.parse(failure.actual);

            console.error(failure.source + ': Expected\n    ' +
               failure.expected.split('\n').join('\n    ') +
               '\nto match\n    ' + failure.actual + '\nDiff:\n' +
               diff(expectedObject, actualObject));
        } catch (ex) {
            console.error(failure.source + ': Expected\n    ' +
               failure.expected.split('\n').join('\n    ') +
               '\nto match\n    ' + failure.actual);
        }
    });
} else {
    console.log(header);
}

process.exit(failures.length === 0 ? 0 : 1);
