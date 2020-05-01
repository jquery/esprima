/*
  Copyright (C) 2020 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2013 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
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

/*jslint sloppy:true browser:true */
/*global esprima:true, require:true */

var parseId;

function id(i) {
    return document.getElementById(i);
}

function deduceSourceType(code) {
    var type = 'module';

    try {
        esprima.parse(code, { sourceType: 'script' });
        type = 'script';
    } catch (e) {
    }

    return type;
}

function parse(delay) {
    if (parseId) {
        window.clearTimeout(parseId);
    }

    parseId = window.setTimeout(function () {
        var code, options, result, el, str;

        // Special handling for regular expression literal since we need to
        // convert it to a string literal, otherwise it will be decoded
        // as object "{}" and the regular expression would be lost.
        function adjustRegexLiteral(key, value) {
            if (key === 'value' && value instanceof RegExp) {
                value = value.toString();
            }
            return value;
        }

        code = window.editor.getText();
        options = {
            attachComment: id('comment').checked,
            range: id('range').checked,
            loc: id('loc').checked,
            sourceType: deduceSourceType(code)
        };

        id('tokens').value = '';
        id('info').className = 'alert-box secondary';

        try {
            result = esprima.parse(code, options);
            str = JSON.stringify(result, adjustRegexLiteral, 4);
            options.tokens = true;
            id('tokens').value = JSON.stringify(esprima.parse(code, options).tokens,
                adjustRegexLiteral, 4);
            if (window.updateTree) {
                window.updateTree(result);
            }
            id('info').innerHTML = 'No error';
        } catch (e) {
            if (window.updateTree) {
                window.updateTree();
            }
            str = e.name + ': ' + e.message;
            id('info').innerHTML  = str;
            id('info').className = 'alert-box alert';
        }

        el = id('syntax');
        el.value = str;

        el = id('url');
        el.value = location.protocol + "//" + location.host + location.pathname + '?code=' + encodeURIComponent(code);

        parseId = undefined;
    }, delay || 811);
}

window.onload = function () {

    $('#syntaxtree').tree({
        autoOpen: true,
        dragAndDrop: false,
        openedIcon: '-',
        closedIcon: '+'
    });

    window.updateTree = function (syntax) {

        if (typeof syntax === 'undefined') {
            return;
        }

        if (id('tab_tree').className !== 'active') {
            return;
        }

        function isArray(o) {
            return (typeof Array.isArray === 'function') ? Array.isArray(o) :
                Object.prototype.toString.apply(o) === '[object Array]';
        }

        function convert(node) {
            var data = [], value;
            if (isArray(node)) {
                for (var i = 0; i < node.length; ++i) {
                    value = node[i];
                    data.push({
                        name: '#' + (i + 1),
                        children: convert(value)
                    });
                }
            } else {
                for (var key in node) {
                    if (Object.prototype.hasOwnProperty.call(node, key)) {
                        value = node[key];
                        switch (typeof value) {
                            case 'string':
                            case 'number':
                            case 'boolean':
                                data.push({ name: key + ': ' + value.toString() });
                                break;
                            case 'object':
                                if (node instanceof RegExp) {
                                    data.push({ name: key + ': ' + value.toString() });
                                } else if (key === 'range' && isArray(value) && value.length === 2) {
                                    data.push({ name: key + ': [' + value[0] + ', ' + value[1] + ']' });
                                } else {
                                    data.push({ name: key, children: convert(value) });
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
            return data;
        }

        $('#syntaxtree').tree('loadData', convert(syntax));
    };

    function quickParse() { parse(1); }

    document.getElementById('comment').onchange = quickParse;
    document.getElementById('range').onchange = quickParse;
    document.getElementById('loc').onchange = quickParse;

    // Special handling for IE.
    document.getElementById('comment').onclick = quickParse;
    document.getElementById('range').onclick = quickParse;
    document.getElementById('loc').onclick = quickParse;

    id('show_syntax').onclick = function () {
        id('tab_tree').className = id('show_tree').className = '';
        id('tab_syntax').className = id('show_syntax').className = 'active';
        id('tab_tokens').className = id('show_tokens').className = '';
        id('tab_tree').style.display = 'none';
        id('tab_syntax').style.display = '';
        id('tab_tokens').style.display = 'none';
    };

    id('show_tree').onclick = function () {
        id('tab_tree').className = id('show_tree').className = 'active';
        id('tab_syntax').className = id('show_syntax').className = '';
        id('tab_tokens').className = id('show_tokens').className = '';
        id('tab_tree').style.display = '';
        id('tab_syntax').style.display = 'none';
        id('tab_tokens').style.display = 'none';
        quickParse();
    };

    id('show_tokens').onclick = function () {
        id('tab_tree').className = id('show_tree').className = '';
        id('tab_syntax').className = id('show_syntax').className = '';
        id('tab_tokens').className = id('show_tokens').className = 'active';
        id('tab_tree').style.display = 'none';
        id('tab_syntax').style.display = 'none';
        id('tab_tokens').style.display = '';
    };

    try {
        require(['custom/editor'], function (editor) {
            var queries, elements, code, i, iz, pair;

            window.editor = editor({ parent: 'editor', lang: 'js' });
            window.editor.getTextView().getModel().addEventListener("Changed", function () { parse(); });
            parse(100);

            if (location.search) {
                queries = {};
                elements = location.search.substring(1).split(/[;&]/);
                for (i = 0, iz = elements.length; i < iz; i += 1) {
                    pair = elements[i].split('=');
                    if (pair.length === 2) {
                        queries[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
                    }
                }
                code = queries.code;
                if (code) {
                    window.editor.setText(code);
                    quickParse();
                }
            }
        });
    } catch (e) {
    }


};
