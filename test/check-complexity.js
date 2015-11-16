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

var escomplex = require('escomplex-js'),
    content = require('fs').readFileSync(require.resolve('../'), 'utf-8'),
    opt = { logicalor: false, switchcase: false },
    MAX = 22,
    list = [], bad = [];

escomplex.analyse(content, opt).functions.forEach(function (entry) {
    var name = (entry.name === '<anonymous>') ? (':' + entry.line) : entry.name;
    list.push({ name: name, value: entry.cyclomatic });
});

list.sort(function (x, y) {
    return y.value - x.value;
});

console.log('Most cyclomatic-complex functions:');
list.slice(0, 6).forEach(function (entry) {
    console.log('  ', entry.name, entry.value);
    if (entry.value > MAX) {
        bad.push(entry);
    }
});
console.log();

if (bad.length > 0) {
    console.log('ERROR: Cyclomatic complexity treshold of', MAX, 'is exceeded!');
    bad.forEach(function (entry) {
        console.log('  ', entry.name, entry.value);
    });
    process.exit(1);
}
