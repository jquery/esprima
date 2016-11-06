/*
  Copyright JS Foundation and other contributors, https://js.foundation/

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

var esprima, Benchmark, readFile, dirname, log, fixture;

fixture = [
    'Underscore 1.5.2',
    'Backbone 1.1.0',
    'MooTools 1.4.5',
    'jQuery 1.9.1',
    'YUI 3.12.0',
    'jQuery.Mobile 1.4.2',
    'Angular 1.2.5'
];

function slug(name) {
    return name.toLowerCase().replace(/\.js/g, 'js').replace(/\s/g, '-');
}

function kb(bytes) {
    return (bytes / 1024).toFixed(1);
}

function runTokenizerTests(tests) {
    var buffer = [],
        totalTime = 0,
        totalSize = 0,
        totalRme = 0;

    function pad(str, len) {
        var result = str;
        while (result.length < len) {
            result = ' ' + result;
        }
        return result;
    }

    tests.reduce(function (suite, filename) {
        var source = readFile(dirname + '/3rdparty/' + slug(filename) + '.js'),
            size = source.length;
        totalSize += size;
        return suite.add(filename, function () {
            var tokens = esprima.tokenize(source, { range: true, loc: true });
            buffer.push(tokens.length);
        }, {
                'onComplete': function (event) {
                    var result;
                    if (typeof gc === 'function') {
                        gc();
                    }
                    result = pad(this.name, 20);
                    result += pad(kb(size) + ' KiB', 12);
                    result += pad((1000 * this.stats.mean).toFixed(2), 10);
                    result += ' ms \xb1 ' + this.stats.rme.toFixed(2) + '%';
                    log(result);
                    totalTime += this.stats.mean;
                    totalRme += this.stats.mean * this.stats.rme * this.stats.rme;
                }
            });
    }, new Benchmark.Suite()).on('complete', function () {
        log('                     ------------------------');
        log(pad(kb(totalSize) + ' KiB', 32) +
            pad((1000 * totalTime).toFixed(2), 10) + ' ms \xb1 ' +
            Math.sqrt(totalRme / totalTime).toFixed(2) + '%'
        );
    }).run();
}

if (typeof require === 'undefined') {
    dirname = 'test';
    load(dirname + '/3rdparty/benchmark.js');
    load(dirname + '/../dist/esprima.js');
    Benchmark = this.Benchmark;
    esprima = this.esprima;
    readFile = this.read;
    log = print;
} else {
    Benchmark = require('./3rdparty/benchmark');
    esprima = require('../');
    readFile = function (filename) {
        return require('fs').readFileSync(filename, 'utf-8');
    };
    dirname = __dirname;
    log = console.log.bind(console);
}

log('Tokenizing speed (with' + (typeof gc === 'function' ? '' : 'out') + ' gc):');
runTokenizerTests(fixture);
