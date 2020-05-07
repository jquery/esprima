Demo = (function () {
    'use strict';

    function $$(id) {
        return window.document.getElementById(id);
    }

    function StatusInfo(configs) {
        this.configs = configs;
        this.element = null;

        var self = this;

        this.showInfo = function (message) {
            var el = $$(self.configs.container);
            typeof el.innerText === 'string' ? (el.innerText = message) : (el.textContent = message);
            el.setAttribute('class', 'alert-box success');
        };

        this.showWarning = function (message) {
            var el = $$(self.configs.container);
            typeof el.innerText === 'string' ? (el.innerText = message) : (el.textContent = message);
            el.setAttribute('class', 'alert-box secondary');
        };

        this.showError = function (message) {
            var el = $$(self.configs.container);
            typeof el.innerText === 'string' ? (el.innerText = message) : (el.textContent = message);
            el.setAttribute('class', 'alert-box alert');
        };
    }

    function CodeEditor(configs, listeners) {
        this.configs = configs || {};
        this.listeners = listeners || {};

        this.editor = null;
        this.debounceTimer = null;

        var self = this;

        function registerCustomLanguage(language) {
            monaco.languages.register({ id: language });
            // Mimic Monaco's built-in Monarch for JavaScript
            // https://github.com/microsoft/monaco-languages
            monaco.languages.setMonarchTokensProvider(language, {
                defaultToken: 'invalid',
                tokenPostfix: '.js',

                keywords: [
                    'break',
                    'case',
                    'catch',
                    'class',
                    'continue',
                    'const',
                    'constructor',
                    'debugger',
                    'default',
                    'delete',
                    'do',
                    'else',
                    'export',
                    'extends',
                    'false',
                    'finally',
                    'for',
                    'from',
                    'function',
                    'get',
                    'if',
                    'import',
                    'in',
                    'instanceof',
                    'let',
                    'new',
                    'null',
                    'return',
                    'set',
                    'super',
                    'switch',
                    'symbol',
                    'this',
                    'throw',
                    'true',
                    'try',
                    'typeof',
                    'undefined',
                    'var',
                    'void',
                    'while',
                    'with',
                    'yield',
                    'async',
                    'await',
                    'of'
                ],

                operators: [
                    '<=',
                    '>=',
                    '==',
                    '!=',
                    '===',
                    '!==',
                    '=>',
                    '+',
                    '-',
                    '**',
                    '*',
                    '/',
                    '%',
                    '++',
                    '--',
                    '<<',
                    '</',
                    '>>',
                    '>>>',
                    '&',
                    '|',
                    '^',
                    '!',
                    '~',
                    '&&',
                    '||',
                    '?',
                    ':',
                    '=',
                    '+=',
                    '-=',
                    '*=',
                    '**=',
                    '/=',
                    '%=',
                    '<<=',
                    '>>=',
                    '>>>=',
                    '&=',
                    '|=',
                    '^=',
                    '@'
                ],

                symbols: /[=><!~?:&|+\-*\/\^%]+/,
                escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
                digits: /\d+(_+\d+)*/,
                octaldigits: /[0-7]+(_+[0-7]+)*/,
                binarydigits: /[0-1]+(_+[0-1]+)*/,
                hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,

                regexpctl: /[(){}\[\]\$\^|\-*+?\.]/,
                regexpesc: /\\(?:[bBdDfnrstvwWn0\\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,

                tokenizer: {
                    root: [[/[{}]/, 'delimiter.bracket'], { include: 'common' }],

                    common: [
                        // identifiers and keywords
                        [
                            /[a-z_$][\w$]*/,
                            {
                                cases: {
                                    '@keywords': 'keyword',
                                    '@default': 'identifier'
                                }
                            }
                        ],
                        [/[A-Z][\w\$]*/, 'type.identifier'], // to show class names nicely
                        // [/[A-Z][\w\$]*/, 'identifier'],

                        // whitespace
                        { include: '@whitespace' },

                        // regular expression: ensure it is terminated before beginning (otherwise it is an opeator)
                        [
                            /\/(?=([^\\\/]|\\.)+\/([gimsuy]*)(\s*)(\.|;|\/|,|\)|\]|\}|$))/,
                            { token: 'regexp', bracket: '@open', next: '@regexp' }
                        ],

                        // delimiters and operators
                        [/[()\[\]]/, '@brackets'],
                        [/[<>](?!@symbols)/, '@brackets'],
                        [
                            /@symbols/,
                            {
                                cases: {
                                    '@operators': 'delimiter',
                                    '@default': ''
                                }
                            }
                        ],

                        // numbers
                        [/(@digits)[eE]([\-+]?(@digits))?/, 'number.float'],
                        [/(@digits)\.(@digits)([eE][\-+]?(@digits))?/, 'number.float'],
                        [/0[xX](@hexdigits)/, 'number.hex'],
                        [/0[oO]?(@octaldigits)/, 'number.octal'],
                        [/0[bB](@binarydigits)/, 'number.binary'],
                        [/(@digits)/, 'number'],

                        // delimiter: after number because of .\d floats
                        [/[;,.]/, 'delimiter'],

                        // strings
                        [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-teminated string
                        [/'([^'\\]|\\.)*$/, 'string.invalid'], // non-teminated string
                        [/"/, 'string', '@string_double'],
                        [/'/, 'string', '@string_single'],
                        [/`/, 'string', '@string_backtick']
                    ],

                    whitespace: [
                        [/[ \t\r\n]+/, ''],
                        [/\/\*/, 'comment', '@comment'],
                        [/\/\/.*$/, 'comment']
                    ],

                    comment: [
                        [/[^\/*]+/, 'comment'],
                        [/\*\//, 'comment', '@pop'],
                        [/[\/*]/, 'comment']
                    ],

                    // We match regular expression quite precisely
                    regexp: [
                        [
                            /(\{)(\d+(?:,\d*)?)(\})/,
                            ['regexp.escape.control', 'regexp.escape.control', 'regexp.escape.control']
                        ],
                        [
                            /(\[)(\^?)(?=(?:[^\]\\\/]|\\.)+)/,
                            ['regexp.escape.control', { token: 'regexp.escape.control', next: '@regexrange' }]
                        ],
                        [/(\()(\?:|\?=|\?!)/, ['regexp.escape.control', 'regexp.escape.control']],
                        [/[()]/, 'regexp.escape.control'],
                        [/@regexpctl/, 'regexp.escape.control'],
                        [/[^\\\/]/, 'regexp'],
                        [/@regexpesc/, 'regexp.escape'],
                        [/\\\./, 'regexp.invalid'],
                        [/(\/)([gimsuy]*)/, [{ token: 'regexp', bracket: '@close', next: '@pop' }, 'keyword.other']]
                    ],

                    regexrange: [
                        [/-/, 'regexp.escape.control'],
                        [/\^/, 'regexp.invalid'],
                        [/@regexpesc/, 'regexp.escape'],
                        [/[^\]]/, 'regexp'],
                        [/\]/, { token: 'regexp.escape.control', next: '@pop', bracket: '@close' }]
                    ],

                    string_double: [
                        [/[^\\"]+/, 'string'],
                        [/@escapes/, 'string.escape'],
                        [/\\./, 'string.escape.invalid'],
                        [/"/, 'string', '@pop']
                    ],

                    string_single: [
                        [/[^\\']+/, 'string'],
                        [/@escapes/, 'string.escape'],
                        [/\\./, 'string.escape.invalid'],
                        [/'/, 'string', '@pop']
                    ],

                    string_backtick: [
                        [/\$\{/, { token: 'delimiter.bracket', next: '@bracketCounting' }],
                        [/[^\\`$]+/, 'string'],
                        [/@escapes/, 'string.escape'],
                        [/\\./, 'string.escape.invalid'],
                        [/`/, 'string', '@pop']
                    ],

                    bracketCounting: [
                        [/\{/, 'delimiter.bracket', '@bracketCounting'],
                        [/\}/, 'delimiter.bracket', '@pop'],
                        { include: 'common' }
                    ]
                }
            });
        }

        require.config({ paths: { vs: '../assets/monaco/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            var language = self.configs.language;
            if (language) {
                registerCustomLanguage(language);
            } else {
                language = 'javascript';
            }

            monaco.editor.defineTheme('custom', {
                base: 'vs',
                inherit: true,
                rules: [{ token: 'comment', foreground: 'aaaaaa', fontStyle: 'italic' }],
                colors: {
                    'editorLineNumber.foreground': '#ccc',
                    'editor.lineHighlightBackground': '#eaf2fe'
                }
            });

            var element = $$(self.configs.container);

            self.editor = monaco.editor.create(element, {
                language: language,
                folding: false,
                lineNumbersMinChars: 3,
                minimap: {
                    enabled: false
                },
                theme: 'custom',
                wordBasedSuggestions: false,
                quickSuggestions: false
            });

            if (self.configs.value) self.editor.getModel().setValue($$(self.configs.value).textContent);

            self.editor.getModel().onDidChangeContent(function () {
                if (self.editor && self.listeners.contentChanged) {
                    if (self.debounceTimer) window.clearTimeout(self.debounceTimer);
                    self.debounceTimer = window.setTimeout(self.listeners.contentChanged, 200);
                }
            });

            if (self.listeners.cursorMoved) self.editor.onDidChangeCursorPosition(self.listeners.cursorMoved);

            if (self.listeners.ready) self.listeners.ready();
            self.editor.focus();
        });

        this.getValue = function () {
            return self.editor.getModel().getValue();
        };

        this.setValue = function (value) {
            self.editor.getModel().setValue(value);
        };

        this.getCursorOffset = function () {
            var selection = self.editor.getSelection();
            return self.editor.getModel().getOffsetAt(selection.getPosition());
        };

        this.setCursorOffset = function (offset) {
            var pos = self.editor.getModel().getPositionAt(offset);
            self.editor.setSelection(new monaco.Selection(pos.lineNumber, pos.column, pos.lineNumber, pos.column));
        };

        this.getPositionAt = function (offset) {
            return self.editor.getModel().getPositionAt(offset);
        };

        this.markers = [];

        this.clearMarkers = function () {
            self.markers = [];
            monaco.editor.setModelMarkers(self.editor.getModel(), 'code-editor', this.markers);
        };

        this.addErrorMarker = function (message, lineNumber, column) {
            self.markers.push({
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: lineNumber,
                startColumn: column,
                endLineNumber: lineNumber,
                endColumn: column,
                message: message
            });
            monaco.editor.setModelMarkers(self.editor.getModel(), 'code-editor', this.markers);
        };

        this.addInfoMarker = function (message, lineNumber, column) {
            self.markers.push({
                severity: monaco.MarkerSeverity.Info,
                startLineNumber: lineNumber,
                startColumn: column,
                endLineNumber: lineNumber,
                endColumn: column,
                message: message
            });
            monaco.editor.setModelMarkers(self.editor.getModel(), 'code-editor', this.markers);
        };

        this.previousDecorations = [];

        this.clearDecorations = function () {
            self.previousDecorations = self.editor.deltaDecorations(self.previousDecorations, []);
        };

        this.createDecoration = function (className, loc) {
            return {
                range: new monaco.Range(loc.start.line, loc.start.column + 1, loc.end.line, loc.end.column + 1),
                options: {
                    inlineClassName: className
                }
            };
        };

        this.applyDecorations = function (highlights) {
            self.previousDecorations = self.editor.deltaDecorations(self.previousDecorations, highlights);
        };
    }

    function TreeViz(configs, listeners) {
        this.configs = configs || {};
        this.listeners = listeners || {};

        var self = this;

        $$('show_tree').onclick = function () {
            $$('tab_tree').className = $$('show_tree').className = 'active';
            $$('tab_syntax').className = $$('show_syntax').className = '';
            $$('tab_tokens').className = $$('show_tokens').className = '';
            $$('tab_tree').style.display = '';
            $$('tab_syntax').style.display = 'none';
            $$('tab_tokens').style.display = 'none';
            if (self.listeners.tabSwitched) self.listeners.tabSwitched();
        };

        $$('show_syntax').onclick = function () {
            $$('tab_tree').className = $$('show_tree').className = '';
            $$('tab_syntax').className = $$('show_syntax').className = 'active';
            $$('tab_tokens').className = $$('show_tokens').className = '';
            $$('tab_tree').style.display = 'none';
            $$('tab_syntax').style.display = '';
            $$('tab_tokens').style.display = 'none';
            if (self.listeners.tabSwitched) self.listeners.tabSwitched();
        };

        $$('show_tokens').onclick = function () {
            $$('tab_tree').className = $$('show_tree').className = '';
            $$('tab_syntax').className = $$('show_syntax').className = '';
            $$('tab_tokens').className = $$('show_tokens').className = 'active';
            $$('tab_tree').style.display = 'none';
            $$('tab_syntax').style.display = 'none';
            $$('tab_tokens').style.display = '';
            if (self.listeners.tabSwitched) self.listeners.tabSwitched();
        };

        $('#syntaxtree').tree({
            autoOpen: true,
            dragAndDrop: false,
            openedIcon: '-',
            closedIcon: '+'
        });

        // Special handling for regular expression literal since we need to
        // convert it to a string literal, otherwise it will be decoded
        // as object "{}" and the regular expression would be lost.
        function adjustRegexLiteral(key, value) {
            if (key === 'value' && value instanceof RegExp) {
                value = value.toString();
            }
            return value;
        }

        this.updateSyntax = function (syntax) {
            $$('syntax').value = JSON.stringify(syntax, adjustRegexLiteral, 2);
        };

        this.updateTokens = function (tokens) {
            $$('tokens').value = JSON.stringify(tokens, adjustRegexLiteral, 4);
        };

        this.updateTree = function (syntax) {
            if (typeof syntax === 'undefined') {
                $('#syntaxtree').tree('loadData', []);
                return;
            }

            function isArray(o) {
                return typeof Array.isArray === 'function'
                    ? Array.isArray(o)
                    : Object.prototype.toString.apply(o) === '[object Array]';
            }

            function convert(node) {
                var data = [],
                    value;
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
    }

    function deduceSourceType(code) {
        var type = 'module';

        try {
            esprima.parse(code, { sourceType: 'script' });
            type = 'script';
        } catch (e) {}

        return type;
    }

    // parse.html
    function visualizer() {
        var statusInfo = new StatusInfo({ container: 'info' });

        var codeEditor = new CodeEditor(
            { container: 'editor', value: 'init' },
            {
                ready: initialize,
                contentChanged: visualize
            }
        );

        var treeViz = new TreeViz();

        function initialize() {
            window.setTimeout(visualize, 0); // first time

            statusInfo.showInfo('Ready.');

            $$('comment').onchange = visualize;
            $$('range').onchange = visualize;
            $$('loc').onchange = visualize;

            // Special handling for IE.
            $$('comment').onclick = visualize;
            $$('range').onclick = visualize;
            $$('loc').onclick = visualize;

            if (location.search) {
                var queries = {};
                var elements = location.search.substring(1).split(/[;&]/);
                for (var i = 0; i < elements.length; i += 1) {
                    var pair = elements[i].split('=');
                    if (pair.length === 2) {
                        queries[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
                    }
                }
                var code = queries.code;
                if (code) {
                    codeEditor.setValue(code);
                    visualize();
                }
            }
        }

        function visualize() {
            var code = codeEditor.getValue();

            var loc = window.location;
            $$('url').value = loc.protocol + '//' + loc.host + loc.pathname + '?code=' + encodeURIComponent(code);

            var options = {
                attachComment: $$('comment').checked,
                range: $$('range').checked,
                loc: $$('loc').checked,
                sourceType: deduceSourceType(code)
            };
            try {
                var syntax = esprima.parse(code, options);
                treeViz.updateTree(syntax);
                treeViz.updateSyntax(syntax);
                options.tokens = true;
                treeViz.updateTokens(esprima.parse(code, options).tokens);
                statusInfo.showInfo('No error.');
            } catch (e) {
                statusInfo.showError(e.toString());
            }
        }
    }

    // validate.html
    function validator() {
        var statusInfo = new StatusInfo({ container: 'info' });

        var codeEditor = new CodeEditor(
            { container: 'editor', value: 'init' },
            {
                ready: initialize,
                contentChanged: validate
            }
        );

        function initialize() {
            statusInfo.showInfo('Ready.');
            validate(); // first time
        }

        function validate() {
            try {
                codeEditor.clearMarkers();
                var code = codeEditor.getValue();
                var syntax = esprima.parse(code, { tolerant: true, loc: true, range: true });
                if (syntax.errors.length > 0) {
                    for (var i = 0; i < syntax.errors.length; ++i) {
                        var e = syntax.errors[i];
                        codeEditor.addErrorMarker(e.description, e.lineNumber, e.column);
                    }
                    statusInfo.showError('Invalid code. Total issues: ' + syntax.errors.length);
                } else {
                    if (syntax.body.length === 0) {
                        statusInfo.showWarning('info', 'Empty code. Nothing to validate.');
                    }
                    statusInfo.showInfo('Code is syntactically valid.');
                }
            } catch (e) {
                codeEditor.addErrorMarker(e.toString(), e.lineNumber, e.column);
                statusInfo.showError(e.toString());
            }
        }
    }

    // collector.html
    function regexCollector() {
        var statusInfo = new StatusInfo({ container: 'info' });

        var codeEditor = new CodeEditor(
            { container: 'editor', value: 'init' },
            {
                ready: initialize,
                contentChanged: collect
            }
        );

        function initialize() {
            statusInfo.showInfo('Ready.');
            collect(); // first time
        }

        function collect() {
            function createRegex(pattern, mode) {
                var literal;
                try {
                    literal = new RegExp(pattern, mode);
                } catch (e) {
                    // Invalid regular expression.
                    return;
                }
                return literal;
            }

            codeEditor.clearDecorations();
            try {
                var highlights = [];
                var code = codeEditor.getValue();

                esprima.parse(code, { tolerant: true, loc: true }, function (node) {
                    if (node.type === 'Literal') {
                        if (node.value instanceof RegExp)
                            highlights.push(codeEditor.createDecoration('highlight-decoration', node.loc));
                    }
                    if (node.type === 'NewExpression' || node.type === 'CallExpression') {
                        if (node.callee.type === 'Identifier' && node.callee.name === 'RegExp') {
                            var arg = node['arguments'];
                            if (arg.length === 1 && arg[0].type === 'Literal') {
                                if (typeof arg[0].value === 'string') {
                                    if (createRegex(arg[0].value))
                                        highlights.push(codeEditor.createDecoration('highlight-decoration', node.loc));
                                }
                            }
                            if (arg.length === 2 && arg[0].type === 'Literal' && arg[1].type === 'Literal') {
                                if (typeof arg[0].value === 'string' && typeof arg[1].value === 'string') {
                                    if (createRegex(arg[0].value, arg[1].value))
                                        highlights.push(codeEditor.createDecoration('highlight-decoration', node.loc));
                                }
                            }
                        }
                    }
                });
                if (highlights.length > 0) {
                    codeEditor.applyDecorations(highlights);
                    statusInfo.showInfo('Total regular expressions: ' + highlights.length);
                } else {
                    statusInfo.showWarning('No regex found.');
                }
            } catch (e) {
                statusInfo.showError(e.toString());
            }
        }
    }

    // functiontrace.html
    function functionTracer() {
        var statusInfo = new StatusInfo({ container: 'info' });

        var codeEditor = new CodeEditor(
            { container: 'editor', value: 'init' },
            {
                ready: function () {
                    statusInfo.showWarning('Ready.');
                    $$('run').onclick = traceRun;
                },
                contentChanged: function () {
                    statusInfo.showWarning('Ready.');
                }
            }
        );

        function traceRun() {
            try {
                statusInfo.showWarning('Executing...');
                createTraceCollector();
                var code = traceInstrument();
                var timestamp = +new Date();
                eval(code);
                var elapsed = +new Date() - timestamp;
                showResult();
                statusInfo.showInfo('Tracing completed in ' + (1 + elapsed) + ' ms');
            } catch (e) {
                statusInfo.showError(e.toString());
            }
        }

        function createTraceCollector() {
            window.TRACE = {
                hits: {},
                enterFunction: function (info) {
                    var key = info.name + ':' + info.range[0];
                    if (this.hits.hasOwnProperty(key)) {
                        this.hits[key] = this.hits[key] + 1;
                    } else {
                        this.hits[key] = 1;
                    }
                },
                getHistogram: function () {
                    var histogram = [];
                    for (var entry in this.hits) {
                        if (this.hits.hasOwnProperty(entry)) {
                            histogram.push({ name: entry, count: this.hits[entry] });
                        }
                    }
                    histogram.sort(function (a, b) {
                        return b.count - a.count;
                    });
                    return histogram;
                }
            };
        }

        function traceInstrument() {
            var code = codeEditor.getValue();
            var tracer = window.esmorph.Tracer.FunctionEntrance(function (fn) {
                var signature = 'window.TRACE.enterFunction({ ';
                signature += 'name: "' + fn.name + '", ';
                signature += 'lineNumber: ' + fn.loc.start.line + ', ';
                signature += 'range: [' + fn.range[0] + ',' + fn.range[1] + ']';
                signature += ' });';
                return signature;
            });

            code = window.esmorph.modify(code, tracer);

            // Enclose in IIFE.
            code = '(function() {\n' + code + '\n}())';

            return code;
        }

        function showResult() {
            var histogram = window.TRACE.getHistogram();
            codeEditor.clearMarkers();
            for (var i = 0; i < histogram.length; i += 1) {
                var entry = histogram[i];
                var name = entry.name.split(':')[0];
                var offset = parseInt(entry.name.split(':')[1], 10);
                var pos = codeEditor.getPositionAt(offset);
                var msg = name + ' is called ' + entry.count.toString() + ' time';
                if (entry.count > 1) msg += 's';
                codeEditor.addInfoMarker(msg, pos.lineNumber, pos.column);
            }
        }
    }

    // rewrite.html
    function rewriter() {
        var statusInfo = new StatusInfo({ container: 'info' });

        var codeEditor = new CodeEditor(
            { container: 'editor', value: 'init' },
            {
                ready: function () {
                    statusInfo.showWarning('Ready.');
                    $$('rewrite').onclick = sourceRewrite;
                },
                contentChanged: function () {
                    statusInfo.showWarning('Ready.');
                }
            }
        );

        function sourceRewrite() {
            var code = codeEditor.getValue();

            var indent = '';
            if ($$('onetab').checked) {
                indent = '\t';
            } else if ($$('twospaces').checked) {
                indent = '  ';
            } else if ($$('fourspaces').checked) {
                indent = '    ';
            }

            var quotes = 'auto';
            if ($$('singlequotes').checked) {
                quotes = 'single';
            } else if ($$('doublequotes').checked) {
                quotes = 'double';
            }

            var option = {
                comment: true,
                format: {
                    indent: {
                        style: indent
                    },
                    quotes: quotes
                }
            };

            try {
                var syntax = window.esprima.parse(code, { raw: true, tokens: true, range: true, comment: true });
                syntax = window.escodegen.attachComments(syntax, syntax.comments, syntax.tokens);
                code = window.escodegen.generate(syntax, option);
                codeEditor.setValue(code);
                statusInfo.showInfo('Rewriting was successful.');
            } catch (e) {
                statusInfo.showError(e.toString());
            }
        }
    }

    // minify.html
    function minifier() {
        var statusInfo = new StatusInfo({ container: 'info' });

        var codeEditor = new CodeEditor(
            { container: 'editor', value: 'init' },
            {
                ready: function () {
                    statusInfo.showWarning('Ready.');
                    $$('minify').onclick = minify;
                },
                contentChanged: function () {
                    statusInfo.showWarning('Ready.');
                }
            }
        );

        function createPipeline() {
            var passes, pipeline, inputs, i, el, optimizer;

            passes = {
                'eliminate-dead-code': 'pass/dead-code-elimination',
                'fold-constant': 'pass/tree-based-constant-folding',
                'remove-unreachable-branch': 'pass/remove-unreachable-branch',
                'remove-unused-vars': 'pass/drop-variable-definition'
            };

            pipeline = [
                'pass/hoist-variable-to-arguments',
                'pass/transform-dynamic-to-static-property-access',
                'pass/transform-dynamic-to-static-property-definition',
                'pass/transform-immediate-function-call',
                'pass/transform-logical-association',
                'pass/reordering-function-declarations',
                'pass/remove-unused-label',
                'pass/remove-empty-statement',
                'pass/remove-wasted-blocks',
                'pass/transform-to-compound-assignment',
                'pass/transform-to-sequence-expression',
                'pass/transform-branch-to-expression',
                'pass/transform-typeof-undefined',
                'pass/reduce-sequence-expression',
                'pass/reduce-branch-jump',
                'pass/reduce-multiple-if-statements',
                'pass/dead-code-elimination',
                'pass/remove-side-effect-free-expressions',
                'pass/remove-context-sensitive-expressions',
                'pass/tree-based-constant-folding',
                'pass/drop-variable-definition',
                'pass/remove-unreachable-branch'
            ];

            inputs = document.getElementsByTagName('input');
            for (i = 0; i < inputs.length; i += 1) {
                el = inputs[i];
                optimizer = passes[el.id];
                if (optimizer && el.checked === false) {
                    pipeline.splice(pipeline.indexOf(optimizer), 1);
                }
            }

            pipeline = pipeline.map(window.esmangle.require);
            pipeline = [pipeline];
            pipeline.push({
                once: true,
                pass: [
                    'post/transform-static-to-dynamic-property-access',
                    'post/transform-infinity',
                    'post/rewrite-boolean',
                    'post/rewrite-conditional-expression'
                ].map(window.esmangle.require)
            });

            return pipeline;
        }

        function obfuscate(syntax) {
            var result = window.esmangle.optimize(syntax, createPipeline());

            if ($$('mangle').checked) {
                result = window.esmangle.mangle(result);
            }

            return result;
        }

        function minify() {
            var code = codeEditor.getValue();

            var option = {
                format: {
                    indent: {
                        style: ''
                    },
                    quotes: 'auto',
                    compact: true
                }
            };

            try {
                var before = code.length;
                var syntax = window.esprima.parse(code, { raw: true, loc: true });
                syntax = obfuscate(syntax);
                code = window.escodegen.generate(syntax, option);
                var after = code.length;
                if (before > after) {
                    codeEditor.setValue(code);
                    statusInfo.showInfo('No error. Minifying ' + before + ' bytes to ' + after + ' bytes.');
                } else {
                    statusInfo.showWarning('Can not minify further, code is already optimized.');
                }
            } catch (e) {
                statusInfo.showError(e.toString());
            }
        }
    }

    // highlight.html
    function highlighter() {
        var statusInfo = new StatusInfo({ container: 'info' });

        var codeEditor = new CodeEditor(
            { container: 'editor', value: 'init' },
            {
                ready: initialize,
                contentChanged: reparse,
                cursorMoved: trackCursor
            }
        );

        function initialize() {
            reparse(); // first time
            codeEditor.setCursorOffset(300);
        }

        var context;

        function reparse() {
            var code = codeEditor.getValue();
            var options = {
                tolerant: true,
                range: true,
                loc: true,
                sourceType: deduceSourceType(code)
            };

            try {
                if (!context) {
                    context = new esrefactor.Context();
                }
                var syntax = esprima.parse(code, options);
                context.setCode(syntax);
                statusInfo.showInfo('Ready');
            } catch (e) {
                statusInfo.showError(e.toString());
            }
        }

        function trackCursor() {
            var decorations = [];

            var offset = codeEditor.getCursorOffset();
            var identification = context.identify(offset);
            if (identification) {
                var identifier = identification.identifier;
                var declaration = identification.declaration;
                var references = identification.references;
                if (declaration) {
                    if (declaration.range !== identifier.range)
                        decorations.push(codeEditor.createDecoration('declaration-decoration', declaration.loc));
                    statusInfo.showInfo(
                        "Identifier '" + identifier.name + "' is declared in line " + declaration.loc.start.line + '.'
                    );
                } else {
                    statusInfo.showWarning("Warning: No declaration is found for '" + identifier.name + "'.");
                }
                for (var i = 0; i < references.length; ++i) {
                    decorations.push(codeEditor.createDecoration('reference-decoration', references[i].loc));
                }
            } else {
                statusInfo.showInfo('Ready.');
            }

            codeEditor.applyDecorations(decorations);
        }
    }

    // rename.html
    function renamer() {
        var statusInfo = new StatusInfo({ container: 'info' });

        var codeEditor = new CodeEditor(
            { container: 'editor', value: 'init' },
            {
                ready: initialize,
                contentChanged: parse,
                cursorMoved: trackCursor
            }
        );

        // important state
        var context, code, cursorOffset, syntax, identification;

        function initialize() {
            context = new esrefactor.Context();
            parse();
            codeEditor.setCursorOffset(300);
        }

        function parse() {
            if (!context) {
                context = new esrefactor.Context();
            }

            if (identification && identification.identifier) rename();

            code = codeEditor.getValue();
            var options = {
                tolerant: true,
                range: true,
                loc: true,
                tokens: true,
                sourceType: deduceSourceType(code)
            };

            try {
                codeEditor.clearDecorations();
                identification = null;
                syntax = esprima.parse(code, options);
                context.setCode(syntax);
                statusInfo.showInfo('Ready.');
            } catch (e) {
                statusInfo.showError(e.toString());
            } finally {
                trackCursor();
            }
        }

        function rename() {
            if (!identification || !syntax) {
                contextify();
                return;
            }

            // Locate the token corresponding to the renamed identifier.
            var index = -1,
                offset,
                charOffset;
            for (var i = 0; i < syntax.tokens.length; ++i) {
                var token = syntax.tokens[i];
                if (token.range[0] === identification.identifier.range[0]) {
                    index = i;
                    offset = identification.identifier.range[1] - cursorOffset;
                    charOffset = cursorOffset - token.range[0];
                    break;
                }
            }

            var new_code = codeEditor.getValue();
            if (code === new_code) {
                return;
            }
            var options = {
                tolerant: true,
                range: true,
                loc: true,
                tokens: true,
                sourceType: deduceSourceType(new_code)
            };
            var new_tokens = esprima.parse(new_code, options).tokens;

            // Get the new name for that identifier.
            token = new_tokens[index];
            if (token && token.value !== identification.identifier.name) {
                // Check that other tokens haven't changed.
                var old_p = code.substr(0, identification.identifier.range[0]);
                var old_q = code.substr(identification.identifier.range[1]);
                var new_p = new_code.substr(0, token.range[0]);
                var new_q = new_code.substr(token.range[1]);
                if (old_p === new_p || old_q === new_q) {
                    // Rename the identifier, adjust the source and the cursor.
                    context.setCode(code);
                    var renamed = context.rename(identification, token.value);
                    if (renamed) {
                        new_tokens = esprima.parse(renamed, options).tokens;
                        var new_cursorOffset = new_tokens[index].range[0] + charOffset;
                        codeEditor.setValue(renamed);
                        codeEditor.setCursorOffset(new_cursorOffset);
                    }
                }
            }
        }

        function trackCursor() {
            var decorations = [];

            cursorOffset = codeEditor.getCursorOffset();
            identification = context ? context.identify(cursorOffset) : null;
            if (identification) {
                var identifier = identification.identifier;
                var declaration = identification.declaration;
                var references = identification.references;
                if (declaration && declaration.loc) {
                    if (declaration.range !== identifier.range)
                        decorations.push(codeEditor.createDecoration('declaration-decoration', declaration.loc));
                    statusInfo.showInfo(
                        "Identifier '" + identifier.name + "' is declared in line " + declaration.loc.start.line + '.'
                    );
                } else {
                    statusInfo.showWarning("Warning: No declaration is found for '" + identifier.name + "'.");
                }
                for (var i = 0; i < references.length; ++i) {
                    if (references[i] && references[i].loc)
                        decorations.push(codeEditor.createDecoration('reference-decoration', references[i].loc));
                }
            } else {
                statusInfo.showInfo('Ready.');
            }

            codeEditor.applyDecorations(decorations);
        }
    }

    // autocomplete.html
    function autoCompleter() {
        var statusInfo = new StatusInfo({ container: 'info' });

        var codeEditor = new CodeEditor(
            { container: 'editor', value: 'init', language: 'AksaraJawa' },
            {
                ready: initialize,
                cursorMoved: trackCursor
            }
        );

        // important state
        var aulx = new Aulx.JS();
        var previousLine = -1;

        function initialize() {
            registerAutocompletion();
            trackCursor();
        }

        function registerAutocompletion() {
            monaco.languages.registerCompletionItemProvider('AksaraJawa', {
                triggerCharacters: ['.'],
                provideCompletionItems: function (model, position) {
                    var code = model.getValue();
                    var caret = {
                        line: position.lineNumber - 1,
                        ch: position.column - 1
                    };
                    var completion = aulx.complete(code, caret);
                    var suggestions = [];
                    if (completion && completion.candidates && completion.candidates.length) {
                        for (var i = 0; i < completion.candidates.length; ++i) {
                            var display = completion.candidates[i].display;
                            suggestions.push({
                                label: display,
                                insertText: display
                            });
                        }
                        statusInfo.showInfo('Suggestions: ' + completion.candidates.length);
                    } else {
                        statusInfo.showWarning('No suggestion');
                    }
                    return { suggestions: suggestions };
                }
            });
        }

        function trackCursor() {
            statusInfo.showWarning('Ready.');
            var code = codeEditor.getValue();
            var offset = codeEditor.getCursorOffset();
            var position = codeEditor.getPositionAt(offset);
            if (position.lineNumber != previousLine) {
                previousLine = position.lineNumber;
                var caret = {
                    line: position.lineNumber - 1,
                    ch: position.column - 1
                };
                aulx.fireStaticAnalysis(code, caret);
            }
        }
    }

    // precedence.html
    function precedenceComparator() {
        var compareId;
        function compare() {
            if (compareId) {
                window.clearTimeout(compareId);
            }

            function stringify(node) {
                var result;

                if (typeof node !== 'object') {
                    throw new Error('Node is not valid');
                }
                if (typeof node.type !== 'string') {
                    throw new Error('Node does not have type property');
                }

                switch (node.type) {
                    case 'Program':
                        if (node.body.length !== 1) {
                            throw new Error('Expression is too complex');
                        }
                        result = stringify(node.body[0]);
                        if (result[0] === '(' && result[result.length - 1] === ')') {
                            result = result.substr(1, result.length - 2);
                        }
                        break;

                    case 'ExpressionStatement':
                        result = stringify(node.expression);
                        break;

                    case 'BinaryExpression':
                    case 'LogicalExpression':
                        result = '(' + stringify(node.left) + ' ' + node.operator + ' ' + stringify(node.right) + ')';
                        break;

                    case 'UnaryExpression':
                        result = '(' + node.operator;
                        if (node.operator.length > 2) {
                            // delete void typeof
                            result += ' ';
                        }
                        result += stringify(node.argument) + ')';
                        break;

                    case 'UpdateExpression':
                        result = stringify(node.argument);
                        if (node.prefix) {
                            result = node.operator + result;
                        } else {
                            result = result + node.operator;
                        }
                        result = '(' + result + ')';
                        break;

                    case 'Literal':
                        result = node.value.toString();
                        if (typeof node.value === 'string') {
                            result = '"' + node.value + '"';
                        }
                        break;

                    case 'Identifier':
                        result = node.name;
                        break;

                    default:
                        break;
                }

                if (!result) {
                    throw new Error('Unknown node type: ' + node.type);
                }

                return result;
            }

            function setText(el, str) {
                if (typeof el.innerText === 'string') {
                    el.innerText = str;
                } else {
                    el.textContent = str;
                }
            }

            compareId = window.setTimeout(function () {
                var a, b, answer, status, expr, left, right, suggest;

                a = $$('a');
                b = $$('b');
                answer = $$('answer');
                status = $$('status');
                expr = $$('expr');

                a.setAttribute('class', '');
                b.setAttribute('class', '');
                answer.setAttribute('class', '');

                setText(answer, '');
                setText(status, '');
                setText(expr, '');

                try {
                    left = esprima.parse(typeof a.innerText === 'string' ? a.innerText : a.textContent);
                } catch (e_left) {
                    a.setAttribute('class', 'lightred');
                }

                try {
                    right = esprima.parse(typeof b.innerText === 'string' ? b.innerText : b.textContent);
                } catch (e_right) {
                    b.setAttribute('class', 'lightred');
                }

                try {
                    suggest = stringify(left);
                } catch (e_suggest) {
                    a.setAttribute('class', 'lightred');
                }

                if (left && right) {
                    if (JSON.stringify(left) === JSON.stringify(right)) {
                        setText(answer, 'Yes');
                        answer.setAttribute('class', 'yes');
                    } else {
                        setText(answer, 'No');
                        answer.setAttribute('class', 'no');
                        setText(status, suggest ? 'It is more like ' : '');
                        setText(expr, suggest || '');
                    }
                } else {
                    answer.setAttribute('class', '');
                }

                compareId = undefined;
            }, 57);
        }

        if (typeof document.body.attachEvent === 'object') {
            // Workaround for old Internet Explorer.
            // Until there is a reliable way to track the modification to the editable
            // inputs, manually track the change periodically.
            window.setInterval(compare, 500);
        }

        // See http://mathiasbynens.be/notes/oninput for details.
        $$('a').onkeyup = compare;
        $$('a').oninput = function () {
            this.onkeyup = null;
            compare();
        };
        $$('b').onkeyup = compare;
        $$('b').oninput = function () {
            this.onkeyup = null;
            compare();
        };
        compare();
    }

    return {
        visualizer: visualizer,
        validator: validator,
        regexCollector: regexCollector,
        functionTracer: functionTracer,
        rewriter: rewriter,
        minifier: minifier,
        highlighter: highlighter,
        renamer: renamer,
        autoCompleter: autoCompleter,
        precedenceComparator: precedenceComparator
    };
})(window);
