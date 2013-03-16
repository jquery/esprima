/*
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

function updateTree(syntax) {

    if (window.tree) {
        window.tree.destroy();
        window.tree = null;
    }

    if (typeof syntax === 'undefined') {
        return;
    }

    if (id('tab_tree').className !== 'active') {
        return;
    }

    window.tree = new YAHOO.widget.TreeView("treeview");
    id('collapse').onclick = function () { window.tree.collapseAll(); };
    id('expand').onclick = function () { window.tree.expandAll(); };

    function isArray(o) {
        return (typeof Array.isArray === 'function') ? Array.isArray(o) :
            Object.prototype.toString.apply(o) === '[object Array]';
    }

    function convert(name, node) {
        var result, i, key, value, child;

        switch (typeof node) {
        case 'string':
            return {
                type: 'Text',
                label: name + ': ' + node
            };

        case 'number':
        case 'boolean':
            return {
                type: 'Text',
                label: name + ': ' + String(node)
            };

        case 'object':
            if (!node) {
                return {
                    type: 'Text',
                    label: name + ': null'
                };
            }
            if (node instanceof RegExp) {
                return {
                    type: 'Text',
                    label: name + ': ' + node.toString()
                };
            }
            result = {
                type: 'Text',
                label: name,
                expanded: true,
                children: []
            };
            if (isArray(node)) {
                if (node.length === 2 && name === 'range') {
                    result.label = name + ': [' + node[0] + ', ' + node[1] + ']';
                } else {
                    result.label = result.label + ' [' + node.length + ']';
                    for (i = 0; i < node.length; i += 1) {
                        key = String(i);
                        value = node[i];
                        child = convert(key, value);
                        if (isArray(child.children) && child.children.length === 1) {
                            result.children.push(child.children[0]);
                        } else {
                            result.children.push(convert(key, value));
                        }
                    }
                }
            } else {
                if (typeof node.type !== 'undefined') {
                    result.children.push({
                        type: 'Text',
                        label: node.type,
                        expanded: true,
                        children: [],
                        data: node
                    });
                    for (key in node) {
                        if (Object.prototype.hasOwnProperty.call(node, key)) {
                            if (key !== 'type') {
                                value = node[key];
                                result.children[0].children.push(convert(key, value));
                            }
                        }
                    }
                } else {
                    for (key in node) {
                        if (Object.prototype.hasOwnProperty.call(node, key)) {
                            value = node[key];
                            result.children.push(convert(key, value));
                        }
                    }
                }
            }
            return result;

        default:
            break;
        }

        return {
            type: 'Text',
            label: '?'
        };
    }

    window.tree.subscribe('focusChanged', function (args) {
        var from, to;

        function convert(loc) {
            return {
                line: loc.line - 1,
                ch:   loc.column
            };
        }

        if (window.editorMark) {
            window.editorMark.clear();
            delete window.editorMark;
        }
        if (args.newNode && args.newNode.data && args.newNode.data.loc) {
            from = convert(args.newNode.data.loc.start);
            to = convert(args.newNode.data.loc.end);
            window.editorMark = window.editor.markText(from, to, 'highlight');
        }
    });

    window.tree.buildTreeFromObject(convert('Program body', syntax.body));
    window.tree.render();
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
            comment: id('comment').checked,
            range: id('range').checked,
            loc: id('loc').checked,
            tolerant: id('tolerant').checked
        };

        id('tokens').value = '';
        id('info').className = 'alert-box secondary';

        try {
            result = esprima.parse(code, options);
            str = JSON.stringify(result, adjustRegexLiteral, 4);
            options.tokens = true;
            id('tokens').value = JSON.stringify(esprima.parse(code, options).tokens,
                adjustRegexLiteral, 4);
            updateTree(result);
            id('info').innerHTML = 'No error';
        } catch (e) {
            updateTree();
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
    function quickParse() { parse(1); }

    document.getElementById('comment').onchange = quickParse;
    document.getElementById('range').onchange = quickParse;
    document.getElementById('loc').onchange = quickParse;
    document.getElementById('tolerant').onchange = quickParse;

    // Special handling for IE.
    document.getElementById('comment').onclick = quickParse;
    document.getElementById('range').onclick = quickParse;
    document.getElementById('loc').onclick = quickParse;
    document.getElementById('tolerant').onclick = quickParse;

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
            window.editor.getTextView().getModel().addEventListener("Changed", parse);
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
                }
            }
        });
    } catch (e) {
    }


};
