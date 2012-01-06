/*
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
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

/*jslint bitwise:true */
/*global esprima:true, exports:true,
throwError: true,
parseAssignmentExpression: true, parseBlock: true, parseExpression: true,
parseFunctionDeclaration: true, parseFunctionExpression: true,
parseStatement: true, parseSourceElement: true */

(function (exports) {
    'use strict';

    var Token,
        Syntax,
        Messages,
        Regex,
        source,
        index,
        lineNumber,
        length,
        buffer,
        extra;

    Token = {
        BooleanLiteral: 1,
        EOF: 2,
        Identifier: 3,
        Keyword: 4,
        NullLiteral: 5,
        NumericLiteral: 6,
        Punctuator: 7,
        StringLiteral: 8
    };

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        ArrayExpression: 'ArrayExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        Program: 'Program',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement'
    };

    Messages = {
        UnexpectedToken:  'Unexpected token %0',
        UnexpectedNumber:  'Unexpected number',
        UnexpectedString:  'Unexpected string',
        UnexpectedIdentifier:  'Unexpected identifier',
        UnexpectedReserved:  'Unexpected reserved word',
        UnexpectedEOS:  'Unexpected end of input',
        NewlineAfterThrow:  'Illegal newline after throw',
        InvalidRegExp: 'Invalid regular expression',
        UnterminatedRegExp:  'Invalid regular expression: missing /',
        InvalidLHSInAssignment:  'Invalid left-hand side in assignment',
        InvalidLHSInForIn:  'Invalid left-hand side in for-in',
        InvalidLHSInPostfixOp:  'Invalid left-hand side expression in postfix operation',
        InvalidLHSInPrefixOp:  'Invalid left-hand side expression in prefix operation',
        NoCatchOrFinally:  'Missing catch or finally after try'
    };

    // See also tools/generate-unicode-regex.py.
    Regex = {
        NonAsciiIdentifierStart: /[\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376-\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E-\u066F\u0671-\u06D3\u06D5\u06E5-\u06E6\u06EE-\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4-\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0-\u0AE1\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B35-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58-\u0C59\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0-\u0CE1\u0CF1-\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32-\u0E33\u0E40-\u0E46\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDD\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065-\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10D0-\u10FA\u10FC\u1100-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE-\u1BAF\u1BC0-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183-\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2D00-\u2D25\u2D30-\u2D65\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3006\u3031-\u3035\u303B-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCB\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A-\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA791\uA7A0-\uA7A9\uA7FA-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5-\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA2D\uFA30-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40-\uFB41\uFB43-\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
        NonAsciiIdentifierPart: /[\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376-\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u0900-\u0963\u0966-\u096F\u0971-\u0977\u0979-\u097F\u0981-\u0983\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7-\u09C8\u09CB-\u09CE\u09D7\u09DC-\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A3C\u0A3E-\u0A42\u0A47-\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47-\u0B48\u0B4B-\u0B4D\u0B56-\u0B57\u0B5C-\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82-\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C01-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55-\u0C56\u0C58-\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C82-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5-\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1-\u0CF2\u0D02-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82-\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2-\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDD\u0F00\u0F18-\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10D0-\u10FA\u10FC\u1100-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772-\u1773\u1780-\u17B3\u17B6-\u17D3\u17D7\u17DC-\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191C\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BAA\u1BAE-\u1BB9\u1BC0-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF2\u1D00-\u1DE6\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F-\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183-\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF1\u2D00-\u2D25\u2D30-\u2D65\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3006\u302A-\u302F\u3031-\u3035\u303B-\u303C\u3041-\u3096\u3099-\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCB\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA67C-\uA67D\uA67F-\uA697\uA6A0-\uA6E5\uA6F0-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA791\uA7A0-\uA7A9\uA7FA-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAA7B\uAA80-\uAAC2\uAADB-\uAADD\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABEA\uABEC-\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA2D\uFA30-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40-\uFB41\uFB43-\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE26\uFE33-\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/
    };

    if (typeof Object.freeze === 'function') {
        Object.freeze(Token);
        Object.freeze(Syntax);
        Object.freeze(Messages);
        Object.freeze(Regex);
    }

    function isDecimalDigit(ch) {
        return '0123456789'.indexOf(ch) >= 0;
    }

    function isHexDigit(ch) {
        return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
    }


    // 7.2 White Space

    function isWhiteSpace(ch) {
        // TODO Unicode "space separator"
        return (ch === ' ') || (ch === '\u0009') || (ch === '\u000B') ||
            (ch === '\u000C') || (ch === '\u00A0') || (ch === '\uFEFF');
    }

    // 7.3 Line Terminators

    function isLineTerminator(ch) {
        return (ch === '\n' || ch === '\r' || ch === '\u2028' || ch === '\u2029');
    }

    // 7.6 Identifier Names and Identifiers

    function isIdentifierStart(ch) {
        return (ch === '$') || (ch === '_') || (ch === '\\') ||
            (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') ||
            ((ch.charCodeAt(0) >= 0x80) && Regex.NonAsciiIdentifierStart.test(ch));
    }

    function isIdentifierPart(ch) {
        return (ch === '$') || (ch === '_') || (ch === '\\') ||
            (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') ||
            ((ch >= '0') && (ch <= '9')) ||
            ((ch.charCodeAt(0) >= 0x80) && Regex.NonAsciiIdentifierPart.test(ch));
    }

    // 7.6.1.2 Future Reserved Words

    function isFutureReservedWord(id) {
        switch (id) {

        // Future reserved words.
        case 'class':
        case 'enum':
        case 'export':
        case 'extends':
        case 'import':
        case 'super':
            return true;
        }

        return false;
    }

    // 7.6.1.1 Keywords

    function isKeyword(id) {
        switch (id) {

        // Keywords.
        case 'break':
        case 'case':
        case 'catch':
        case 'continue':
        case 'debugger':
        case 'default':
        case 'delete':
        case 'do':
        case 'else':
        case 'finally':
        case 'for':
        case 'function':
        case 'if':
        case 'in':
        case 'instanceof':
        case 'new':
        case 'return':
        case 'switch':
        case 'this':
        case 'throw':
        case 'try':
        case 'typeof':
        case 'var':
        case 'void':
        case 'while':
        case 'with':
            return true;

        // Future reserved words.
        // 'const' is specialized as Keyword in V8.
        case 'const':
            return true;

        // strict mode
        case 'implements':
        case 'interface':
        case 'let':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'yield':
            return true;
        }

        return isFutureReservedWord(id);
    }

    // Return the next character and move forward.

    function nextChar() {
        var ch = '\x00',
            idx = index;
        if (idx < length) {
            ch = source[idx];
            index += 1;
        }
        return ch;
    }

    // 7.4 Comments

    function skipComment() {
        var ch, blockComment, lineComment;

        blockComment = false;
        lineComment = false;

        while (index < length) {
            ch = source[index];

            if (lineComment) {
                nextChar();
                if (isLineTerminator(ch)) {
                    lineComment = false;
                    lineNumber += 1;
                }
            } else if (blockComment) {
                nextChar();
                if (ch === '*') {
                    ch = source[index];
                    if (ch === '/') {
                        nextChar();
                        blockComment = false;
                    }
                } else if (isLineTerminator(ch)) {
                    lineNumber += 1;
                }
            } else if (ch === '/') {
                ch = source[index + 1];
                if (ch === '/') {
                    nextChar();
                    nextChar();
                    lineComment = true;
                } else if (ch === '*') {
                    nextChar();
                    nextChar();
                    blockComment = true;
                } else {
                    break;
                }
            } else if (isWhiteSpace(ch)) {
                nextChar();
            } else if (isLineTerminator(ch)) {
                nextChar();
                lineNumber += 1;
            } else {
                break;
            }
        }
    }

    function scanIdentifier() {
        var ch, id;

        ch = source[index];
        if (!isIdentifierStart(ch)) {
            return;
        }

        id = nextChar();
        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch)) {
                break;
            }
            id += nextChar();
        }

        // There is no keyword or literal with only one character.
        // Thus, it must be an identifier.
        if (id.length === 1) {
            return {
                type: Token.Identifier,
                value: id
            };
        }

        if (isKeyword(id)) {
            return {
                type: Token.Keyword,
                value: id
            };
        }

        // 7.8.1 Null Literals

        if (id === 'null') {
            return {
                type: Token.NullLiteral,
                value: id
            };
        }

        // 7.8.2 Boolean Literals

        if (id === 'true' || id === 'false') {
            return {
                type: Token.BooleanLiteral,
                value: id
            };
        }

        return {
            type: Token.Identifier,
            value: id
        };
    }

    // 7.7 Punctuators

    function scanPunctuator() {
        var ch1 = source[index],
            ch2,
            ch3,
            ch4;

        // Check for most common single-character punctuators.

        if (ch1 === ';' || ch1 === '{' || ch1 === '}') {
            nextChar();
            return {
                type: Token.Punctuator,
                value: ch1
            };
        }

        if (ch1 === ',' || ch1 === '(' || ch1 === ')') {
            nextChar();
            return {
                type: Token.Punctuator,
                value: ch1
            };
        }

        // Dot (.) can also start a floating-point number, hence the need
        // to check the next character.

        ch2 = source[index + 1];
        if (ch1 === '.' && !isDecimalDigit(ch2)) {
            return {
                type: Token.Punctuator,
                value: nextChar()
            };
        }

        // Peek more characters.

        ch3 = source[index + 2];
        ch4 = source[index + 3];

        // 4-character punctuator: >>>=

        if (ch1 === '>' && ch2 === '>' && ch3 === '>') {
            if (ch4 === '=') {
                nextChar();
                nextChar();
                nextChar();
                nextChar();
                return {
                    type: Token.Punctuator,
                    value: '>>>='
                };
            }
        }

        // 3-character punctuators: === !== >>> <<= >>=

        if (ch1 === '=' && ch2 === '=' && ch3 === '=') {
            nextChar();
            nextChar();
            nextChar();
            return {
                type: Token.Punctuator,
                value: '==='
            };
        }

        if (ch1 === '!' && ch2 === '=' && ch3 === '=') {
            nextChar();
            nextChar();
            nextChar();
            return {
                type: Token.Punctuator,
                value: '!=='
            };
        }

        if (ch1 === '>' && ch2 === '>' && ch3 === '>') {
            nextChar();
            nextChar();
            nextChar();
            return {
                type: Token.Punctuator,
                value: '>>>'
            };
        }

        if (ch1 === '<' && ch2 === '<' && ch3 === '=') {
            nextChar();
            nextChar();
            nextChar();
            return {
                type: Token.Punctuator,
                value: '<<='
            };
        }

        if (ch1 === '>' && ch2 === '>' && ch3 === '=') {
            nextChar();
            nextChar();
            nextChar();
            return {
                type: Token.Punctuator,
                value: '>>='
            };
        }

        // 2-character punctuators: <= >= == != ++ -- << >> && ||
        // += -= *= %= &= |= ^= /=

        if (ch2 === '=') {
            if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
                nextChar();
                nextChar();
                return {
                    type: Token.Punctuator,
                    value: ch1 + ch2
                };
            }
        }

        if (ch1 === ch2 && ('+-<>&|'.indexOf(ch1) >= 0)) {
            if ('+-<>&|'.indexOf(ch2) >= 0) {
                nextChar();
                nextChar();
                return {
                    type: Token.Punctuator,
                    value: ch1 + ch2
                };
            }
        }

        // The remaining 1-character punctuators.

        if ('[]<>+-*%&|^!~?:=/'.indexOf(ch1) >= 0) {
            return {
                type: Token.Punctuator,
                value: nextChar()
            };
        }
    }

    // 7.8.3 Numeric Literals

    function scanNumericLiteral() {
        var number, ch;

        ch = source[index];
        if (!isDecimalDigit(ch) && (ch !== '.')) {
            return;
        }

        number = '';
        if (ch !== '.') {
            number = nextChar();
            ch = source[index];

            // Hex number starts with '0x'.
            if (ch === 'x' || ch === 'X') {
                number += nextChar();
                while (index < length) {
                    ch = source[index];
                    if (!isHexDigit(ch)) {
                        break;
                    }
                    number += nextChar();
                }
                return {
                    type: Token.NumericLiteral,
                    value: parseInt(number, 16)
                };
            }

            while (index < length) {
                ch = source[index];
                if (!isDecimalDigit(ch)) {
                    break;
                }
                number += nextChar();
            }
        }

        if (ch === '.') {
            number += nextChar();
            while (index < length) {
                ch = source[index];
                if (!isDecimalDigit(ch)) {
                    break;
                }
                number += nextChar();
            }
        }

        if (ch === 'e' || ch === 'E') {
            number += nextChar();
            ch = source[index];
            if (ch === '+' || ch === '-' || isDecimalDigit(ch)) {
                number += nextChar();
                while (index < length) {
                    ch = source[index];
                    if (!isDecimalDigit(ch)) {
                        break;
                    }
                    number += nextChar();
                }
            } else {
                ch = 'character ' + ch;
                if (index >= length) {
                    ch = '<end>';
                }
                throwError(Messages.UnexpectedToken, lineNumber, 'ILLEGAL');
            }
        }

        return {
            type: Token.NumericLiteral,
            value: parseFloat(number)
        };
    }

    // 7.8.4 String Literals

    // TODO Unicode
    function scanStringLiteral() {
        var str = '', quote, ch;

        quote = source[index];
        if (quote !== '\'' && quote !== '"') {
            return;
        }
        nextChar();

        while (index < length) {
            ch = nextChar();

            if (ch === quote) {
                quote = '';
                break;
            } else if (ch === '\\') {
                ch = nextChar();
                if (!isLineTerminator(ch)) {
                    str += '\\';
                    str += ch;
                }
            } else {
                str += ch;
            }
        }

        if (quote !== '') {
            throwError(Messages.UnexpectedToken, lineNumber, 'ILLEGAL');
        }

        return {
            type: Token.StringLiteral,
            value: str
        };
    }

    function scanRegExp() {
        var str = '', ch, pattern, flags, value, classMarker = false;

        buffer = null;
        skipComment();

        ch = source[index];
        if (ch !== '/') {
            return;
        }
        str = nextChar();

        while (index < length) {
            ch = nextChar();
            str += ch;
            if (classMarker) {
                if (ch === ']') {
                    classMarker = false;
                }
            } else {
                if (ch === '\\') {
                    str += nextChar();
                }
                if (ch === '/') {
                    break;
                }
                if (ch === '[') {
                    classMarker = true;
                }
                if (isLineTerminator(ch)) {
                    throwError(Messages.UnterminatedRegExp, lineNumber);
                }
            }
        }

        if (str.length === 1) {
            throwError(Messages.UnterminatedRegExp, lineNumber);
        }

        // Exclude leading and trailing slash.
        pattern = str.substr(1, str.length - 2);

        flags = '';
        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch)) {
                break;
            }
            flags += ch;
            str += nextChar();
        }

        try {
            value = new RegExp(pattern, flags);
        } catch (e) {
            throwError(Messages.InvalidRegExp, lineNumber);
        }

        return {
            literal: str,
            value: value
        };
    }

    function isIdentifierName(token) {
        return token.type === Token.Identifier ||
            token.type === Token.Keyword ||
            token.type === Token.BooleanLiteral ||
            token.type === Token.NullLiteral;
    }

    function advance() {
        var ch, token;

        if (index >= length) {
            return {
                type: Token.EOF
            };
        }

        token = scanPunctuator();
        if (typeof token !== 'undefined') {
            return token;
        }

        ch = source[index];

        if (ch === '\'' || ch === '"') {
            return scanStringLiteral();
        }

        if (ch === '.' || isDecimalDigit(ch)) {
            return scanNumericLiteral();
        }

        token = scanIdentifier();
        if (typeof token !== 'undefined') {
            return token;
        }

        throwError(Messages.UnexpectedToken, lineNumber, 'ILLEGAL');
    }

    function lex() {
        var pos, token;

        if (buffer) {
            index = buffer.range[1];
            lineNumber = buffer.lineNumber;
            token = buffer;
            buffer = null;
            return token;
        }

        buffer = null;
        skipComment();

        pos = index;
        token = advance();
        token.range = [pos, index];
        token.lineNumber = lineNumber;

        return token;
    }

    function lookahead() {
        var pos, line, token;

        if (buffer !== null) {
            return buffer;
        }

        pos = index;
        line = lineNumber;
        token = lex();
        index = pos;
        lineNumber = line;

        buffer = token;
        return buffer;
    }

    // Return true if there is a line terminator before the next token.

    function peekLineTerminator() {
        var pos, line, found;

        pos = index;
        line = lineNumber;
        skipComment();
        found = lineNumber !== line;
        index = pos;
        lineNumber = line;

        return found;
    }

    // Throw an exception

    function throwError(message, line) {
        var args = Array.prototype.slice.call(arguments, 2);
        throw new Error('Line ' + line + ': ' + message.replace(/%(\d)/g,
                    function (whole, index) { return args[index] || ''; }));
    }

    // Throw an exception because of the token.

    function throwUnexpected(token) {
        var s;

        if (token.type === Token.EOF) {
            throwError(Messages.UnexpectedEOS, lineNumber);
        }

        if (token.type === Token.NumericLiteral) {
            throwError(Messages.UnexpectedNumber, lineNumber);
        }

        if (token.type === Token.StringLiteral) {
            throwError(Messages.UnexpectedString, lineNumber);
        }

        if (token.type === Token.Identifier) {
            throwError(Messages.UnexpectedIdentifier, lineNumber);
        }

        if (token.type === Token.Keyword && isFutureReservedWord(token.value)) {
            throwError(Messages.UnexpectedReserved, lineNumber);
        }

        s = token.value;
        if (s.length > 10) {
            s = s.substr(0, 10) + '...';
        }
        throwError(Messages.UnexpectedToken, lineNumber, s);
    }

    // Expect the next token to match the specified punctuator.
    // If not, an exception will be thrown.

    function expect(value) {
        var token = lex();
        if (token.type !== Token.Punctuator || token.value !== value) {
            throwUnexpected(token);
        }
    }

    // Expect the next token to match the specified keyword.
    // If not, an exception will be thrown.

    function expectKeyword(keyword) {
        var token = lex();
        if (token.type !== Token.Keyword || token.value !== keyword) {
            throwUnexpected(token);
        }
    }

    // Return true if the next token matches the specified punctuator.

    function match(value) {
        var token = lookahead();
        return token.type === Token.Punctuator && token.value === value;
    }

    // Return true if the next token matches the specified keyword

    function matchKeyword(keyword) {
        var token = lookahead();
        return token.type === Token.Keyword && token.value === keyword;
    }

    // Return true if the next token is an assignment operator

    function matchAssign() {
        var token = lookahead(),
            op = token.value;

        if (token.type !== Token.Punctuator) {
            return false;
        }
        return op === '=' ||
            op === '*=' ||
            op === '/=' ||
            op === '%=' ||
            op === '+=' ||
            op === '-=' ||
            op === '<<=' ||
            op === '>>=' ||
            op === '>>>=' ||
            op === '&=' ||
            op === '^=' ||
            op === '|=';
    }


    // Return true if expr is left hand side expression

    function isLeftHandSide(expr) {
        return expr.type === Syntax.Identifier ||
            expr.type === Syntax.MemberExpression ||
            expr.type === Syntax.CallExpression ||
            expr.type === Syntax.NewExpression;
    }


    function consumeSemicolon() {
        var token, line;

        // Catch the very common case first.
        if (source[index] === ';') {
            lex();
            return;
        }

        line = lineNumber;
        skipComment();
        if (lineNumber !== line) {
            return;
        }

        if (match(';')) {
            lex();
            return;
        }

        token = lookahead();
        if (token.type !== Token.EOF && !match('}')) {
            throwUnexpected(token);
        }
        return;
    }

    // 11.1.4 Array Initialiser

    function parseArrayInitialiser() {
        var elements = [],
            undef;

        expect('[');

        while (index < length) {
            if (match(']')) {
                lex();
                break;
            }

            if (match(',')) {
                lex();
                elements.push(undef);
            } else {
                elements.push(parseAssignmentExpression());

                if (match(']')) {
                    lex();
                    break;
                }

                expect(',');
            }
        }

        return {
            type: Syntax.ArrayExpression,
            elements: elements
        };
    }

    // 11.1.5 Object Initialiser

    function parseObjectInitialiser() {
        var token, expr, properties = [], property;

        expect('{');

        // TODO handle 'get' and 'set'
        while (index < length) {
            token = lex();
            if (token.type === Token.Punctuator && token.value === '}') {
                break;
            }

            property = {};
            switch (token.type) {
            case Token.Identifier:
                // Property Assignment: Getter and Setter.

                if (token.value === 'get' && !match(':')) {
                    token = lex();
                    if (!isIdentifierName(token) &&
                            token.type !== Token.StringLiteral &&
                            token.type !== Token.NumericLiteral) {
                        throwUnexpected(token);
                    }
                    if (token.type === Token.StringLiteral ||
                            token.type === Token.NumericLiteral) {
                        property.key = {
                            type: Syntax.Literal,
                            value: token.value
                        };
                    } else {
                        property.key = {
                            type: Syntax.Identifier,
                            name: token.value
                        };
                    }
                    expect('(');
                    expect(')');
                    property.value = {
                        type: Syntax.FunctionExpression,
                        id: null,
                        params: [],
                        body: parseBlock()
                    };
                    property.kind = 'get';
                    break;
                }

                if (token.value === 'set' && !match(':')) {
                    token = lex();
                    if (!isIdentifierName(token) &&
                            token.type !== Token.StringLiteral &&
                            token.type !== Token.NumericLiteral) {
                        throwUnexpected(token);
                    }
                    if (token.type === Token.StringLiteral ||
                            token.type === Token.NumericLiteral) {
                        property.key = {
                            type: Syntax.Literal,
                            value: token.value
                        };
                    } else {
                        property.key = {
                            type: Syntax.Identifier,
                            name: token.value
                        };
                    }
                    expect('(');
                    token = lex();
                    if (token.type !== Token.Identifier) {
                        throwUnexpected(token);
                    }
                    expect(')');
                    property.value = {
                        type: Syntax.FunctionExpression,
                        id: null,
                        params: [{
                            type: Syntax.Identifier,
                            name: token.value
                        }],
                        body: parseBlock()
                    };
                    property.kind = 'set';
                    break;
                }
                property.key = {
                    type: Syntax.Identifier,
                    name: token.value
                };
                expect(':');
                property.value = parseAssignmentExpression();
                break;

            case Token.Keyword:
            case Token.BooleanLiteral:
            case Token.NullLiteral:
                property.key = {
                    type: Syntax.Identifier,
                    name: token.value
                };
                expect(':');
                property.value = parseAssignmentExpression();
                break;

            case Token.StringLiteral:
            case Token.NumericLiteral:
                property.key = {
                    type: Syntax.Literal,
                    value: token.value
                };
                expect(':');
                property.value = parseAssignmentExpression();
                break;

            default:
                throwUnexpected(token);
            }
            properties.push(property);

            token = lookahead();
            if (token.type === Token.Punctuator && token.value === '}') {
                lex();
                break;
            }
            expect(',');
        }

        return {
            type: Syntax.ObjectExpression,
            properties: properties
        };
    }

    // 11.1 Primary Expressions

    function parsePrimary() {
        var token, expr;

        if (match('[')) {
            return parseArrayInitialiser();
        }

        if (match('{')) {
            return parseObjectInitialiser();
        }

        if (match('(')) {
            lex();
            expr = parseExpression();
            expect(')');
            return expr.expression;
        }

        if (matchKeyword('function')) {
            return parseFunctionExpression();
        }

        if (matchKeyword('this')) {
            lex();
            return {
                type: Syntax.ThisExpression
            };
        }

        if (match('/') || match('/=')) {
            return {
                type: Syntax.Literal,
                value: scanRegExp().value
            };
        }

        token = lex();

        if (token.type === Token.Identifier) {
            return {
                type: Syntax.Identifier,
                name: token.value
            };
        }

        if (token.type === Token.BooleanLiteral) {
            return {
                type: Syntax.Literal,
                value: (token.value === 'true')
            };
        }

        if (token.type === Token.NullLiteral) {
            return {
                type: Syntax.Literal,
                value: null
            };
        }

        if (token.type === Token.NumericLiteral) {
            return {
                type: Syntax.Literal,
                value: token.value
            };
        }

        if (token.type === Token.StringLiteral) {
            return {
                type: Syntax.Literal,
                value: token.value
            };
        }

        return throwUnexpected(token);
    }

    function parsePrimaryExpression() {
        return parsePrimary();
    }

    // 11.2 Left-Hand-Side Expressions

    function parseArguments() {
        var args = [];

        expect('(');

        if (!match(')')) {
            while (index < length) {
                args.push(parseAssignmentExpression());
                if (match(')')) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        return args;
    }

    function parseMemberExpression() {
        var expr, token, property;

        expr = parsePrimaryExpression();

        while (index < length) {
            if (match('.')) {
                lex();
                token = lex();
                if (!isIdentifierName(token)) {
                    throwUnexpected(token);
                }
                property = {
                    type: Syntax.Identifier,
                    name: token.value
                };
                expr = {
                    type: Syntax.MemberExpression,
                    computed: false,
                    object: expr,
                    property: property
                };
            } else if (match('[')) {
                lex();
                property = parseExpression();
                if (property.type === Syntax.ExpressionStatement) {
                    property = property.expression;
                }
                expr = {
                    type: Syntax.MemberExpression,
                    computed: true,
                    object: expr,
                    property: property
                };
                expect(']');
            } else if (match('(')) {
                expr = {
                    type: Syntax.CallExpression,
                    callee: expr,
                    'arguments': parseArguments()
                };
            } else {
                break;
            }
        }

        return expr;
    }

    function parseLeftHandSideExpression() {
        var useNew, expr, args;

        useNew = matchKeyword('new');
        if (useNew) {
            // Read the keyword.
            lex();
            expr = parseLeftHandSideExpression();
        } else {
            expr = parseMemberExpression();
        }

        if (match('(')) {
            args = parseArguments();
        }

        if (useNew) {

            // Force to have at least an empty argument list.
            if (typeof args === 'undefined') {
                args = [];
            }

            // e.g. "new x()" thus adopt the CallExpression of "x()".
            if (expr.type === Syntax.CallExpression) {
                args = expr['arguments'];
                expr = expr.callee;
            }

            return {
                type: Syntax.NewExpression,
                callee: expr,
                'arguments': args
            };
        }

        if (typeof args !== 'undefined') {
            return {
                type: Syntax.CallExpression,
                callee: expr,
                'arguments': args
            };
        }

        return expr;
    }

    // 11.3 Postfix Expressions

    function parsePostfixExpression() {
        var expr = parseLeftHandSideExpression();

        if ((match('++') || match('--')) && !peekLineTerminator()) {
            if (!isLeftHandSide(expr)) {
                throwError(Messages.InvalidLHSInPostfixOp, lineNumber);
            }
            expr = {
                type: Syntax.UpdateExpression,
                operator: lex().value,
                argument: expr,
                prefix: false
            };
        }

        return expr;
    }

    // 11.4 Unary Operators

    function parseUnaryExpression() {
        var operator, expr;

        if (match('++') || match('--')) {
            operator = lex().value;
            expr = parseUnaryExpression();
            if (!isLeftHandSide(expr)) {
                throwError(Messages.InvalidLHSInPrefixOp, lineNumber);
            }
            return {
                type: Syntax.UpdateExpression,
                operator: operator,
                argument: expr,
                prefix: true
            };
        }

        if (match('+') || match('-') || match('~') || match('!')) {
            return {
                type: Syntax.UnaryExpression,
                operator: lex().value,
                argument: parseUnaryExpression()
            };
        }

        if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
            return {
                type: Syntax.UnaryExpression,
                operator: lex().value,
                argument: parseUnaryExpression()
            };
        }

        return parsePostfixExpression();
    }

    // 11.5 Multiplicative Operators

    function parseMultiplicativeExpression() {
        var expr = parseUnaryExpression();

        while (match('*') || match('/') || match('%')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseUnaryExpression()
            };
        }

        return expr;
    }

    // 11.6 Additive Operators

    function parseAdditiveExpression() {
        var expr = parseMultiplicativeExpression();

        while (match('+') || match('-')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseMultiplicativeExpression()
            };
        }

        return expr;
    }

    // 11.7 Bitwise Shift Operators

    function parseShiftExpression() {
        var expr = parseAdditiveExpression();

        while (match('<<') || match('>>') || match('>>>')) {
            expr =  {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseAdditiveExpression()
            };
        }

        return expr;
    }

    // 11.8 Relational Operators

    function parseRelationalExpression() {
        var expr = parseShiftExpression();

        if (match('<') || match('>') || match('<=') || match('>=')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseRelationalExpression()
            };
        } else if (matchKeyword('in')) {
            lex();
            expr = {
                type: Syntax.BinaryExpression,
                operator: 'in',
                left: expr,
                right: parseRelationalExpression()
            };
        } else if (matchKeyword('instanceof')) {
            lex();
            expr = {
                type: Syntax.BinaryExpression,
                operator: 'instanceof',
                left: expr,
                right: parseRelationalExpression()
            };
        }

        return expr;
    }

    // 11.9 Equality Operators

    function parseEqualityExpression() {
        var expr = parseRelationalExpression();

        while (match('==') || match('!=') || match('===') || match('!==')) {
            expr = {
                type: Syntax.BinaryExpression,
                operator: lex().value,
                left: expr,
                right: parseRelationalExpression()
            };
        }

        return expr;
    }

    // 11.10 Binary Bitwise Operators

    function parseBitwiseANDExpression() {
        var expr = parseEqualityExpression();

        while (match('&')) {
            lex();
            expr = {
                type: Syntax.BinaryExpression,
                operator: '&',
                left: expr,
                right: parseEqualityExpression()
            };
        }

        return expr;
    }

    function parseBitwiseORExpression() {
        var expr = parseBitwiseANDExpression();

        while (match('|')) {
            lex();
            expr = {
                type: Syntax.BinaryExpression,
                operator: '|',
                left: expr,
                right: parseBitwiseANDExpression()
            };
        }

        return expr;
    }

    function parseBitwiseXORExpression() {
        var expr = parseBitwiseORExpression();

        while (match('^')) {
            lex();
            expr = {
                type: Syntax.BinaryExpression,
                operator: '^',
                left: expr,
                right: parseBitwiseORExpression()
            };
        }

        return expr;
    }

    // 11.11 Binary Logical Operators

    function parseLogicalANDExpression() {
        var expr = parseBitwiseXORExpression();

        while (match('&&')) {
            lex();
            expr = {
                type: Syntax.LogicalExpression,
                operator: '&&',
                left: expr,
                right: parseBitwiseXORExpression()
            };
        }

        return expr;
    }

    function parseLogicalORExpression() {
        var expr = parseLogicalANDExpression();

        while (match('||')) {
            lex();
            expr = {
                type: Syntax.LogicalExpression,
                operator: '||',
                left: expr,
                right: parseLogicalANDExpression()
            };
        }

        return expr;
    }

    // 11.12 Conditional Operator

    function parseConditionalExpression() {
        var expr = parseLogicalORExpression();

        if (match('?')) {
            lex();
            expr = {
                type: Syntax.ConditionalExpression,
                test: expr
            };
            expr.consequent = parseAssignmentExpression();
            expect(':');
            expr.alternate = parseAssignmentExpression();
        }

        return expr;
    }

    // 11.13 Assignment Operators

    function parseAssignmentExpression() {

        var expr = parseConditionalExpression();

        if (matchAssign()) {
            if (!isLeftHandSide(expr)) {
                throwError(Messages.InvalidLHSInAssignment, lineNumber);
            }
            expr = {
                type: Syntax.AssignmentExpression,
                operator: lex().value,
                left: expr,
                right: parseAssignmentExpression()
            };
        }

        return expr;
    }

    // 11.14 Comma Operator

    function parseExpression() {
        var expr = parseAssignmentExpression();

        if (match(',')) {
            expr = {
                type: Syntax.SequenceExpression,
                expressions: [ expr ]
            };

            while (index < length) {
                if (!match(',')) {
                    break;
                }
                lex();
                expr.expressions.push(parseAssignmentExpression());
            }
        }

        return {
            type: Syntax.ExpressionStatement,
            expression: expr
        };
    }

    // 12.1 Block

    function parseStatementList() {
        var list = [],
            statement;

        while (index < length) {
            if (match('}')) {
                break;
            }
            statement = parseSourceElement();
            if (typeof statement === 'undefined') {
                break;
            }
            list.push(statement);
        }

        return list;
    }

    function parseBlock() {
        var block;

        expect('{');

        block = parseStatementList();

        expect('}');

        return {
            type: Syntax.BlockStatement,
            body: block
        };
    }

    // 12.2 Variable Statement

    function parseVariableDeclaration(kind) {
        var token, id, init;

        token = lex();
        if (token.type !== Token.Identifier) {
            throwUnexpected(token);
        }

        id = {
            type: Syntax.Identifier,
            name: token.value
        };

        init = null;
        if (kind === 'const') {
            expect('=');
            init = parseAssignmentExpression();
        } else if (match('=')) {
            lex();
            init = parseAssignmentExpression();
        }

        return {
            id: id,
            init: init
        };
    }

    function parseVariableDeclarationList(kind) {
        var list = [];

        while (index < length) {
            list.push(parseVariableDeclaration(kind));
            if (!match(',')) {
                break;
            }
            lex();
        }

        return list;
    }

    function parseVariableStatement() {
        var declarations;

        expectKeyword('var');

        declarations = parseVariableDeclarationList();

        consumeSemicolon();

        return {
            type: Syntax.VariableDeclaration,
            declarations: declarations,
            kind: 'var'
        };
    }

    // kind may be `const` or `let`
    // Both are experimental and not in the specification yet.
    // see http://wiki.ecmascript.org/doku.php?id=harmony:const
    // and http://wiki.ecmascript.org/doku.php?id=harmony:let
    function parseConstLetDeclaration(kind) {
        var declarations;

        expectKeyword(kind);

        declarations = parseVariableDeclarationList(kind);

        consumeSemicolon();

        return {
            type: Syntax.VariableDeclaration,
            declarations: declarations,
            kind: kind
        };
    }

    // 12.3 Empty Statement

    function parseEmptyStatement() {
        expect(';');

        return {
            type: Syntax.EmptyStatement
        };
    }

    // 12.4 Expression Statement

    function parseExpressionStatement() {
        var expr = parseExpression();

        consumeSemicolon();

        return expr;
    }

    // 12.5 If statement

    function parseIfStatement() {
        var test, consequent, alternate;

        expectKeyword('if');

        expect('(');

        test = parseExpression().expression;

        expect(')');

        consequent = parseStatement();

        if (matchKeyword('else')) {
            lex();
            alternate = parseStatement();
        } else {
            alternate = null;
        }

        return {
            type: Syntax.IfStatement,
            test: test,
            consequent: consequent,
            alternate: alternate
        };
    }

    // 12.6 Iteration Statements

    function parseDoWhileStatement() {
        var body, test;

        expectKeyword('do');

        body = parseStatement();

        expectKeyword('while');

        expect('(');

        test = parseExpression().expression;

        expect(')');

        consumeSemicolon();

        return {
            type: Syntax.DoWhileStatement,
            body: body,
            test: test
        };
    }

    function parseWhileStatement() {
        var test, body;

        expectKeyword('while');

        expect('(');

        test = parseExpression().expression;

        expect(')');

        body = parseStatement();

        return {
            type: Syntax.WhileStatement,
            test: test,
            body: body
        };
    }

    function parseForStatement() {
        var kind, init, test, update, left, right, body;

        init = test = update = null;

        expectKeyword('for');

        expect('(');

        if (match(';')) {
            lex();
        } else {
            if (matchKeyword('var') || matchKeyword('let')) {
                kind = lex().value;
                init = {
                    type: Syntax.VariableDeclaration,
                    declarations: parseVariableDeclarationList(),
                    kind: kind
                };

                if (init.declarations.length === 1 && matchKeyword('in')) {
                    lex();
                    left = init;
                    right = parseExpression().expression;
                    init = null;
                }
            } else {
                init = parseExpression().expression;
            }

            if (typeof left === 'undefined') {
                if (init.hasOwnProperty('operator') && init.operator === 'in') {
                    left = init.left;
                    right = init.right;
                    init = null;
                    if (!isLeftHandSide(left)) {
                        throwError(Messages.InvalidLHSInForIn, lineNumber);
                    }
                } else {
                    expect(';');
                }
            }
        }

        if (typeof left === 'undefined') {

            if (!match(';')) {
                test = parseExpression().expression;
            }
            expect(';');

            if (!match(')')) {
                update = parseExpression().expression;
            }
        }

        expect(')');

        body = parseStatement();

        if (typeof left === 'undefined') {
            return {
                type: Syntax.ForStatement,
                init: init,
                test: test,
                update: update,
                body: body
            };
        }

        return {
            type: Syntax.ForInStatement,
            left: left,
            right: right,
            body: body,
            each: false
        };
    }

    // 12.7 The continue statement

    function parseContinueStatement() {
        var token, label = null;

        expectKeyword('continue');

        // Optimize the most common form: 'continue;'.
        if (source[index] === ';') {
            lex();
            return {
                type: Syntax.ContinueStatement,
                label: null
            };
        }

        if (peekLineTerminator()) {
            return {
                type: Syntax.ContinueStatement,
                label: null
            };
        }

        token = lookahead();
        if (token.type === Token.Identifier) {
            lex();
            label = {
                type: Syntax.Identifier,
                name: token.value
            };
        }

        consumeSemicolon();

        return {
            type: Syntax.ContinueStatement,
            label: label
        };
    }

    // 12.8 The break statement

    function parseBreakStatement() {
        var token, label = null;

        expectKeyword('break');

        // Optimize the most common form: 'break;'.
        if (source[index] === ';') {
            lex();
            return {
                type: Syntax.BreakStatement,
                label: null
            };
        }

        if (peekLineTerminator()) {
            return {
                type: Syntax.BreakStatement,
                label: null
            };
        }

        token = lookahead();
        if (token.type === Token.Identifier) {
            lex();
            label = {
                type: Syntax.Identifier,
                name: token.value
            };
        }

        consumeSemicolon();

        return {
            type: Syntax.BreakStatement,
            label: label
        };
    }

    // 12.9 The return statement

    function parseReturnStatement() {
        var token, argument = null;

        expectKeyword('return');

        // 'return' followed by a space and an identifier is very common.
        if (source[index] === ' ') {
            if (isIdentifierStart(source[index + 1])) {
                argument = parseExpression().expression;
                consumeSemicolon();
                return {
                    type: Syntax.ReturnStatement,
                    argument: argument
                };
            }
        }

        if (peekLineTerminator()) {
            return {
                type: Syntax.ReturnStatement,
                argument: null
            };
        }

        if (!match(';')) {
            token = lookahead();
            if (!match('}') && token.type !== Token.EOF) {
                argument = parseExpression().expression;
            }
        }

        consumeSemicolon();

        return {
            type: Syntax.ReturnStatement,
            argument: argument
        };
    }

    // 12.10 The with statement

    function parseWithStatement() {
        var object, body;

        expectKeyword('with');

        expect('(');

        object = parseExpression().expression;

        expect(')');

        body = parseStatement();

        return {
            type: Syntax.WithStatement,
            object: object,
            body: body
        };
    }

    // 12.10 The swith statement

    function parseSwitchConsequent() {
        var consequent = [],
            statement;

        while (index < length) {
            if (match('}') || matchKeyword('default') || matchKeyword('case')) {
                break;
            }
            statement = parseStatement();
            if (typeof statement === 'undefined') {
                break;
            }
            consequent.push(statement);
        }

        return consequent;
    }

    function parseSwitchStatement() {
        var discriminant, cases, test, consequent, statement;

        expectKeyword('switch');

        expect('(');

        discriminant = parseExpression().expression;

        expect(')');

        expect('{');

        if (match('}')) {
            lex();
            return {
                type: Syntax.SwitchStatement,
                discriminant: discriminant
            };
        }

        cases = [];

        while (index < length) {
            if (match('}')) {
                break;
            }

            if (matchKeyword('default')) {
                lex();
                test = null;
            } else {
                expectKeyword('case');
                test = parseExpression().expression;
            }
            expect(':');

            cases.push({
                type: Syntax.SwitchCase,
                test: test,
                consequent: parseSwitchConsequent()
            });
        }

        expect('}');

        return {
            type: Syntax.SwitchStatement,
            discriminant: discriminant,
            cases: cases
        };
    }

    // 12.13 The throw statement

    function parseThrowStatement() {
        var argument;

        expectKeyword('throw');

        if (peekLineTerminator()) {
            throwError(Messages.NewlineAfterThrow, lineNumber);
        }

        argument = parseExpression().expression;

        consumeSemicolon();

        return {
            type: Syntax.ThrowStatement,
            argument: argument
        };
    }

    // 12.14 The try statement

    function parseTryStatement() {
        var block, handlers = [], param, finalizer = null;

        expectKeyword('try');

        block = parseBlock();

        if (matchKeyword('catch')) {
            lex();
            expect('(');
            if (!match(')')) {
                param = parseExpression().expression;
            }
            expect(')');

            handlers.push({
                type: Syntax.CatchClause,
                param: param,
                guard: null,
                body: parseBlock()
            });
        }

        if (matchKeyword('finally')) {
            lex();
            finalizer = parseBlock();
        }

        if (handlers.length === 0 && !finalizer) {
            throwError(Messages.NoCatchOrFinally, lineNumber);
        }

        return {
            type: Syntax.TryStatement,
            block: block,
            handlers: handlers,
            finalizer: finalizer
        };
    }

    // 12.15 The debugger statement

    function parseDebuggerStatement() {
        expectKeyword('debugger');

        consumeSemicolon();

        return {
            type: Syntax.DebuggerStatement
        };
    }

    // 12 Statements

    function parseStatement() {
        var token = lookahead(),
            stat;

        if (token.type === Token.EOF) {
            return;
        }

        if (token.type === Token.Punctuator) {
            switch (token.value) {
            case ';':
                return parseEmptyStatement();
            case '{':
                return parseBlock();
            case '(':
                return parseExpressionStatement();
            default:
                break;
            }
        }

        if (token.type === Token.Keyword) {
            switch (token.value) {
            case 'break':
                return parseBreakStatement();
            case 'continue':
                return parseContinueStatement();
            case 'debugger':
                return parseDebuggerStatement();
            case 'do':
                return parseDoWhileStatement();
            case 'for':
                return parseForStatement();
            case 'if':
                return parseIfStatement();
            case 'return':
                return parseReturnStatement();
            case 'switch':
                return parseSwitchStatement();
            case 'throw':
                return parseThrowStatement();
            case 'try':
                return parseTryStatement();
            case 'var':
                return parseVariableStatement();
            case 'while':
                return parseWhileStatement();
            case 'with':
                return parseWithStatement();
            default:
                break;
            }
        }

        stat = parseExpression();

        if (stat.expression.type === Syntax.FunctionExpression) {
            if (stat.expression.id !== null) {
                return {
                    type: Syntax.FunctionDeclaration,
                    id: stat.expression.id,
                    params: stat.expression.params,
                    body: stat.expression.body
                };
            }
        }

        // 12.12 Labelled Statements
        if ((stat.expression.type === Syntax.Identifier) && match(':')) {
            lex();
            return {
                type: Syntax.LabeledStatement,
                label: stat.expression,
                body: parseStatement()
            };
        }

        consumeSemicolon();

        return stat;
    }

    // 13 Function Definition

    function parseFunctionDeclaration() {
        var token, id = null, params = [], body;

        expectKeyword('function');

        token = lex();
        if (token.type !== Token.Identifier) {
            throwUnexpected(token);
        }
        id = {
            type: Syntax.Identifier,
            name: token.value
        };

        expect('(');

        if (!match(')')) {
            while (index < length) {
                token = lex();
                if (token.type !== Token.Identifier) {
                    throwUnexpected(token);
                }
                params.push({
                    type: Syntax.Identifier,
                    name: token.value
                });
                if (match(')')) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        body = parseBlock();

        return {
            type: Syntax.FunctionDeclaration,
            id: id,
            params: params,
            body: body
        };
    }

    function parseFunctionExpression() {
        var token, id = null, params = [], body;

        expectKeyword('function');

        if (!match('(')) {
            token = lex();
            if (token.type !== Token.Identifier) {
                throwUnexpected(token);
            }
            id = {
                type: Syntax.Identifier,
                name: token.value
            };
        }

        expect('(');

        if (!match(')')) {
            while (index < length) {
                token = lex();
                if (token.type !== Token.Identifier) {
                    throwUnexpected(token);
                }
                params.push({
                    type: Syntax.Identifier,
                    name: token.value
                });
                if (match(')')) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        body = parseBlock();

        return {
            type: Syntax.FunctionExpression,
            id: id,
            params: params,
            body: body
        };
    }

    // 14 Program

    function parseSourceElement() {
        var token;

        token = lookahead();
        if (token.type === Token.EOF) {
            return;
        }

        if (token.type === Token.Keyword) {
            switch (token.value) {
            case 'const':
            case 'let':
                return parseConstLetDeclaration(token.value);
            case 'function':
                return parseFunctionDeclaration();
            default:
                break;
            }
        }

        return parseStatement();
    }

    function parseSourceElements() {
        var sourceElement, sourceElements = [];

        while (index < length) {
            sourceElement = parseSourceElement();
            if (typeof sourceElement === 'undefined') {
                break;
            }
            sourceElements.push(sourceElement);
        }
        return sourceElements;
    }

    function parseProgram() {
        return {
            type: Syntax.Program,
            body: parseSourceElements()
        };
    }

    // The following functions are needed only when the option to preserve
    // the comments is active.

    function scanComment() {
        var comment, ch, start, blockComment, lineComment;

        comment = '';
        blockComment = false;
        lineComment = false;

        while (index < length) {
            ch = source[index];

            if (lineComment) {
                ch = nextChar();
                if (isLineTerminator(ch)) {
                    lineComment = false;
                    lineNumber += 1;
                    extra.comments.push({
                        range: [start, index - 1],
                        type: 'Line',
                        value: comment
                    });
                    comment = '';
                } else {
                    comment += ch;
                }
            } else if (blockComment) {
                ch = nextChar();
                comment += ch;
                if (ch === '*') {
                    ch = source[index];
                    if (ch === '/') {
                        comment = comment.substr(0, comment.length - 1);
                        blockComment = false;
                        nextChar();
                        extra.comments.push({
                            range: [start, index - 1],
                            type: 'Block',
                            value: comment
                        });
                        comment = '';
                    }
                } else if (isLineTerminator(ch)) {
                    lineNumber += 1;
                }
            } else if (ch === '/') {
                ch = source[index + 1];
                if (ch === '/') {
                    start = index;
                    nextChar();
                    nextChar();
                    lineComment = true;
                } else if (ch === '*') {
                    start = index;
                    nextChar();
                    nextChar();
                    blockComment = true;
                } else {
                    break;
                }
            } else if (isWhiteSpace(ch)) {
                nextChar();
            } else if (isLineTerminator(ch)) {
                nextChar();
                lineNumber += 1;
            } else {
                break;
            }
        }

        if (comment.length > 0) {
            extra.comments.push({
                range: [start, index],
                type: (blockComment) ? 'Block' : 'Line',
                value: comment
            });
        }
    }

    function tokenTypeAsString(type) {
        switch (type) {
        case Token.BooleanLiteral: return 'Boolean';
        case Token.Identifier: return 'Identifier';
        case Token.Keyword: return 'Keyword';
        case Token.NullLiteral: return 'Null';
        case Token.NumericLiteral: return 'Numeric';
        case Token.Punctuator: return 'Punctuator';
        case Token.StringLiteral: return 'String';
        default:
            throw new Error('Unknown token type');
        }
    }

    function lexRange() {
        var pos, token, value;

        if (buffer) {
            index = buffer.range[1];
            lineNumber = buffer.lineNumber;
            token = buffer;
            buffer = null;
            return token;
        }

        buffer = null;
        skipComment();

        pos = index;
        token = advance();
        token.range = [pos, index];
        token.lineNumber = lineNumber;

        if (token.type !== Token.EOF) {
            value = source.slice(pos, index);
            if (typeof value !== 'string') {
                value = value.join('');
            }
            extra.tokens.push({
                type: tokenTypeAsString(token.type),
                value: value,
                range: [pos, index - 1]
            });
        }

        return token;
    }

    function scanRegExpRange() {
        var pos, regex, token;

        skipComment();

        pos = index;
        regex = extra.scanRegExp();

        // Pop the previous token, which is likely '/' or '/='
        if (extra.tokens.length > 0) {
            token = extra.tokens[extra.tokens.length - 1];
            if (token.range[0] === pos && token.type === 'Punctuator') {
                if (token.value === '/' || token.value === '/=') {
                    extra.tokens.pop();
                }
            }
        }

        extra.tokens.push({
            type: 'RegularExpression',
            value: regex.literal,
            range: [pos, index - 1]
        });

        return regex;
    }

    function parsePrimaryRange() {
        var pos, node;

        skipComment();
        pos = index;
        node = parsePrimary();
        node.range = [pos, index - 1];
        return node;
    }

    function processRange(program) {

        function enclosed(a, b) {
            if (typeof a.range === 'object' && typeof b.range === 'object') {
                return [a.range[0], b.range[1]];
            }
        }

        function findBefore(pos) {
            var left = 0,
                right = extra.tokens.length - 1,
                middle,
                token;

            while (left < right) {
                middle = (left + right) >> 1;
                token = extra.tokens[middle];
                if (pos > token.range[1]) {
                    left = Math.min(middle + 1, right);
                } else {
                    right = Math.max(middle - 1, left);
                }
            }

            token = extra.tokens[left];
            if (pos > token.range[1]) {
                return token;
            } else {
                return extra.tokens[left - 1];
            }
        }

        function findAfter(pos) {
            var left = 0,
                right = extra.tokens.length - 1,
                middle,
                token;

            while (left < right) {
                middle = (left + right) >> 1;
                token = extra.tokens[middle];
                if (pos < token.range[0]) {
                    right = Math.max(middle - 1, left);
                } else {
                    left = Math.min(middle + 1, right);
                }
            }

            token = extra.tokens[left];
            if (pos < token.range[0]) {
                return token;
            } else {
                return extra.tokens[right + 1];
            }
        }

        function processNode(node) {
            var i, range, child, token;

            if (node === null || typeof node !== 'object') {
                return;
            }

            if ((node instanceof Array) && node.length) {
                for (i = 0; i < node.length; i += 1) {
                    processNode(node[i]);
                }
            } else {
                for (i in node) {
                    if (node.hasOwnProperty(i)) {
                        processNode(node[i]);
                    }
                }
            }

            switch (node.type) {

            case Syntax.AssignmentExpression:
            case Syntax.LogicalExpression:
                range = enclosed(node.left, node.right);
                break;

            case Syntax.BinaryExpression:
                // Primary expression in a bracket, e.g. '(1 + 2)', already
                // has the range info.
                if (!node.hasOwnProperty('range')) {
                    range = enclosed(node.left, node.right);
                }
                break;

            case Syntax.ConditionalExpression:
                range = enclosed(node.test, node.alternate);
                break;

            case Syntax.MemberExpression:

                child = node.property;

                // This is for the construct like 'foo[bar]'.
                // Find the first token after the closing bracket ].
                if (node.computed && node.property.hasOwnProperty('range')) {
                    token = findAfter(child.range[1]);
                    if (typeof token !== 'undefined') {
                        if (token.type === 'Punctuator' && token.value === ']') {
                            child = token;
                        }
                    }
                }

                // This is for the construct like 'foo.bar'.
                // Find the first token after the dot sign.
                if (!node.computed && node.object.hasOwnProperty('range')) {
                    token = findAfter(node.object.range[1]);
                    if (typeof token !== 'undefined' && token.value === '.') {
                        token = findAfter(token.range[1]);
                        if (typeof token !== 'undefined') {
                            node.property.range = token.range;
                            child = node.property;
                        }
                    }
                }
                range = enclosed(node.object, child);
                break;

            case Syntax.UnaryExpression:
                child = node.argument;
                if (child.hasOwnProperty('range')) {
                    range = enclosed(findBefore(child.range[0]), child);
                }
                break;

            case Syntax.SequenceExpression:
                child = node.expressions[node.expressions.length - 1];
                range = enclosed(node.expressions[0], child);
                break;

            case Syntax.UpdateExpression:
                child = node.argument;
                if (child.hasOwnProperty('range')) {
                    if (node.prefix) {
                        range = enclosed(findBefore(child.range[0]), child);
                    } else {
                        range = enclosed(child, findAfter(child.range[1]));
                    }
                }
                break;

            case Syntax.Program:
                range = [0, length];
                break;

            default:
                break;
            }

            if (typeof range !== 'undefined') {
                node.range = range;
            }
        }

        processNode(program);
    }

    function patch(options) {

        var opt = {
            comment: typeof options.comment === 'boolean' && options.comment,
            range: typeof options.range === 'boolean' && options.range,
            tokens: typeof options.tokens === 'boolean' && options.tokens
        };

        extra = {};

        if (opt.comment) {
            extra.skipComment = skipComment;
            skipComment = scanComment;
            extra.comments = [];
        }

        if (opt.range) {
            extra.parsePrimaryExpression = parsePrimaryExpression;
            parsePrimaryExpression = parsePrimaryRange;
        }

        // Range processing will need the list of tokens as well.
        if (opt.range || opt.tokens) {
            extra.lex = lex;
            extra.scanRegExp = scanRegExp;

            lex = lexRange;
            scanRegExp = scanRegExpRange;

            extra.tokens = [];
        }
    }

    function unpatch() {
        if (typeof extra.skipComment === 'function') {
            skipComment = extra.skipComment;
        }

        if (typeof extra.parsePrimaryExpression === 'function') {
            parsePrimaryExpression = extra.parsePrimaryExpression;
        }

        if (typeof extra.lex === 'function') {
            lex = extra.lex;
        }

        if (typeof extra.scanRegExp === 'function') {
            scanRegExp = extra.scanRegExp;
        }

        extra = {};
    }

    function stringToArray(str) {
        var length = str.length,
            result = [],
            i;
        for (i = 0; i < length; i += 1) {
            result[i] = str.charAt(i);
        }
        return result;
    }

    function parse(code, opt) {
        var options,
            program;

        options = opt || {};

        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        length = source.length;
        buffer = null;

        if (length > 0) {
            if (typeof source[0] === 'undefined') {
                // Try first to convert to a string. This is good as fast path
                // for old IE which understands string indexing for string
                // literals only and not for string object.
                if (code instanceof String) {
                    source = code.valueOf();
                }

                // Force accessing the characters via an array.
                if (typeof source[0] === 'undefined') {
                    source = stringToArray(code);
                }
            }
        }

        patch(options);
        try {
            program = parseProgram();
            if (typeof extra.comments !== 'undefined') {
                program.comments = extra.comments;
            }
            if (typeof extra.tokens !== 'undefined') {
                // Range processing might produce the list of tokens. Thus,
                // only export the tokens when it is explicit in the options.
                if (typeof options.tokens === 'boolean' && options.tokens) {
                    program.tokens = extra.tokens;
                }
            }
            if (typeof options.range === 'boolean' && options.range) {
                processRange(program);
            }
        } catch (e) {
            throw e;
        } finally {
            unpatch();
        }

        return program;
    }

    // Executes f on the object and its children (recursively).

    function visitPreorder(object, f) {
        var key, child;

        if (f(object) === false) {
            return;
        }
        for (key in object) {
            if (object.hasOwnProperty(key)) {
                child = object[key];
                if (typeof child === 'object' && child !== null) {
                    visitPreorder(child, f);
                }
            }
        }
    }

    function traverse(code, options, f) {
        var program;

        if (typeof options === 'undefined') {
            throw new Error('Wrong use of traverse() function');
        }

        if (typeof f === 'undefined') {
            f = options;
            options = {};
        }

        program = parse(code, options);
        visitPreorder(program, f);

        return program;
    }

    // Sync with package.json.
    exports.version = '0.9.6';

    exports.parse = parse;
    exports.traverse = traverse;

}(typeof exports === 'undefined' ? (esprima = {}) : exports));
/* vim: set sw=4 ts=4 et tw=80 : */
