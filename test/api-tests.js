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

    it('should ignore a third parameter', function () {
        var random = { p: 1, q: 2 };
        assert.doesNotThrow(function () {
            esprima.parse('var x', {}, random);
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
