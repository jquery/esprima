/*
  Copyright (C) 2013 Ariya Hidayat <ariya.hidayat@gmail.com>

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

var esprima, N, fixture, readFile;

// Loops for parsing, useful for stress-testing/profiling.
N = 1;

fixture = [
    'Underscore 1.5.2',
    'Backbone 1.0.0',
    'MooTools 1.4.5',
    'jQuery 1.9.1',
    'YUI 3.12.0',
    'jQuery.Mobile 1.3.2',
    'Angular 1.0.8'
];

if (typeof require === 'undefined') {
    load('esprima.js');
    readFile = this.read;
    console = { log: print };
} else {
    esprima = require('../esprima');
    readFile = function (filename) {
        return require('fs').readFileSync(filename, 'utf-8');
    };
}

console.log('Processing libraries...');

fixture.forEach(function (name) {
    var filename, source, i;
    filename = name.toLowerCase().replace(/\.js/g, 'js').replace(/\s/g, '-');
    source = readFile('test/3rdparty/' + filename + '.js');
    console.log(' ', name);
    try {
        for (i = 0; i < N; ++i) {
            esprima.parse(source, { range: true, loc: true });
        }
    } catch (e) {
        console.log('FATAL', e.toString());
        process.exit(1);
    }
});

