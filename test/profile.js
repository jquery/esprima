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
N = 25;

fixture = [
    'Underscore 1.5.2',
    'Backbone 1.1.0',
    'MooTools 1.4.5',
    'jQuery 1.9.1',
    'YUI 3.12.0',
    'jQuery.Mobile 1.4.2',
    'Angular 1.2.5'
];

console.log('Parsing libraries for sampling profiling analysis...');

fixture.forEach(function (name) {
    var filename, source, expected, syntax, tokens, i;
    filename = name.toLowerCase().replace(/\.js/g, 'js').replace(/\s/g, '-');
    source = fs.readFileSync('test/3rdparty/' + filename + '.js', 'utf-8');
    console.log(' ', name);
    try {
        for (i = 0; i < N; ++i) {
            syntax = esprima.parse(source, { range: true, loc: true, raw: true });
        }
    } catch (e) {
        console.log('FATAL', e.toString());
        process.exit(1);
    }
});
