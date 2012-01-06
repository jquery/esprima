/*
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

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

/*jslint browser:true */

var timerId;

function collectRegex() {
    'use strict';

    function id(i) {
        return document.getElementById(i);
    }

    function escaped(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function setText(id, str) {
        var el = document.getElementById(id);
        if (typeof el.innerText === 'string') {
            el.innerText = str;
        } else {
            el.textContent = str;
        }
    }

    function isLineTerminator(ch) {
        return (ch === '\n' || ch === '\r' || ch === '\u2028' || ch === '\u2029');
    }

    function process(delay) {
        if (timerId) {
            window.clearTimeout(timerId);
        }

        timerId = window.setTimeout(function () {
            var code, lookup, options, result, i, str;

            if (typeof window.editor === 'undefined') {
                code = document.getElementById('code').value;
            } else {
                code = window.editor.getValue();
            }

            // While waiting for (line, column) support in Esprima
            // (see http://code.google.com/p/esprima/issues/detail?id=6).
            lookup = (function (str) {
                var i, len, ch, table;

                table = [];
                if (typeof str === 'string') {
                    len = str.length;
                    for (i = 0; i < len; i += 1) {
                        if (isLineTerminator(str.charAt(i))) {
                            table.push(i);
                        }
                    }
                    table.push(len);
                }

                function binarySearch(pos, p, q) {
                    var middle = Math.floor((p + q) / 2),
                        value = table[middle];

                    if (p >= q) {
                        if (pos < value) {
                            return {
                                line: p,
                                column: (p > 0) ? (pos - table[p - 1] - 1) : pos
                            };
                        } else {
                            return {
                                line: p + 1,
                                column: pos - table[p]
                            };
                        }
                    }
                    if (pos < value) {
                        return binarySearch(pos, p, Math.max(p, middle - 1));
                    } else {
                        return binarySearch(pos, Math.min(middle + 1, q), q);
                    }
                }

                return function (pos) {
                    var loc = binarySearch(pos, 0, table.length - 1);
                    return 'Line ' + (loc.line + 1) + ' column ' + (loc.column + 1);
                };
            }(code));
            window.lookupFunction = lookup;

            options = {
                range: true
            };

            result = [];
            function collect(node) {
                var str;
                if (node.type === 'Literal') {
                    if (node.value instanceof RegExp) {
                        str = node.value.toString();
                        if (str[0] === '/') {
                            result.push(node);
                        }
                    }
                }
            }

            try {
                window.esprima.traverse(code, options, collect);

                if (result.length > 0) {
                    str = '<p>Found <b>' + result.length + '</b> regex(s):</p>';
                    for (i = 0; i < result.length; i += 1) {
                        str += '<p>' + lookup(result[i].range[0]) + ': <code>';
                        str += escaped(result[i].value.toString()) + '</code>';
                        str += '</p>';
                    }
                    id('result').innerHTML = str;
                } else {
                    setText('result', 'No regex.');
                }
            } catch (e) {
                setText('result', e.toString());
            }

            timerId = undefined;
        }, delay || 811);
    }

    setText('version', window.esprima.version);
    process(1);
}
/* vim: set sw=4 ts=4 et tw=80 : */
