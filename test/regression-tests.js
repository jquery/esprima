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

var fs = require('fs'),
    esprima = require('../'),
    N, fixture;

// Loops for parsing, useful for stress-testing/profiling.
N = 1;

fixture = [
    'Underscore 1.5.2',
    'Backbone 1.1.0',
    'MooTools 1.4.5',
    'jQuery 1.9.1',
    'YUI 3.12.0',
    'jQuery.Mobile 1.4.2',
    'Angular 1.2.5'
];

function sortedObject(o) {
    var keys, result;
    if (o === null) {
        return o;
    }
    if (o instanceof Array) {
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

function getBaselineSyntax(name) {
    var syntax, tree = null;
    try {
        syntax = fs.readFileSync('test/3rdparty/syntax/' + name + '.json', 'utf-8');
        tree = sortedObject(JSON.parse(syntax));
    } finally {
        return tree;
    }
}

function createBaselineSyntax(name, syntax) {
    var tree = JSON.stringify(syntax);
    fs.writeFileSync('test/3rdparty/syntax/' + name + '.json', tree, 'utf-8');
}

function writeActualSyntax(name, syntax) {
    var tree = JSON.stringify(syntax);
    fs.writeFileSync('test/3rdparty/syntax/' + name + '.actual.json', tree, 'utf-8');
}

function getBaselineTokens(name) {
    var data, tokens = null;
    try {
        data = fs.readFileSync('test/3rdparty/syntax/' + name + '.tokens', 'utf-8');
        tokens = sortedObject(JSON.parse(data));
    } finally {
        return tokens;
    }
}

function createBaselineTokens(name, tokens) {
    var data = JSON.stringify(sortedObject(tokens));
    fs.writeFileSync('test/3rdparty/syntax/' + name + '.tokens', data, 'utf-8');
}

function writeActualTokens(name, tokens) {
    var data = JSON.stringify(sortedObject(tokens));
    fs.writeFileSync('test/3rdparty/syntax/' + name + '.actual.tokens', data, 'utf-8');
}

console.log('Processing libraries...');

fixture.forEach(function (name) {
    var filename, source, expected, syntax, tokens, i;
    filename = name.toLowerCase().replace(/\.js/g, 'js').replace(/\s/g, '-');
    source = fs.readFileSync('test/3rdparty/' + filename + '.js', 'utf-8');
    console.log(' ', name);
    try {
        for (i = 0; i < N; ++i) {
            syntax = sortedObject(esprima.parse(source, { range: true, loc: true, raw: true }));
            tokens = sortedObject(esprima.tokenize(source, { range: true }));
        }
        expected = getBaselineSyntax(filename);
        if (expected) {
            if (JSON.stringify(expected) !== JSON.stringify(syntax)) {
                console.log('    Mismatch syntax tree!');
                writeActualSyntax(filename, syntax);
            }
        } else {
            console.log('    Baseline syntax does not exist. Creating one...');
            createBaselineSyntax(filename, syntax);
        }
        expected = getBaselineTokens(filename);
        if (expected) {
            if (JSON.stringify(expected) !== JSON.stringify(tokens)) {
                console.log('    Mismatch tokens!');
                writeActualTokens(filename, tokens);
            }
        } else {
            console.log('    Baseline tokens do not exist. Creating one...');
            createBaselineTokens(filename, tokens);
        }

    } catch (e) {
        console.log('FATAL', e.toString());
        process.exit(1);
    }
});

