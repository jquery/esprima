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

function testModule(code, exception) {
    'use strict';
    var i, options, expected, actual, err, tokenize;

    // Different parsing options should give the same error.
    options = [
        { sourceType: 'module' },
        { sourceType: 'module', comment: true },
        { sourceType: 'module', raw: true },
        { sourceType: 'module', raw: true, comment: true }
    ];

    if (!exception.message) {
        exception.message = 'Error: Line 1: ' + exception.description;
    }

    exception.description = exception.message.replace(/Error: Line [0-9]+: /, '');

    expected = JSON.stringify(exception);

    for (i = 0; i < options.length; i += 1) {

        try {
            esprima.parse(code, options[i]);
        } catch (e) {
            err = errorToObject(e);
            err.description = e.description;
            actual = JSON.stringify(err);
        }

        // Compensate for old V8 which does not handle invalid flag.
        if (exception.message.indexOf('Invalid regular expression') > 0) {
            if (typeof actual === 'undefined' && !handleInvalidRegexFlag()) {
                return;
            }
        }

        expect(expected).to.equal(actual);
    }
}

var moduleSpecs = _.omit(cases, function(cases) {
  return !cases.module;
});

describe('modules', function() {
  leche.withData(moduleSpecs, function(testCase) {
    it('should parse module', function() {
        testModule(testCase.case, testCase.module);
    });
  });
});
