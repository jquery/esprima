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

var assert = require('assert'),
    esprima = require('../');

describe('esprima.Syntax', function () {

    it('should enumerate all syntax node types', function () {
        assert.deepEqual(esprima.Syntax, {
            ArrayExpression: 'ArrayExpression',
            ArrayPattern: 'ArrayPattern',
            ArrowFunctionExpression: 'ArrowFunctionExpression',
            AssignmentExpression: 'AssignmentExpression',
            AssignmentPattern: 'AssignmentPattern',
            BinaryExpression: 'BinaryExpression',
            BlockStatement: 'BlockStatement',
            BreakStatement: 'BreakStatement',
            CallExpression: 'CallExpression',
            CatchClause: 'CatchClause',
            ClassBody: 'ClassBody',
            ClassDeclaration: 'ClassDeclaration',
            ClassExpression: 'ClassExpression',
            ConditionalExpression: 'ConditionalExpression',
            ContinueStatement: 'ContinueStatement',
            DebuggerStatement: 'DebuggerStatement',
            DoWhileStatement: 'DoWhileStatement',
            EmptyStatement: 'EmptyStatement',
            ExportAllDeclaration: 'ExportAllDeclaration',
            ExportDefaultDeclaration: 'ExportDefaultDeclaration',
            ExportNamedDeclaration: 'ExportNamedDeclaration',
            ExportSpecifier: 'ExportSpecifier',
            ExpressionStatement: 'ExpressionStatement',
            ForInStatement: 'ForInStatement',
            ForOfStatement: 'ForOfStatement',
            ForStatement: 'ForStatement',
            FunctionDeclaration: 'FunctionDeclaration',
            FunctionExpression: 'FunctionExpression',
            Identifier: 'Identifier',
            IfStatement: 'IfStatement',
            ImportDeclaration: 'ImportDeclaration',
            ImportDefaultSpecifier: 'ImportDefaultSpecifier',
            ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
            ImportSpecifier: 'ImportSpecifier',
            LabeledStatement: 'LabeledStatement',
            Literal: 'Literal',
            LogicalExpression: 'LogicalExpression',
            MemberExpression: 'MemberExpression',
            MetaProperty: 'MetaProperty',
            MethodDefinition: 'MethodDefinition',
            NewExpression: 'NewExpression',
            ObjectExpression: 'ObjectExpression',
            ObjectPattern: 'ObjectPattern',
            Program: 'Program',
            Property: 'Property',
            RestElement: 'RestElement',
            ReturnStatement: 'ReturnStatement',
            SequenceExpression: 'SequenceExpression',
            SpreadElement: 'SpreadElement',
            Super: 'Super',
            SwitchCase: 'SwitchCase',
            SwitchStatement: 'SwitchStatement',
            TaggedTemplateExpression: 'TaggedTemplateExpression',
            TemplateElement: 'TemplateElement',
            TemplateLiteral: 'TemplateLiteral',
            ThisExpression: 'ThisExpression',
            ThrowStatement: 'ThrowStatement',
            TryStatement: 'TryStatement',
            UnaryExpression: 'UnaryExpression',
            UpdateExpression: 'UpdateExpression',
            VariableDeclaration: 'VariableDeclaration',
            VariableDeclarator: 'VariableDeclarator',
            WhileStatement: 'WhileStatement',
            WithStatement: 'WithStatement',
            YieldExpression: 'YieldExpression'
        });
    });

});

describe('esprima.parse', function () {

    it('should not accept zero parameter', function () {
        assert.throws(function () {
            esprima.parse();
        });
    });

    it('should accept one string parameter', function () {
        assert.doesNotThrow(function () {
            esprima.parse('function f(){}');
        });
    });

    it('should accept a String object', function () {
        assert.doesNotThrow(function () {
            esprima.parse(new String('some.property = value'));
        });
    });

    it('should accept two parameters (source and parsing options)', function () {
        var options = { range: false };
        assert.doesNotThrow(function () {
            esprima.parse('var x', options);
        });
    });

    it('should accept three parameters (source, options, and delegate)', function () {
        var options = { range: false };
        assert.doesNotThrow(function () {
            esprima.parse('var x', options, function f(entry) {
                return entry;
            });
        });
    });

    it('should exclude location information by default', function () {
        var ast = esprima.parse('answer = 42');
        assert.ifError(ast.range);
        assert.ifError(ast.loc);
    });

    it('should exclude comments by default', function () {
        var ast = esprima.parse('42 // answer');
        assert.ifError(ast.comments);
    });

    it('should exclude list of tokens by default', function () {
        var ast = esprima.parse('3.14159');
        assert.ifError(ast.tokens);
    });

    it('should include index-based location for the nodes when specified', function () {
        var ast = esprima.parse('answer = 42', { range: true });
        assert.deepEqual(ast.range, [0, 11]);
        assert.ifError(ast.loc);
    });

    it('should include line and column-based location for the nodes when specified', function () {
        var ast = esprima.parse('answer = 42', { loc: true });
        assert.deepEqual(ast.loc.start, { line: 1, column: 0 });
        assert.deepEqual(ast.loc.end, { line: 1, column: 11 });
        assert.ifError(ast.loc.source);
        assert.ifError(ast.range);
    });

    it('should include source information for the nodes when specified', function () {
        var ast = esprima.parse('answer = 42', { loc: true, source: 'example.js' });
        assert.deepEqual(ast.loc.source, 'example.js');
        assert.ifError(ast.range);
    });

    it('should include the list of comments when specified', function () {
        var ast = esprima.parse('42 // answer', { comment: true });
        assert.deepEqual(ast.comments.length, 1);
        assert.deepEqual(ast.comments[0], { type: 'Line', value: ' answer' });
    });

    it('should include the list of comments with index-based location when specified', function () {
        var ast = esprima.parse('42 // answer', { comment: true, range: true });
        assert.deepEqual(ast.comments.length, 1);
        assert.deepEqual(ast.comments[0], { type: 'Line', value: ' answer', range: [3, 12] });
    });

    it('should include the list of comments with line and column-based location when specified', function () {
        var ast = esprima.parse('42 // answer', { comment: true, loc: true });
        assert.deepEqual(ast.comments.length, 1);
        assert.deepEqual(ast.comments[0].type, 'Line');
        assert.deepEqual(ast.comments[0].value, ' answer');
        assert.deepEqual(ast.comments[0].loc.start, { line: 1, column: 3 });
        assert.deepEqual(ast.comments[0].loc.end, { line: 1, column: 12 });
        assert.ifError(ast.comments[0].range);
    });

    it('should be able to attach comments', function () {
        var ast, statement, expression, comments;

        ast = esprima.parse('/* universe */ 42', { attachComment: true});
        statement = ast.body[0];
        expression = statement.expression;
        comments = statement.leadingComments;

        assert.deepEqual(expression, { type: 'Literal', value: 42, raw: '42' });
        assert.deepEqual(statement.leadingComments, [{ type: 'Block', value: ' universe ', range: [0, 14] }]);
    });

    it('should include the list of tokens when specified', function () {
        var ast = esprima.parse('x = 1', { tokens: true });
        assert.deepEqual(ast.tokens.length, 3);
        assert.deepEqual(ast.tokens[0], { type: 'Identifier', value: 'x' });
        assert.deepEqual(ast.tokens[1], { type: 'Punctuator', value: '=' });
        assert.deepEqual(ast.tokens[2], { type: 'Numeric', value: '1' });
    });

    it('should include the list of tokens with index-based location when specified', function () {
        var ast = esprima.parse('y = 2', { tokens: true, range: true });
        assert.deepEqual(ast.tokens[0], { type: 'Identifier', value: 'y', range: [0, 1] });
        assert.deepEqual(ast.tokens[1], { type: 'Punctuator', value: '=', range: [2, 3] });
        assert.deepEqual(ast.tokens[2], { type: 'Numeric', value: '2', range: [4, 5] });
    });

    it('should include the list of tokens with line and column-based location when specified', function () {
        var ast = esprima.parse('z = 3', { tokens: true, loc: true });
        assert.deepEqual(ast.tokens.length, 3);
        assert.deepEqual(ast.tokens[0].type, 'Identifier');
        assert.deepEqual(ast.tokens[0].value, 'z');
        assert.deepEqual(ast.tokens[0].loc.start, { line: 1, column: 0 });
        assert.deepEqual(ast.tokens[0].loc.end, { line: 1, column: 1 });
        assert.ifError(ast.tokens[0].range);
    });

    it('should not understand JSX syntax by default', function () {
        assert.throws(function () {
            esprima.parse('<head/>');
        });
    });

    it('should not understand JSX syntax if it is explicitly not to be supported', function () {
        assert.throws(function () {
            esprima.parse('<b/>', { jsx: false });
        });
    });

    it('should understand JSX syntax if specified', function () {
        var ast, statement, expression;
        ast = esprima.parse('<title/>', { jsx: true });
        statement = ast.body[0];
        expression = statement.expression;

        assert.deepEqual(expression.type, 'JSXElement');
        assert.deepEqual(expression.openingElement.type, 'JSXOpeningElement');
        assert.deepEqual(expression.openingElement.name, { type: 'JSXIdentifier', name: 'title'});
        assert.deepEqual(expression.closingElement, null);
    });
});

describe('esprima.parse delegate', function () {

    it('should receive all the nodes', function () {
        var list = [];
        function collect(node) {
            list.push(node.type);
        }
        esprima.parse('/* universe */ answer = 42', {}, collect);

        assert.deepEqual(list.length, 5);
        assert.deepEqual(list, ['Identifier', 'Literal', 'AssignmentExpression', 'ExpressionStatement', 'Program']);
    });

    it('should receive the comments if specified', function () {
        var list = [];
        function collect(node) {
            list.push(node);
        }
        esprima.parse('/* prolog */ answer = 42 // epilog', { comment: true }, collect);

        assert.deepEqual(list.length, 7);
        assert.deepEqual(list[0], { type: 'BlockComment', value: ' prolog ' });
        assert.deepEqual(list[1], { type: 'Identifier', name: 'answer' });
        assert.deepEqual(list[2], { type: 'LineComment', value: ' epilog' });
        assert.deepEqual(list[3], { type: 'Literal', value: 42, raw: '42' });
        assert.deepEqual(list[4].type, 'AssignmentExpression');
        assert.deepEqual(list[5].type, 'ExpressionStatement');
        assert.deepEqual(list[6].type, 'Program');
    });

    it('should be able to walk the tree and pick a node', function () {
        var constant = null;
        function walk(node) {
            if (node.type === 'Literal') {
                constant = node;
            }
        }
        esprima.parse('answer = 42 // universe', {}, walk);
        assert.deepEqual(constant, { type: 'Literal', value: 42, raw: '42' });
    });

    it('should be able to mutate each node', function () {
        var ast = esprima.parse('42', { range: true }, function (node) {
            node.start = node.range[0];
            node.end = node.range[1];
        });
        assert.deepEqual(ast.start, 0);
        assert.deepEqual(ast.end, 2);
    });

    it('should be affected by cover grammars', function () {
        var list = [];
        esprima.parse('(x, y) => z', {}, function (n) {
            list.push(n.type)
        });

        // (x, y) will be a SequenceExpression first before being reinterpreted as
        // the formal parameter list for an ArrowFunctionExpression

        assert.deepEqual(list.length, 7);
        assert.deepEqual(list[0], 'Identifier');               // x
        assert.deepEqual(list[1], 'Identifier');               // y
        assert.deepEqual(list[2], 'SequenceExpression');       // x, y
        assert.deepEqual(list[3], 'Identifier');               // z
        assert.deepEqual(list[4], 'ArrowFunctionExpression');  // (x, y) => z
        assert.deepEqual(list[5], 'ExpressionStatement');
    });

    it('should receive metadata of each node', function () {
        var starts = [], ends = [];
        esprima.parse('x = y + z', { range: false }, function (node, metadata) {
            starts.push(metadata.start);
            ends.push(metadata.end);
        });

        assert.deepEqual(starts.length, 7);
        assert.deepEqual(starts[0], { line: 1, column: 0, offset: 0 }); // x
        assert.deepEqual(starts[1], { line: 1, column: 4, offset: 4 }); // y
        assert.deepEqual(starts[2], { line: 1, column: 8, offset: 8 }); // z
        assert.deepEqual(starts[3], { line: 1, column: 4, offset: 4 }); // y + z
        assert.deepEqual(starts[4], { line: 1, column: 0, offset: 0 }); // x = y + z
        assert.deepEqual(starts[5], { line: 1, column: 0, offset: 0 }); // x = y + z
        assert.deepEqual(starts[6], { line: 1, column: 0, offset: 0 }); // x = y + z

        assert.deepEqual(ends.length, 7);
        assert.deepEqual(ends[0], { line: 1, column: 1, offset: 1 }); // x
        assert.deepEqual(ends[1], { line: 1, column: 5, offset: 5 }); // y
        assert.deepEqual(ends[2], { line: 1, column: 9, offset: 9 }); // z
        assert.deepEqual(ends[3], { line: 1, column: 9, offset: 9 }); // y + z
        assert.deepEqual(ends[4], { line: 1, column: 9, offset: 9 }); // x = y + z
        assert.deepEqual(ends[5], { line: 1, column: 9, offset: 9 }); // x = y + z
        assert.deepEqual(ends[6], { line: 1, column: 9, offset: 9 }); // x = y + z
    });

    it('should receive metadata of comments', function () {
        var starts = [], ends = [];
        esprima.parse('42 // answer', { comment: true }, function (node, metadata) {
            starts.push(metadata.start);
            ends.push(metadata.end);
        });

        assert.deepEqual(starts.length, 4);
        assert.deepEqual(starts[0], { line: 1, column: 3, offset: 3 });
        assert.deepEqual(starts[1], { line: 1, column: 0, offset: 0 });
        assert.deepEqual(starts[2], { line: 1, column: 0, offset: 0 });
        assert.deepEqual(starts[3], { line: 1, column: 0, offset: 0 });

        assert.deepEqual(ends.length, 4);
        assert.deepEqual(ends[0], { line: 1, column: 12, offset: 12 });
        assert.deepEqual(ends[1], { line: 1, column: 2, offset: 2 });
        assert.deepEqual(ends[2], { line: 1, column: 12, offset: 12 });
        assert.deepEqual(ends[3], { line: 1, column: 12, offset: 12 });
    });

    it('can be used for custom comment attachment', function () {
        var code, attacher, tree;

        function LineAttacher() {
            this.variableDeclarations = [];
            this.lineComments = [];
        }

        // Attach a line comment to a variable declaration in the same line.
        // Example: `var foo = 42; // bar` will have "bar" in the new property
        // called `annotation` of the variable declaration statement.

        LineAttacher.prototype.attach = function () {
            var i, j, declaration, comment;

            for (i = 0; i < this.variableDeclarations.length; ++i) {
                declaration = this.variableDeclarations[i];
                for (j = 0; j < this.lineComments.length; ++j) {
                    comment = this.lineComments[j];
                    if (declaration.line === comment.line) {
                        declaration.node.annotation = comment.comment;
                        break;
                    }
                }
            }
        }

        LineAttacher.prototype.visit = function (node, metadata) {
            if (node.type === 'VariableDeclaration') {
                this.variableDeclarations.push({
                    node: node,
                    line: metadata.start.line
                });
            } else if (node.type === 'LineComment') {
                this.lineComments.push({
                    comment: node,
                    line: metadata.start.line
                });
            }
            this.attach();
        }

        code = [
            'var x = 42 // answer',
            'var y = 3',
            '// foobar'
        ].join('\n');

        attacher = new LineAttacher();
        tree = esprima.parse(code, { comment: true }, function (node, metadata) {
            attacher.visit(node, metadata);
        });

        // There will be two variable declaration statement.
        // Only the first one will have `annotation` since there is
        // a line comment in the same line.
        assert.deepEqual(tree.body.length, 2);
        assert.deepEqual(tree.body[0].annotation, { type: 'LineComment', value: ' answer' });
        assert.deepEqual(tree.body[1].annotation, undefined);
    });

});

describe('esprima.tokenize', function () {

    it('should not accept zero parameter', function () {
        assert.throws(function () {
            esprima.tokenize();
        });
    });

    it('should accept one string parameter', function () {
        assert.doesNotThrow(function () {
            esprima.tokenize('function f(){}');
        });
    });

    it('should accept a String object', function () {
        assert.doesNotThrow(function () {
            esprima.tokenize(new String('some.property = value'));
        });
    });

    it('should accept two parameters (source and options)', function () {
        var options = { range: false };
        assert.doesNotThrow(function () {
            esprima.tokenize('var x', options);
        });
    });

    it('should accept three parameters (source, options, and delegate)', function () {
        var options = { range: false };
        assert.doesNotThrow(function () {
            esprima.tokenize('var x', options, function f(entry) {
                return entry;
            });
        });
    });

    it('should exclude location information by default', function () {
        var tokens = esprima.tokenize('answer = 42');
        assert.deepEqual(tokens.length, 3);
        assert.ifError(tokens[0].loc);
        assert.ifError(tokens[0].range);
    });

    it('should exclude list of errors in non-tolerant mode', function () {
        var tokens = esprima.tokenize('x', { tolerant: false });
        assert.deepEqual(tokens, [{ type: 'Identifier', value: 'x' }]);
    });

    it('should include index-based location for the tokens when specified', function () {
        var tokens = esprima.tokenize('answer = 42', { range: true });
        assert.deepEqual(tokens.length, 3);
        assert.deepEqual(tokens[0], { type: 'Identifier', value: 'answer', range: [0, 6] });
        assert.deepEqual(tokens[1], { type: 'Punctuator', value: '=', range: [7, 8] });
        assert.deepEqual(tokens[2], { type: 'Numeric', value: '42', range: [9, 11] });
        assert.ifError(tokens[0].loc);
    });

    it('should include line and column-based location for the tokens when specified', function () {
        var tokens = esprima.tokenize('answer = 42', { loc: true });
        assert.deepEqual(tokens.length, 3);
        assert.deepEqual(tokens[0].type, 'Identifier');
        assert.deepEqual(tokens[0].value, 'answer');
        assert.deepEqual(tokens[0].loc.start, { line: 1, column: 0 });
        assert.deepEqual(tokens[0].loc.end, { line: 1, column: 6 });
        assert.ifError(tokens[0].range);
    });

    it('should also include the comments when specified', function () {
        var tokens = esprima.tokenize('/*TODO*/ xyz', { comment: true });
        assert.deepEqual(tokens.length, 2);
        assert.deepEqual(tokens[0], { type: 'BlockComment', value: 'TODO' });
        assert.ifError(tokens[0].loc);
        assert.ifError(tokens[0].range);
    });

});

describe('esprima.tokenize delegate', function () {

    it('should receive all the tokens', function () {
        var list = [];
        esprima.tokenize('p = 1, r', {}, function (entry) {
            list.push(entry);
        });
        assert.deepEqual(list.length, 5);
        assert.deepEqual(list[0], { type: 'Identifier', value: 'p' });
        assert.deepEqual(list[1], { type: 'Punctuator', value: '=' });
        assert.deepEqual(list[2], { type: 'Numeric', value: '1' });
        assert.deepEqual(list[3], { type: 'Punctuator', value: ',' });
        assert.deepEqual(list[4], { type: 'Identifier', value: 'r' });
    });

    it('should receive all the tokens with the location information', function () {
        var list = [];
        esprima.tokenize('s = 3', { range: true }, function (entry) {
            list.push(entry);
        });
        assert.deepEqual(list.length, 3);
        assert.deepEqual(list[0], { type: 'Identifier', value: 's', range: [0, 1] });
        assert.deepEqual(list[1], { type: 'Punctuator', value: '=', range: [2, 3] });
        assert.deepEqual(list[2], { type: 'Numeric', value: '3', range: [4, 5] });
    });

    it('should be able to simplify the token structure', function () {
        var tokens = esprima.tokenize('var regex = /abc/pqs', { range: true }, function (entry) {
            return entry.type;
        });
        assert.deepEqual(tokens.length, 4);
        assert.deepEqual(tokens[0], 'Keyword');
        assert.deepEqual(tokens[1], 'Identifier');
        assert.deepEqual(tokens[2], 'Punctuator');
        assert.deepEqual(tokens[3], 'RegularExpression');
    });

    it('should be able to modify the token structure', function () {
        var tokens = esprima.tokenize('var regex = /abc/pqs', { range: true }, function (entry) {
            var t = {};
            t[entry.type] = entry.value;
            t.start = entry.range[0];
            t.end = entry.range[1];
            return t;
        });
        assert.deepEqual(tokens.length, 4);
        assert.deepEqual(tokens[0], { Keyword: 'var', start: 0, end: 3 });
        assert.deepEqual(tokens[1], { Identifier: 'regex', start: 4, end: 9 });
        assert.deepEqual(tokens[2], { Punctuator: '=', start: 10, end: 11 });
        assert.deepEqual(tokens[3], { RegularExpression: '/abc/pqs', start: 12, end: 20 });
    });

});
