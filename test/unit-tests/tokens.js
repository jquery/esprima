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

var jsonify = require('./lib/jsonify');
    esprima = require('../../esprima'),
    expect    = require("chai").expect,
    leche = require('leche'),
    _ = require('lodash'),
    cases = require('./lib/enumerate-fixtures');

function testTokenize(code, tokens) {
    'use strict';
    var options, expected, actual, tree;

    options = {
        comment: true,
        tolerant: true,
        loc: true,
        range: true
    };

    expected = jsonify(tokens);
    tree = esprima.tokenize(code, options);
    actual = jsonify(tree);

    expect(expected).to.equal(actual);
  }

var tokenSpecs = _.omit(cases, function(_case) {
  return !_case.tokens
});

describe('tokens', function() {
  leche.withData(tokenSpecs, function(testCase) {
    it('should parse', function() {
        testTokenize(testCase.case, testCase.tokens);
    });
  });
});
