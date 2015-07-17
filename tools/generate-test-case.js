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

var fs = require('fs'),
    cases = {},
    total = 0,
    testCase;

function generateTestCase(esprima, testCase) {
    var tree, fileName = testCase.key + ".tree.json";
    try {
        tree = esprima.parse(testCase.case, {loc: true, range: true});
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
    require('fs').writeFileSync(fileName, tree);
    console.error("Done.");
}


function enumerateFixtures(root) {
    var dirs = fs.readdirSync(root), key, kind,
        kinds = ['case', 'source', 'module', 'run', 'tree', 'tokens', 'failure', 'result'],
        suffices = ['js', 'js', 'json', 'js', 'json', 'json', 'json', 'json'];

    dirs.forEach(function (item) {
        var i, suffix;
        if (fs.statSync(root + '/' + item).isDirectory()) {
            enumerateFixtures(root + '/' + item);
        } else {
            kind = 'case';
            key = item.slice(0, -3);
            for (i = 1; i < kinds.length; i++) {
                suffix = '.' + kinds[i] + '.' + suffices[i];
                if (item.slice(-suffix.length) === suffix) {
                    key = item.slice(0, -suffix.length);
                    kind = kinds[i];
                }
            }
            key = root + '/' + key;
            if (!cases[key]) {
                total++;
                cases[key] = { key: key };
            }
            cases[key][kind] = fs.readFileSync(root + '/' + item, 'utf-8');
        }
    });
}

enumerateFixtures(__dirname + '/../test/fixtures');

Object.keys(cases).forEach(function (key) {
    if (cases.hasOwnProperty(key)) {
        testCase = cases[key];

        if (
            !(testCase.hasOwnProperty('module')
              || testCase.hasOwnProperty('tree')
              || testCase.hasOwnProperty('tokens')
              || testCase.hasOwnProperty('failure')
              || testCase.hasOwnProperty('result')
            )
        ) {
          console.error('Incomplete test case:' + testCase.key + '. Generating test result...');
          generateTestCase(esprima, testCase);
        }
    }
});
