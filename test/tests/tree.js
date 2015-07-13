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

function testParse(code, syntax) {
    'use strict';
    var expected, tree, actual, options, StringObject, i, len;

    function parseCode(code, options) {
      var tree, actual;

      tree = esprima.parse(code, options);

      if (options.tolerant) {
          for (i = 0, len = tree.errors.length; i < len; i += 1) {
              tree.errors[i] = errorToObject(tree.errors[i]);
          }
      }
      tree = sortedObject(tree);
      return tree;
    }

    // alias, so that JSLint does not complain.
    StringObject = String;

    options = {
        comment: (typeof syntax.comments !== 'undefined'),
        range: true,
        loc: true,
        tokens: (typeof syntax.tokens !== 'undefined'),
        raw: true,
        tolerant: (typeof syntax.errors !== 'undefined'),
        source: null,
        sourceType: syntax.sourceType
    };

    if (options.comment) {
        options.attachComment = hasAttachedComment(syntax);
    }


    if (syntax.tokens && syntax.tokens.length > 0) {
        options.range = (typeof syntax.tokens[0].range !== 'undefined');
        options.loc = (typeof syntax.tokens[0].loc !== 'undefined');
    }

    if (syntax.comments && syntax.comments.length > 0) {
        options.range = (typeof syntax.comments[0].range !== 'undefined');
        options.loc = (typeof syntax.comments[0].loc !== 'undefined');
    }

    if (options.loc) {
        options.source = syntax.loc.source;
    }

    syntax = sortedObject(syntax);
    expected = jsonify(syntax);

    try {
        // Some variations of the options.
        tree = esprima.parse(code, { tolerant: options.tolerant, sourceType: options.sourceType });
        tree = esprima.parse(code, { tolerant: options.tolerant, sourceType: options.sourceType, range: true });
        tree = esprima.parse(code, { tolerant: options.tolerant, sourceType: options.sourceType, loc: true });

        tree = parseCode(code, options);
        actual = jsonify(tree);

        // Only to ensure that there is no error when using string object.
        esprima.parse(new StringObject(code), options);

    } catch (e) {
        throw new NotMatchingError(expected, e.toString());
    }

    expect(expected).to.equal(actual);

    function filter(key, value) {
        return (key === 'loc' || key === 'range') ? undefined : value;
    }

    if (options.tolerant) {
        return;
    }


    // Check again without any location info.
    options.range = false;
    options.loc = false;
    syntax = sortedObject(syntax);
    expected = jsonify(syntax, filter);

    tree = parseCode(code, options);
    actual = jsonify(tree, filter);

    expect(expected).to.equal(actual);
}


var treeSpecs = _.omit(cases, function(cases) {
  return !cases.tree;
});

describe('Tree', function() {
  leche.withData(treeSpecs, function(testCase) {
    it('should parse', function() {
        testParse(testCase.case || testCase.source, testCase.tree);
    });
  });
});
