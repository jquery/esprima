/*
  Copyright JS Foundation and other contributors, https://js.foundation/

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS'
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
    failures = 0,
    defineProperty = Object.defineProperty;


delete Object.defineProperty;
try {
    esprima.parse('function f(a){}');
} catch (e) {
    ++failures;
}
Object.defineProperty = defineProperty;


if (typeof Object.defineProperty === 'function') {
    Object.defineProperty(Object.prototype, '$a', {
        get: function () { },
        configurable: true
    });
    try {
        esprima.parse('function f(a){}');
    } catch (e) {
        ++failures;
    }
    delete Object.prototype.$a;
} else {
    Object.defineProperty = function (o, p, desc) {
        o[p] = desc.value;
    };
    try {
        esprima.parse('function f(a){}');
    } catch (e) {
        ++failures;
    }
    delete Object.defineProperty;
}


process.exit(failures === 0 ? 0 : 1);
