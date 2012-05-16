/*
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>

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

/*jslint browser:true evil:true */
/*global esprima:true */


function transpile(code) {
    'use strict';

    var result, tree, operations, i, op;

     // Executes visitor on the object and its children (recursively).
    function traverse(object, visitor, master) {
        var key, child, parent, path;

        parent = (typeof master === 'undefined') ? [] : master;

        if (visitor.call(null, object, parent) === false) {
            return;
        }
        for (key in object) {
            if (object.hasOwnProperty(key)) {
                child = object[key];
                path = [ object ];
                path.push(parent);
                if (typeof child === 'object' && child !== null) {
                    traverse(child, visitor, path);
                }
            }
        }
    }

    tree = esprima.parse(code, { range: true, raw: true });

    operations = [];

    traverse(tree, function (node, path) {
        var pos, text;
        if (node.type !== esprima.Syntax.Property) {
            return;
        }
        if (typeof node.shorthand !== 'undefined' && node.shorthand) {
            pos = node.key.range[1];
            text = node.key.name;
            if (typeof text === 'undefined') {
                text = node.key.raw;
            }
            text = ': ' + text;
            operations.push({
                pos: pos,
                text: text
            });
        }
    });

    operations.sort(function (a, b) { return b.pos - a.pos; });

    result = code;
    for (i = 0; i < operations.length; i += 1) {
        op = operations[i];
        result = result.slice(0, op.pos) + op.text + result.slice(op.pos, result.length);
    }

    return result;
}

var updateId;

function updateCode(delay) {
    'use strict';

    function setText(id, str) {
        var el = document.getElementById(id);
        if (typeof el.innerText === 'string') {
            el.innerText = str;
        } else {
            el.textContent = str;
        }
    }

    setText('error', 'No error.');

    if (updateId) {
        window.clearTimeout(updateId);
    }

    updateId = window.setTimeout(function () {
        var code, result, timestamp;


        if (typeof window.editor === 'undefined') {
            code = document.getElementById('code').value;
        } else {
            code = window.editor.getValue();
        }

        try {
            timestamp = new Date();
            result = transpile(code);
            timestamp = new Date() - timestamp;
            setText('error', 'No error. Transpiled in ' + timestamp + ' ms.');

            if (typeof window.resultview === 'undefined') {
                document.getElementById('result').value = result;
            } else {
                window.resultview.setValue(result);
            }
        } catch (e) {
            setText('error', e.name + ': ' + e.message);
        }

        updateId = undefined;
    }, delay || 250);
}
