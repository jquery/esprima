import { assert } from './assert';
import { Messages} from './messages';

import { Token } from './token';
import { Syntax } from './syntax';

import { Scanner } from './scanner';

let scanner: Scanner;
let options, state;

let PlaceHolders = {
    ArrowParameterPlaceHolder: 'ArrowParameterPlaceHolder'
};

function Node(startToken?) {
    if (startToken) {
        if (options.range) {
            this.range = [startToken.start, 0];
        }
        if (options.loc) {
            this.loc = {
                start: {
                    line: startToken.lineNumber,
                    column: startToken.start - startToken.lineStart
                },
                end: null
            };
        }
    } else {
        if (options.range) {
            this.range = [scanner.startIndex, 0];
        }
        if (options.loc) {
            this.loc = {
                start: {
                    line: scanner.startLineNumber,
                    column: scanner.startIndex - scanner.startLineStart
                },
                end: null
            };
        }
    }
}

Node.prototype = {

    processComment: function() {
        let bottomRight = state.bottomRightStack;
        let last = bottomRight[bottomRight.length - 1];

        if (this.type === Syntax.Program && this.body.length > 0) {
            return;
        }

        /**
         * patch innnerComments for properties empty block
         * `function a() {/** comments **\/}`
         */

        if (this.type === Syntax.BlockStatement && this.body.length === 0) {
            let innerComments = [];
            for (let i = state.leadingComments.length - 1; i >= 0; --i) {
                let comment = state.leadingComments[i];
                if (this.range[1] >= comment.range[1]) {
                    innerComments.unshift(comment);
                    state.leadingComments.splice(i, 1);
                    state.trailingComments.splice(i, 1);
                }
            }
            if (innerComments.length) {
                this.innerComments = innerComments;
                return;
            }
        }

        let trailingComments = [];
        if (state.trailingComments.length > 0) {
            for (let i = state.trailingComments.length - 1; i >= 0; --i) {
                let comment = state.trailingComments[i];
                if (comment.range[0] >= this.range[1]) {
                    trailingComments.unshift(comment);
                    state.trailingComments.splice(i, 1);
                }
            }
            state.trailingComments = [];
        } else {
            if (last && last.trailingComments && last.trailingComments[0].range[0] >= this.range[1]) {
                trailingComments = last.trailingComments;
                delete last.trailingComments;
            }
        }

        // Eating the stack.
        let lastChild;
        while (last && last.range[0] >= this.range[0]) {
            lastChild = bottomRight.pop();
            last = bottomRight[bottomRight.length - 1];
        }

        let leadingComments = [];
        if (lastChild) {
            if (lastChild.leadingComments) {
                for (let i = lastChild.leadingComments.length - 1; i >= 0; --i) {
                    let comment = lastChild.leadingComments[i];
                    if (comment.range[1] <= this.range[0]) {
                        leadingComments.unshift(comment);
                        lastChild.leadingComments.splice(i, 1);
                    }
                }

                if (!lastChild.leadingComments.length) {
                    lastChild.leadingComments = undefined;
                }
            }
        } else if (state.leadingComments.length > 0) {
            for (let i = state.leadingComments.length - 1; i >= 0; --i) {
                let comment = state.leadingComments[i];
                if (comment.range[1] <= this.range[0]) {
                    leadingComments.unshift(comment);
                    state.leadingComments.splice(i, 1);
                }
            }
        }


        if (leadingComments && leadingComments.length > 0) {
            this.leadingComments = leadingComments;
        }
        if (trailingComments && trailingComments.length > 0) {
            this.trailingComments = trailingComments;
        }

        bottomRight.push(this);
    },

    finish: function() {
        if (options.range) {
            this.range[1] = scanner.lastIndex;
        }
        if (options.loc) {
            this.loc.end = {
                line: scanner.lastLineNumber,
                column: scanner.lastIndex - scanner.lastLineStart
            };
            if (options.source) {
                this.loc.source = options.source;
            }
        }

        if (options.attachComment) {
            this.processComment();
        }
    },

    finishArrayExpression: function(elements) {
        this.type = Syntax.ArrayExpression;
        this.elements = elements;
        this.finish();
        return this;
    },

    finishArrayPattern: function(elements) {
        this.type = Syntax.ArrayPattern;
        this.elements = elements;
        this.finish();
        return this;
    },

    finishArrowFunctionExpression: function(params, defaults, body, expression) {
        this.type = Syntax.ArrowFunctionExpression;
        this.id = null;
        this.params = params;
        this.defaults = defaults;
        this.body = body;
        this.generator = false;
        this.expression = expression;
        this.finish();
        return this;
    },

    finishAssignmentExpression: function(operator, left, right) {
        this.type = Syntax.AssignmentExpression;
        this.operator = operator;
        this.left = left;
        this.right = right;
        this.finish();
        return this;
    },

    finishAssignmentPattern: function(left, right) {
        this.type = Syntax.AssignmentPattern;
        this.left = left;
        this.right = right;
        this.finish();
        return this;
    },

    finishBinaryExpression: function(operator, left, right) {
        this.type = (operator === '||' || operator === '&&') ? Syntax.LogicalExpression : Syntax.BinaryExpression;
        this.operator = operator;
        this.left = left;
        this.right = right;
        this.finish();
        return this;
    },

    finishBlockStatement: function(body) {
        this.type = Syntax.BlockStatement;
        this.body = body;
        this.finish();
        return this;
    },

    finishBreakStatement: function(label) {
        this.type = Syntax.BreakStatement;
        this.label = label;
        this.finish();
        return this;
    },

    finishCallExpression: function(callee, args) {
        this.type = Syntax.CallExpression;
        this.callee = callee;
        this.arguments = args;
        this.finish();
        return this;
    },

    finishCatchClause: function(param, body) {
        this.type = Syntax.CatchClause;
        this.param = param;
        this.body = body;
        this.finish();
        return this;
    },

    finishClassBody: function(body) {
        this.type = Syntax.ClassBody;
        this.body = body;
        this.finish();
        return this;
    },

    finishClassDeclaration: function(id, superClass, body) {
        this.type = Syntax.ClassDeclaration;
        this.id = id;
        this.superClass = superClass;
        this.body = body;
        this.finish();
        return this;
    },

    finishClassExpression: function(id, superClass, body) {
        this.type = Syntax.ClassExpression;
        this.id = id;
        this.superClass = superClass;
        this.body = body;
        this.finish();
        return this;
    },

    finishConditionalExpression: function(test, consequent, alternate) {
        this.type = Syntax.ConditionalExpression;
        this.test = test;
        this.consequent = consequent;
        this.alternate = alternate;
        this.finish();
        return this;
    },

    finishContinueStatement: function(label) {
        this.type = Syntax.ContinueStatement;
        this.label = label;
        this.finish();
        return this;
    },

    finishDebuggerStatement: function() {
        this.type = Syntax.DebuggerStatement;
        this.finish();
        return this;
    },

    finishDoWhileStatement: function(body, test) {
        this.type = Syntax.DoWhileStatement;
        this.body = body;
        this.test = test;
        this.finish();
        return this;
    },

    finishEmptyStatement: function() {
        this.type = Syntax.EmptyStatement;
        this.finish();
        return this;
    },

    finishExpressionStatement: function(expression) {
        this.type = Syntax.ExpressionStatement;
        this.expression = expression;
        this.finish();
        return this;
    },

    finishForStatement: function(init, test, update, body) {
        this.type = Syntax.ForStatement;
        this.init = init;
        this.test = test;
        this.update = update;
        this.body = body;
        this.finish();
        return this;
    },

    finishForOfStatement: function(left, right, body) {
        this.type = Syntax.ForOfStatement;
        this.left = left;
        this.right = right;
        this.body = body;
        this.finish();
        return this;
    },

    finishForInStatement: function(left, right, body) {
        this.type = Syntax.ForInStatement;
        this.left = left;
        this.right = right;
        this.body = body;
        this.each = false;
        this.finish();
        return this;
    },

    finishFunctionDeclaration: function(id, params, defaults, body, generator) {
        this.type = Syntax.FunctionDeclaration;
        this.id = id;
        this.params = params;
        this.defaults = defaults;
        this.body = body;
        this.generator = generator;
        this.expression = false;
        this.finish();
        return this;
    },

    finishFunctionExpression: function(id, params, defaults, body, generator) {
        this.type = Syntax.FunctionExpression;
        this.id = id;
        this.params = params;
        this.defaults = defaults;
        this.body = body;
        this.generator = generator;
        this.expression = false;
        this.finish();
        return this;
    },

    finishIdentifier: function(name) {
        this.type = Syntax.Identifier;
        this.name = name;
        this.finish();
        return this;
    },

    finishIfStatement: function(test, consequent, alternate) {
        this.type = Syntax.IfStatement;
        this.test = test;
        this.consequent = consequent;
        this.alternate = alternate;
        this.finish();
        return this;
    },

    finishLabeledStatement: function(label, body) {
        this.type = Syntax.LabeledStatement;
        this.label = label;
        this.body = body;
        this.finish();
        return this;
    },

    finishLiteral: function(token) {
        this.type = Syntax.Literal;
        this.value = token.value;
        this.raw = scanner.source.slice(token.start, token.end);
        if (token.regex) {
            this.regex = token.regex;
        }
        this.finish();
        return this;
    },

    finishMemberExpression: function(accessor, object, property) {
        this.type = Syntax.MemberExpression;
        this.computed = accessor === '[';
        this.object = object;
        this.property = property;
        this.finish();
        return this;
    },

    finishMetaProperty: function(meta, property) {
        this.type = Syntax.MetaProperty;
        this.meta = meta;
        this.property = property;
        this.finish();
        return this;
    },

    finishNewExpression: function(callee, args) {
        this.type = Syntax.NewExpression;
        this.callee = callee;
        this.arguments = args;
        this.finish();
        return this;
    },

    finishObjectExpression: function(properties) {
        this.type = Syntax.ObjectExpression;
        this.properties = properties;
        this.finish();
        return this;
    },

    finishObjectPattern: function(properties) {
        this.type = Syntax.ObjectPattern;
        this.properties = properties;
        this.finish();
        return this;
    },

    finishPostfixExpression: function(operator, argument) {
        this.type = Syntax.UpdateExpression;
        this.operator = operator;
        this.argument = argument;
        this.prefix = false;
        this.finish();
        return this;
    },

    finishProgram: function(body, sourceType) {
        this.type = Syntax.Program;
        this.body = body;
        this.sourceType = state.sourceType;
        this.finish();
        return this;
    },

    finishProperty: function(kind, key, computed, value, method, shorthand) {
        this.type = Syntax.Property;
        this.key = key;
        this.computed = computed;
        this.value = value;
        this.kind = kind;
        this.method = method;
        this.shorthand = shorthand;
        this.finish();
        return this;
    },

    finishRestElement: function(argument) {
        this.type = Syntax.RestElement;
        this.argument = argument;
        this.finish();
        return this;
    },

    finishReturnStatement: function(argument) {
        this.type = Syntax.ReturnStatement;
        this.argument = argument;
        this.finish();
        return this;
    },

    finishSequenceExpression: function(expressions) {
        this.type = Syntax.SequenceExpression;
        this.expressions = expressions;
        this.finish();
        return this;
    },

    finishSpreadElement: function(argument) {
        this.type = Syntax.SpreadElement;
        this.argument = argument;
        this.finish();
        return this;
    },

    finishSwitchCase: function(test, consequent) {
        this.type = Syntax.SwitchCase;
        this.test = test;
        this.consequent = consequent;
        this.finish();
        return this;
    },

    finishSuper: function() {
        this.type = Syntax.Super;
        this.finish();
        return this;
    },

    finishSwitchStatement: function(discriminant, cases) {
        this.type = Syntax.SwitchStatement;
        this.discriminant = discriminant;
        this.cases = cases;
        this.finish();
        return this;
    },

    finishTaggedTemplateExpression: function(tag, quasi) {
        this.type = Syntax.TaggedTemplateExpression;
        this.tag = tag;
        this.quasi = quasi;
        this.finish();
        return this;
    },

    finishTemplateElement: function(value, tail) {
        this.type = Syntax.TemplateElement;
        this.value = value;
        this.tail = tail;
        this.finish();
        return this;
    },

    finishTemplateLiteral: function(quasis, expressions) {
        this.type = Syntax.TemplateLiteral;
        this.quasis = quasis;
        this.expressions = expressions;
        this.finish();
        return this;
    },

    finishThisExpression: function() {
        this.type = Syntax.ThisExpression;
        this.finish();
        return this;
    },

    finishThrowStatement: function(argument) {
        this.type = Syntax.ThrowStatement;
        this.argument = argument;
        this.finish();
        return this;
    },

    finishTryStatement: function(block, handler, finalizer) {
        this.type = Syntax.TryStatement;
        this.block = block;
        this.guardedHandlers = [];
        this.handlers = handler ? [handler] : [];
        this.handler = handler;
        this.finalizer = finalizer;
        this.finish();
        return this;
    },

    finishUnaryExpression: function(operator, argument) {
        this.type = (operator === '++' || operator === '--') ? Syntax.UpdateExpression : Syntax.UnaryExpression;
        this.operator = operator;
        this.argument = argument;
        this.prefix = true;
        this.finish();
        return this;
    },

    finishVariableDeclaration: function(declarations) {
        this.type = Syntax.VariableDeclaration;
        this.declarations = declarations;
        this.kind = 'var';
        this.finish();
        return this;
    },

    finishLexicalDeclaration: function(declarations, kind) {
        this.type = Syntax.VariableDeclaration;
        this.declarations = declarations;
        this.kind = kind;
        this.finish();
        return this;
    },

    finishVariableDeclarator: function(id, init) {
        this.type = Syntax.VariableDeclarator;
        this.id = id;
        this.init = init;
        this.finish();
        return this;
    },

    finishWhileStatement: function(test, body) {
        this.type = Syntax.WhileStatement;
        this.test = test;
        this.body = body;
        this.finish();
        return this;
    },

    finishWithStatement: function(object, body) {
        this.type = Syntax.WithStatement;
        this.object = object;
        this.body = body;
        this.finish();
        return this;
    },

    finishExportSpecifier: function(local, exported) {
        this.type = Syntax.ExportSpecifier;
        this.exported = exported || local;
        this.local = local;
        this.finish();
        return this;
    },

    finishImportDefaultSpecifier: function(local) {
        this.type = Syntax.ImportDefaultSpecifier;
        this.local = local;
        this.finish();
        return this;
    },

    finishImportNamespaceSpecifier: function(local) {
        this.type = Syntax.ImportNamespaceSpecifier;
        this.local = local;
        this.finish();
        return this;
    },

    finishExportNamedDeclaration: function(declaration, specifiers, src) {
        this.type = Syntax.ExportNamedDeclaration;
        this.declaration = declaration;
        this.specifiers = specifiers;
        this.source = src;
        this.finish();
        return this;
    },

    finishExportDefaultDeclaration: function(declaration) {
        this.type = Syntax.ExportDefaultDeclaration;
        this.declaration = declaration;
        this.finish();
        return this;
    },

    finishExportAllDeclaration: function(src) {
        this.type = Syntax.ExportAllDeclaration;
        this.source = src;
        this.finish();
        return this;
    },

    finishImportSpecifier: function(local, imported) {
        this.type = Syntax.ImportSpecifier;
        this.local = local || imported;
        this.imported = imported;
        this.finish();
        return this;
    },

    finishImportDeclaration: function(specifiers, src) {
        this.type = Syntax.ImportDeclaration;
        this.specifiers = specifiers;
        this.source = src;
        this.finish();
        return this;
    },

    finishYieldExpression: function(argument, delegate) {
        this.type = Syntax.YieldExpression;
        this.argument = argument;
        this.delegate = delegate;
        this.finish();
        return this;
    }
};

declare class Error {
    public name: string;
    public message: string;
    public stack: string;
    public index: number;
    public lineNumber: number;
    public column: number;
    public description: string;
    constructor(message?: string);
}

function recordError(error) {
    for (let e = 0; e < state.errors.length; e++) {
        const existing = state.errors[e];
        // Prevent duplicated error.
        /* istanbul ignore next */
        if (existing.index === error.index && existing.message === error.message) {
            return;
        }
    }

    state.errors.push(error);
}

function constructError(msg: string, column: number): Error {
    let error = new Error(msg);
    try {
        throw error;
    } catch (base) {
        /* istanbul ignore else */
        if (Object.create && Object.defineProperty) {
            error = Object.create(base);
            Object.defineProperty(error, 'column', { value: column });
        }
    } finally {
        return error;
    }
}

function createError(line: number, pos: number, description: string): Error {
    const msg = 'Line ' + line + ': ' + description;
    const column = pos - (scanner.scanning ? scanner.lineStart : scanner.lastLineStart) + 1;
    const error = constructError(msg, column);
    error.lineNumber = line;
    error.description = description;
    error.index = pos;
    return error;
}

function throwError(messageFormat: string, ...values): void {
    const args = Array.prototype.slice.call(arguments, 1);
    const msg = messageFormat.replace(/%(\d)/g,
        function(whole, idx) {
            assert(idx < args.length, 'Message reference must be in range');
            return args[idx];
        }
    );

    throw createError(scanner.lastLineNumber, scanner.lastIndex, msg);
}

function tolerateError(messageFormat, ...values) {
    const args = Array.prototype.slice.call(arguments, 1);
    /* istanbul ignore next */
    const msg = messageFormat.replace(/%(\d)/g,
        function(whole, idx) {
            assert(idx < args.length, 'Message reference must be in range');
            return args[idx];
        }
    );

    const error = createError(scanner.lineNumber, scanner.lastIndex, msg);
    if (options.tolerant) {
        recordError(error);
    } else {
        throw error;
    }
}

// Throw an exception because of the token.
function unexpectedTokenError(token?: any, message?: string): Error {
    let msg = message || Messages.UnexpectedToken;

    let value;
    if (token) {
        if (!message) {
            msg = (token.type === Token.EOF) ? Messages.UnexpectedEOS :
                (token.type === Token.Identifier) ? Messages.UnexpectedIdentifier :
                    (token.type === Token.NumericLiteral) ? Messages.UnexpectedNumber :
                        (token.type === Token.StringLiteral) ? Messages.UnexpectedString :
                            (token.type === Token.Template) ? Messages.UnexpectedTemplate :
                                Messages.UnexpectedToken;

            if (token.type === Token.Keyword) {
                if (scanner.isFutureReservedWord(token.value)) {
                    msg = Messages.UnexpectedReserved;
                } else if (scanner.strict && scanner.isStrictModeReservedWord(token.value)) {
                    msg = Messages.StrictReservedWord;
                }
            }
        }

        value = (token.type === Token.Template) ? token.value.raw : token.value;
    } else {
        value = 'ILLEGAL';
        if (message === Messages.TemplateOctalLiteral) {
            throw createError(scanner.lastLineNumber, scanner.lastIndex, msg);
        }
    }

    msg = msg.replace('%0', value);

    return (token && typeof token.lineNumber === 'number') ?
        createError(token.lineNumber, token.start, msg) :
        createError(scanner.scanning ? scanner.lineNumber : scanner.lastLineNumber, scanner.scanning ? scanner.index : scanner.lastIndex, msg);
}

function throwUnexpectedToken(token?, message?) {
    throw unexpectedTokenError(token, message);
}

function tolerateUnexpectedToken(token?, message?) {
    const error = unexpectedTokenError(token, message);
    if (options.tolerant) {
        recordError(error);
    } else {
        throw error;
    }
}

// Expect the next token to match the specified punctuator.
// If not, an exception will be thrown.

function expect(value) {
    const token = scanner.lex();
    if (token.type !== Token.Punctuator || token.value !== value) {
        throwUnexpectedToken(token);
    }
}

/**
 * @name expectCommaSeparator
 * @description Quietly expect a comma when in tolerant mode, otherwise delegates
 * to <code>expect(value)</code>
 * @since 2.0
 */
function expectCommaSeparator() {
    if (options.tolerant) {
        let token = scanner.lookahead;
        if (token.type === Token.Punctuator && token.value === ',') {
            scanner.lex();
        } else if (token.type === Token.Punctuator && token.value === ';') {
            scanner.lex();
            tolerateUnexpectedToken(token);
        } else {
            tolerateUnexpectedToken(token, Messages.UnexpectedToken);
        }
    } else {
        expect(',');
    }
}

// Expect the next token to match the specified keyword.
// If not, an exception will be thrown.

function expectKeyword(keyword) {
    const token = scanner.lex();
    if (token.type !== Token.Keyword || token.value !== keyword) {
        throwUnexpectedToken(token);
    }
}

// Return true if the next token matches the specified punctuator.

function match(value) {
    return scanner.lookahead.type === Token.Punctuator && scanner.lookahead.value === value;
}

// Return true if the next token matches the specified keyword

function matchKeyword(keyword) {
    return scanner.lookahead.type === Token.Keyword && scanner.lookahead.value === keyword;
}

// Return true if the next token matches the specified contextual keyword
// (where an identifier is sometimes a keyword depending on the context)

function matchContextualKeyword(keyword) {
    return scanner.lookahead.type === Token.Identifier && scanner.lookahead.value === keyword;
}

// Return true if the next token is an assignment operator

function matchAssign() {
    if (scanner.lookahead.type !== Token.Punctuator) {
        return false;
    }
    const op = scanner.lookahead.value;
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

function consumeSemicolon() {
    // Catch the very common case first: immediately a semicolon (U+003B).
    if (scanner.source.charCodeAt(scanner.startIndex) === 0x3B || match(';')) {
        scanner.lex();
        return;
    }

    if (scanner.hasLineTerminator) {
        return;
    }

    // FIXME(ikarienator): this is seemingly an issue in the previous location info convention.
    scanner.lastIndex = scanner.startIndex;
    scanner.lastLineNumber = scanner.startLineNumber;
    scanner.lastLineStart = scanner.startLineStart;

    if (scanner.lookahead.type !== Token.EOF && !match('}')) {
        throwUnexpectedToken(scanner.lookahead);
    }
}

function collectRegex() {
    let regex;
    scanner.skipComment();

    const pos = scanner.index;
    let loc = {
        start: {
            line: scanner.lineNumber,
            column: scanner.index - scanner.lineStart
        },
        end: {}
    };

    regex = state.tokenizeOnly ? scanner.scanRegExp() : scanner.parseRegExpLiteral();

    loc.end = {
        line: scanner.lineNumber,
        column: scanner.index - scanner.lineStart
    };

    /* istanbul ignore next */
    if (!state.tokenizeOnly) {
        // Pop the previous token, which is likely '/' or '/='
        if (state.tokens.length > 0) {
            let token = state.tokens[state.tokens.length - 1];
            if (token.range[0] === pos && token.type === 'Punctuator') {
                if (token.value === '/' || token.value === '/=') {
                    state.tokens.pop();
                }
            }
        }

        state.tokens.push({
            type: 'RegularExpression',
            value: regex.literal,
            regex: regex.regex,
            range: [pos, scanner.index],
            loc: loc
        });
    }

    return regex;
}

function isIdentifierName(token) {
    return token.type === Token.Identifier ||
        token.type === Token.Keyword ||
        token.type === Token.BooleanLiteral ||
        token.type === Token.NullLiteral;
}

// A function following one of those tokens is an expression.
function beforeFunctionExpression(t: string): boolean {
    return ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new',
        'return', 'case', 'delete', 'throw', 'void',
    // assignment operators
        '=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '>>>=',
        '&=', '|=', '^=', ',',
    // binary/unary operators
        '+', '-', '*', '/', '%', '++', '--', '<<', '>>', '>>>', '&',
        '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=',
        '<=', '<', '>', '!=', '!=='].indexOf(t) >= 0;
}

// Using the following algorithm:
// https://github.com/mozilla/sweet.js/wiki/design

function advanceSlash() {
    function testKeyword(value) {
        return value && (value.length > 1) && (value[0] >= 'a') && (value[0] <= 'z');
    }

    const previous = state.tokenValues[state.tokenValues.length - 1];
    let regex = (previous !== null);

    switch (previous) {
        case 'this':
        case ']':
            regex = false;
            break;

        case ')':
            const check = state.tokenValues[state.openParenToken - 1];
            regex = (check === 'if' || check === 'while' || check === 'for' || check === 'with');
            break;

        case '}':
            // Dividing a function by anything makes little sense,
            // but we have to check for that.
            regex = false;
            if (testKeyword(state.tokenValues[state.openCurlyToken - 3])) {
                // Anonymous function, e.g. function(){} /42
                const check = state.tokenValues[state.openCurlyToken - 4];
                regex = check ? !beforeFunctionExpression(check) : false;
            } else if (testKeyword(state.tokenValues[state.openCurlyToken - 4])) {
                // Named function, e.g. function f(){} /42/
                const check = state.tokenValues[state.openCurlyToken - 5];
                regex = check ? !beforeFunctionExpression(check) : true;
            }
    }

    return regex ? collectRegex() : scanner.scanPunctuator();
}

// Cover grammar support.
//
// When an assignment expression position starts with an left parenthesis, the determination of the type
// of the syntax is to be deferred arbitrarily long until the end of the parentheses pair (plus a lookahead)
// or the first comma. This situation also defers the determination of all the expressions nested in the pair.
//
// There are three productions that can be parsed in a parentheses pair that needs to be determined
// after the outermost pair is closed. They are:
//
//   1. AssignmentExpression
//   2. BindingElements
//   3. AssignmentTargets
//
// In order to avoid exponential backtracking, we use two flags to denote if the production can be
// binding element or assignment target.
//
// The three productions have the relationship:
//
//   BindingElements ⊆ AssignmentTargets ⊆ AssignmentExpression
//
// with a single exception that CoverInitializedName when used directly in an Expression, generates
// an early error. Therefore, we need the third state, firstCoverInitializedNameError, to track the
// first usage of CoverInitializedName and report it when we reached the end of the parentheses pair.
//
// isolateCoverGrammar function runs the given parser function with a new cover grammar context, and it does not
// effect the current flags. This means the production the parser parses is only used as an expression. Therefore
// the CoverInitializedName check is conducted.
//
// inheritCoverGrammar function runs the given parse function with a new cover grammar context, and it propagates
// the flags outside of the parser. This means the production the parser parses is used as a part of a potential
// pattern. The CoverInitializedName check is deferred.
function isolateCoverGrammar(parser) {
    const oldIsBindingElement = state.isBindingElement;
    const oldIsAssignmentTarget = state.isAssignmentTarget;
    const oldFirstCoverInitializedNameError = state.firstCoverInitializedNameError;

    state.isBindingElement = true;
    state.isAssignmentTarget = true;
    state.firstCoverInitializedNameError = null;

    const result = parser();
    if (state.firstCoverInitializedNameError !== null) {
        throwUnexpectedToken(state.firstCoverInitializedNameError);
    }

    state.isBindingElement = oldIsBindingElement;
    state.isAssignmentTarget = oldIsAssignmentTarget;
    state.firstCoverInitializedNameError = oldFirstCoverInitializedNameError;

    return result;
}

function inheritCoverGrammar(parser) {
    const oldIsBindingElement = state.isBindingElement;
    const oldIsAssignmentTarget = state.isAssignmentTarget;
    const oldFirstCoverInitializedNameError = state.firstCoverInitializedNameError;

    state.isBindingElement = true;
    state.isAssignmentTarget = true;
    state.firstCoverInitializedNameError = null;

    const result = parser();

    state.isBindingElement = state.isBindingElement && oldIsBindingElement;
    state.isAssignmentTarget = state.isAssignmentTarget && oldIsAssignmentTarget;
    state.firstCoverInitializedNameError = oldFirstCoverInitializedNameError || state.firstCoverInitializedNameError;

    return result;
}

// ECMA-262 13.3.3 Destructuring Binding Patterns

function parseArrayPattern(params, kind) {
    const node = new Node();

    expect('[');
    let elements = [];
    while (!match(']')) {
        if (match(',')) {
            scanner.lex();
            elements.push(null);
        } else {
            if (match('...')) {
                const restNode = new Node();
                scanner.lex();
                params.push(scanner.lookahead);
                const rest = parseVariableIdentifier(kind);
                elements.push(restNode.finishRestElement(rest));
                break;
            } else {
                elements.push(parsePatternWithDefault(params, kind));
            }
            if (!match(']')) {
                expect(',');
            }
        }

    }
    expect(']');

    return node.finishArrayPattern(elements);
}

function parsePropertyPattern(params, kind) {
    const node = new Node();
    const computed = match('[');

    let init, key;
    if (scanner.lookahead.type === Token.Identifier) {
        const keyToken = scanner.lookahead;
        key = parseVariableIdentifier();
        if (match('=')) {
            params.push(keyToken);
            scanner.lex();
            init = parseAssignmentExpression();

            return node.finishProperty(
                'init', key, false,
                new Node(keyToken).finishAssignmentPattern(key, init), false, false);
        } else if (!match(':')) {
            params.push(keyToken);
            return node.finishProperty('init', key, false, key, false, true);
        }
    } else {
        key = parseObjectPropertyKey();
    }

    expect(':');
    init = parsePatternWithDefault(params, kind);
    return node.finishProperty('init', key, computed, init, false, false);
}

function parseObjectPattern(params, kind) {
    const node = new Node();
    let properties = [];

    expect('{');
    while (!match('}')) {
        properties.push(parsePropertyPattern(params, kind));
        if (!match('}')) {
            expect(',');
        }
    }
    expect('}');

    return node.finishObjectPattern(properties);
}

function parsePattern(params, kind?) {
    if (match('[')) {
        return parseArrayPattern(params, kind);
    } else if (match('{')) {
        return parseObjectPattern(params, kind);
    } else if (matchKeyword('let')) {
        if (kind === 'const' || kind === 'let') {
            tolerateUnexpectedToken(scanner.lookahead, Messages.UnexpectedToken);
        }
    }

    params.push(scanner.lookahead);
    return parseVariableIdentifier(kind);
}

function parsePatternWithDefault(params, kind?) {
    let startToken = scanner.lookahead;
    let pattern = parsePattern(params, kind);

    if (match('=')) {
        scanner.lex();
        const previousAllowYield = state.allowYield;
        state.allowYield = true;
        const right = isolateCoverGrammar(parseAssignmentExpression);
        state.allowYield = previousAllowYield;
        pattern = new Node(startToken).finishAssignmentPattern(pattern, right);
    }

    return pattern;
}

// ECMA-262 12.2.5 Array Initializer

function parseArrayInitializer() {
    const node = new Node();
    let elements = [];

    expect('[');
    while (!match(']')) {
        if (match(',')) {
            scanner.lex();
            elements.push(null);
        } else if (match('...')) {
            const restSpread = new Node();
            scanner.lex();
            restSpread.finishSpreadElement(inheritCoverGrammar(parseAssignmentExpression));

            if (!match(']')) {
                state.isAssignmentTarget = state.isBindingElement = false;
                expect(',');
            }
            elements.push(restSpread);
        } else {
            elements.push(inheritCoverGrammar(parseAssignmentExpression));

            if (!match(']')) {
                expect(',');
            }
        }
    }
    expect(']');

    return node.finishArrayExpression(elements);
}

// ECMA-262 12.2.6 Object Initializer

function parsePropertyFunction(node, paramInfo, isGenerator) {
    state.isAssignmentTarget = state.isBindingElement = false;

    const previousStrict = scanner.strict;
    const body = isolateCoverGrammar(parseFunctionSourceElements);

    if (scanner.strict && paramInfo.firstRestricted) {
        tolerateUnexpectedToken(paramInfo.firstRestricted, paramInfo.message);
    }
    if (scanner.strict && paramInfo.stricted) {
        tolerateUnexpectedToken(paramInfo.stricted, paramInfo.message);
    }

    scanner.strict = previousStrict;
    return node.finishFunctionExpression(null, paramInfo.params, paramInfo.defaults, body, isGenerator);
}

function parsePropertyMethodFunction() {
    const node = new Node();

    const previousAllowYield = state.allowYield;
    state.allowYield = false;
    const params = parseParams();
    state.allowYield = previousAllowYield;

    state.allowYield = false;
    const method = parsePropertyFunction(node, params, false);
    state.allowYield = previousAllowYield;

    return method;
}

function parseObjectPropertyKey() {
    const node = new Node();
    const token = scanner.lex();

    // Note: This function is called only from parseObjectProperty(), where
    // EOF and Punctuator tokens are already filtered out.

    switch (token.type) {
        case Token.StringLiteral:
        case Token.NumericLiteral:
            if (scanner.strict && token.octal) {
                tolerateUnexpectedToken(token, Messages.StrictOctalLiteral);
            }
            return node.finishLiteral(token);
        case Token.Identifier:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.Keyword:
            return node.finishIdentifier(token.value);
        case Token.Punctuator:
            if (token.value === '[') {
                const expr = isolateCoverGrammar(parseAssignmentExpression);
                expect(']');
                return expr;
            }
            break;
    }
    throwUnexpectedToken(token);
}

function lookaheadPropertyName() {
    switch (scanner.lookahead.type) {
        case Token.Identifier:
        case Token.StringLiteral:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.NumericLiteral:
        case Token.Keyword:
            return true;
        case Token.Punctuator:
            return scanner.lookahead.value === '[';
    }
    return false;
}

// This function is to try to parse a MethodDefinition as defined in 14.3. But in the case of object literals,
// it might be called at a position where there is in fact a short hand identifier pattern or a data property.
// This can only be determined after we consumed up to the left parentheses.
//
// In order to avoid back tracking, it returns `null` if the position is not a MethodDefinition and the caller
// is responsible to visit other options.
function tryParseMethodDefinition(token, key, computed, node) {
    const previousAllowYield = state.allowYield;

    if (token.type === Token.Identifier) {
        let value, options;

        if (token.value === 'get' && lookaheadPropertyName()) {
            computed = match('[');
            key = parseObjectPropertyKey();
            let methodNode = new Node();
            expect('(');
            expect(')');

            state.allowYield = false;
            value = parsePropertyFunction(methodNode, {
                params: [],
                defaults: [],
                stricted: null,
                firstRestricted: null,
                message: null
            }, false);
            state.allowYield = previousAllowYield;

            return node.finishProperty('get', key, computed, value, false, false);
        } else if (token.value === 'set' && lookaheadPropertyName()) {
            computed = match('[');
            key = parseObjectPropertyKey();
            let methodNode = new Node();
            expect('(');

            options = {
                params: [],
                defaultCount: 0,
                defaults: [],
                firstRestricted: null,
                paramSet: {}
            };
            if (match(')')) {
                tolerateUnexpectedToken(scanner.lookahead);
            } else {
                state.allowYield = false;
                parseParam(options);
                state.allowYield = previousAllowYield;
                if (options.defaultCount === 0) {
                    options.defaults = [];
                }
            }
            expect(')');

            state.allowYield = false;
            value = parsePropertyFunction(methodNode, options, false);
            state.allowYield = previousAllowYield;

            return node.finishProperty('set', key, computed, value, false, false);
        }
    } else if (token.type === Token.Punctuator && token.value === '*' && lookaheadPropertyName()) {
        computed = match('[');
        key = parseObjectPropertyKey();
        let methodNode = new Node();

        state.allowYield = true;
        const params = parseParams();
        state.allowYield = previousAllowYield;

        state.allowYield = false;
        const value = parsePropertyFunction(methodNode, params, true);
        state.allowYield = previousAllowYield;

        return node.finishProperty('init', key, computed, value, true, false);
    }

    if (key && match('(')) {
        const value = parsePropertyMethodFunction();
        return node.finishProperty('init', key, computed, value, true, false);
    }

    // Not a MethodDefinition.
    return null;
}

function parseObjectProperty(hasProto) {
    const node = new Node();

    const token = scanner.lookahead;
    const computed = match('[');
    let key;
    if (match('*')) {
        scanner.lex();
    } else {
        key = parseObjectPropertyKey();
    }

    const maybeMethod = tryParseMethodDefinition(token, key, computed, node);
    if (maybeMethod) {
        return maybeMethod;
    }

    if (!key) {
        throwUnexpectedToken(scanner.lookahead);
    }

    // Check for duplicated __proto__
    if (!computed) {
        const proto = (key.type === Syntax.Identifier && key.name === '__proto__') ||
            (key.type === Syntax.Literal && key.value === '__proto__');
        if (proto) {
            if (hasProto.value) {
                tolerateError(Messages.DuplicateProtoProperty);
            } else {
                hasProto.value = true;
            }
        }
    }

    if (match(':')) {
        scanner.lex();
        const value = inheritCoverGrammar(parseAssignmentExpression);
        return node.finishProperty('init', key, computed, value, false, false);
    }

    if (token.type === Token.Identifier) {
        if (match('=')) {
            state.firstCoverInitializedNameError = scanner.lookahead;
            scanner.lex();
            const value = isolateCoverGrammar(parseAssignmentExpression);
            return node.finishProperty('init', key, computed,
                new Node(token).finishAssignmentPattern(key, value), false, true);
        }
        return node.finishProperty('init', key, computed, key, false, true);
    }

    throwUnexpectedToken(scanner.lookahead);
}

function parseObjectInitializer() {
    const node = new Node();
    let hasProto = { value: false };
    let properties = [];

    expect('{');
    while (!match('}')) {
        properties.push(parseObjectProperty(hasProto));

        if (!match('}')) {
            expectCommaSeparator();
        }
    }
    expect('}');

    return node.finishObjectExpression(properties);
}

function reinterpretExpressionAsPattern(expr) {
    switch (expr.type) {
        case Syntax.Identifier:
        case Syntax.MemberExpression:
        case Syntax.RestElement:
        case Syntax.AssignmentPattern:
            break;
        case Syntax.SpreadElement:
            expr.type = Syntax.RestElement;
            reinterpretExpressionAsPattern(expr.argument);
            break;
        case Syntax.ArrayExpression:
            expr.type = Syntax.ArrayPattern;
            for (let i = 0; i < expr.elements.length; i++) {
                if (expr.elements[i] !== null) {
                    reinterpretExpressionAsPattern(expr.elements[i]);
                }
            }
            break;
        case Syntax.ObjectExpression:
            expr.type = Syntax.ObjectPattern;
            for (let i = 0; i < expr.properties.length; i++) {
                reinterpretExpressionAsPattern(expr.properties[i].value);
            }
            break;
        case Syntax.AssignmentExpression:
            expr.type = Syntax.AssignmentPattern;
            reinterpretExpressionAsPattern(expr.left);
            break;
        default:
            // Allow other node type for tolerant parsing.
            break;
    }
}

// ECMA-262 12.2.9 Template Literals

function parseTemplateElement(option) {
    if (scanner.lookahead.type !== Token.Template || (option.head && !scanner.lookahead.head)) {
        throwUnexpectedToken();
    }

    const node = new Node();
    const token = scanner.lex();

    return node.finishTemplateElement({ raw: token.value.raw, cooked: token.value.cooked }, token.tail);
}

function parseTemplateLiteral() {
    const node = new Node();
    let quasi = parseTemplateElement({ head: true });
    let quasis = [quasi];
    let expressions = [];
    while (!quasi.tail) {
        expressions.push(parseExpression());
        quasi = parseTemplateElement({ head: false });
        quasis.push(quasi);
    }

    return node.finishTemplateLiteral(quasis, expressions);
}

// ECMA-262 12.2.10 The Grouping Operator

function parseGroupExpression() {
    expect('(');
    if (match(')')) {
        scanner.lex();
        if (!match('=>')) {
            expect('=>');
        }
        return {
            type: PlaceHolders.ArrowParameterPlaceHolder,
            params: [],
            rawParams: []
        };
    }

    const startToken = scanner.lookahead;
    let params = [];
    let expr;

    if (match('...')) {
        expr = parseRestElement(params);
        expect(')');
        if (!match('=>')) {
            expect('=>');
        }
        return {
            type: PlaceHolders.ArrowParameterPlaceHolder,
            params: [expr]
        };
    }

    state.isBindingElement = true;
    expr = inheritCoverGrammar(parseAssignmentExpression);

    if (match(',')) {
        state.isAssignmentTarget = false;
        let expressions = [expr];

        while (scanner.startIndex < scanner.length) {
            if (!match(',')) {
                break;
            }
            scanner.lex();

            if (match('...')) {
                if (!state.isBindingElement) {
                    throwUnexpectedToken(scanner.lookahead);
                }
                expressions.push(parseRestElement(params));
                expect(')');
                if (!match('=>')) {
                    expect('=>');
                }
                state.isBindingElement = false;
                for (let i = 0; i < expressions.length; i++) {
                    reinterpretExpressionAsPattern(expressions[i]);
                }
                return {
                    type: PlaceHolders.ArrowParameterPlaceHolder,
                    params: expressions
                };
            }

            expressions.push(inheritCoverGrammar(parseAssignmentExpression));
        }

        expr = new Node(startToken).finishSequenceExpression(expressions);
    }


    expect(')');

    if (match('=>')) {
        if (expr.type === Syntax.Identifier && expr.name === 'yield') {
            return {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: [expr]
            };
        }

        if (!state.isBindingElement) {
            throwUnexpectedToken(scanner.lookahead);
        }

        if (expr.type === Syntax.SequenceExpression) {
            for (let i = 0; i < expr.expressions.length; i++) {
                reinterpretExpressionAsPattern(expr.expressions[i]);
            }
        } else {
            reinterpretExpressionAsPattern(expr);
        }

        expr = {
            type: PlaceHolders.ArrowParameterPlaceHolder,
            params: expr.type === Syntax.SequenceExpression ? expr.expressions : [expr]
        };
    }
    state.isBindingElement = false;
    return expr;
}


// ECMA-262 12.2 Primary Expressions

function parsePrimaryExpression() {
    if (match('(')) {
        state.isBindingElement = false;
        return inheritCoverGrammar(parseGroupExpression);
    }

    if (match('[')) {
        return inheritCoverGrammar(parseArrayInitializer);
    }

    if (match('{')) {
        return inheritCoverGrammar(parseObjectInitializer);
    }

    const type = scanner.lookahead.type;
    const node = new Node();
    let expr;

    if (type === Token.Identifier) {
        if (state.sourceType === 'module' && scanner.lookahead.value === 'await') {
            tolerateUnexpectedToken(scanner.lookahead);
        }
        expr = node.finishIdentifier(scanner.lex().value);
    } else if (type === Token.StringLiteral || type === Token.NumericLiteral) {
        state.isAssignmentTarget = state.isBindingElement = false;
        if (scanner.strict && scanner.lookahead.octal) {
            tolerateUnexpectedToken(scanner.lookahead, Messages.StrictOctalLiteral);
        }
        expr = node.finishLiteral(scanner.lex());
    } else if (type === Token.Keyword) {
        if (!scanner.strict && state.allowYield && matchKeyword('yield')) {
            return parseNonComputedProperty();
        }
        state.isAssignmentTarget = state.isBindingElement = false;
        if (matchKeyword('function')) {
            return parseFunctionExpression();
        }
        if (matchKeyword('this')) {
            scanner.lex();
            return node.finishThisExpression();
        }
        if (matchKeyword('class')) {
            return parseClassExpression();
        }
        if (!scanner.strict && matchKeyword('let')) {
            return node.finishIdentifier(scanner.lex().value);
        }
        throwUnexpectedToken(scanner.lex());
    } else if (type === Token.BooleanLiteral) {
        state.isAssignmentTarget = state.isBindingElement = false;
        let token = scanner.lex();
        token.value = (token.value === 'true');
        expr = node.finishLiteral(token);
    } else if (type === Token.NullLiteral) {
        state.isAssignmentTarget = state.isBindingElement = false;
        let token = scanner.lex();
        token.value = null;
        expr = node.finishLiteral(token);
    } else if (match('/') || match('/=')) {
        state.isAssignmentTarget = state.isBindingElement = false;
        scanner.index = scanner.startIndex;
        let token = options.tokens ? collectRegex() : scanner.scanRegExp();
        scanner.lex();
        expr = node.finishLiteral(token);
    } else if (type === Token.Template) {
        expr = parseTemplateLiteral();
    } else {
        throwUnexpectedToken(scanner.lex());
    }

    return expr;
}

// ECMA-262 12.3 Left-Hand-Side Expressions

function parseArguments() {
    let args = [];

    expect('(');
    if (!match(')')) {
        while (scanner.startIndex < scanner.length) {
            let expr;
            if (match('...')) {
                expr = new Node();
                scanner.lex();
                expr.finishSpreadElement(isolateCoverGrammar(parseAssignmentExpression));
            } else {
                expr = isolateCoverGrammar(parseAssignmentExpression);
            }
            args.push(expr);
            if (match(')')) {
                break;
            }
            expectCommaSeparator();
        }
    }
    expect(')');

    return args;
}

function parseNonComputedProperty() {
    const node = new Node();
    const token = scanner.lex();
    if (!isIdentifierName(token)) {
        throwUnexpectedToken(token);
    }

    return node.finishIdentifier(token.value);
}

function parseNonComputedMember() {
    expect('.');
    return parseNonComputedProperty();
}

function parseComputedMember() {
    expect('[');
    const expr = isolateCoverGrammar(parseExpression);
    expect(']');

    return expr;
}

// ECMA-262 12.3.3 The new Operator

function parseNewExpression() {
    const node = new Node();

    expectKeyword('new');
    if (match('.')) {
        scanner.lex();
        if (scanner.lookahead.type === Token.Identifier && scanner.lookahead.value === 'target') {
            if (state.inFunctionBody) {
                scanner.lex();
                return node.finishMetaProperty('new', 'target');
            }
        }
        throwUnexpectedToken(scanner.lookahead);
    }

    const callee = isolateCoverGrammar(parseLeftHandSideExpression);
    const args = match('(') ? parseArguments() : [];

    state.isAssignmentTarget = state.isBindingElement = false;
    return node.finishNewExpression(callee, args);
}

// ECMA-262 12.3.4 Function Calls

function parseLeftHandSideExpressionAllowCall() {
    const startToken = scanner.lookahead;
    const previousAllowIn = state.allowIn;
    state.allowIn = true;

    let expr;
    if (matchKeyword('super') && state.inFunctionBody) {
        expr = new Node();
        scanner.lex();
        expr = expr.finishSuper();
        if (!match('(') && !match('.') && !match('[')) {
            throwUnexpectedToken(scanner.lookahead);
        }
    } else {
        expr = inheritCoverGrammar(matchKeyword('new') ? parseNewExpression : parsePrimaryExpression);
    }

    while (true) {
        if (match('.')) {
            state.isBindingElement = false;
            state.isAssignmentTarget = true;
            const property = parseNonComputedMember();
            expr = new Node(startToken).finishMemberExpression('.', expr, property);
        } else if (match('(')) {
            state.isBindingElement = false;
            state.isAssignmentTarget = false;
            const args = parseArguments();
            expr = new Node(startToken).finishCallExpression(expr, args);
        } else if (match('[')) {
            state.isBindingElement = false;
            state.isAssignmentTarget = true;
            const property = parseComputedMember();
            expr = new Node(startToken).finishMemberExpression('[', expr, property);
        } else if (scanner.lookahead.type === Token.Template && scanner.lookahead.head) {
            const quasi = parseTemplateLiteral();
            expr = new Node(startToken).finishTaggedTemplateExpression(expr, quasi);
        } else {
            break;
        }
    }
    state.allowIn = previousAllowIn;

    return expr;
}

// ECMA-262 12.3 Left-Hand-Side Expressions

function parseLeftHandSideExpression() {
    assert(state.allowIn, 'callee of new expression always allow in keyword.');

    const startToken = scanner.lookahead;
    let expr;
    if (matchKeyword('super') && state.inFunctionBody) {
        expr = new Node();
        scanner.lex();
        expr = expr.finishSuper();
        if (!match('[') && !match('.')) {
            throwUnexpectedToken(scanner.lookahead);
        }
    } else {
        expr = inheritCoverGrammar(matchKeyword('new') ? parseNewExpression : parsePrimaryExpression);
    }

    while (true) {
        if (match('[')) {
            state.isBindingElement = false;
            state.isAssignmentTarget = true;
            const property = parseComputedMember();
            expr = new Node(startToken).finishMemberExpression('[', expr, property);
        } else if (match('.')) {
            state.isBindingElement = false;
            state.isAssignmentTarget = true;
            const property = parseNonComputedMember();
            expr = new Node(startToken).finishMemberExpression('.', expr, property);
        } else if (scanner.lookahead.type === Token.Template && scanner.lookahead.head) {
            const quasi = parseTemplateLiteral();
            expr = new Node(startToken).finishTaggedTemplateExpression(expr, quasi);
        } else {
            break;
        }
    }
    return expr;
}

// ECMA-262 12.4 Postfix Expressions

function parsePostfixExpression() {
    const startToken = scanner.lookahead;
    let expr = inheritCoverGrammar(parseLeftHandSideExpressionAllowCall);

    if (!scanner.hasLineTerminator && scanner.lookahead.type === Token.Punctuator) {
        if (match('++') || match('--')) {
            // ECMA-262 11.3.1, 11.3.2
            if (scanner.strict && expr.type === Syntax.Identifier && scanner.isRestrictedWord(expr.name)) {
                tolerateError(Messages.StrictLHSPostfix);
            }

            if (!state.isAssignmentTarget) {
                tolerateError(Messages.InvalidLHSInAssignment);
            }

            state.isAssignmentTarget = state.isBindingElement = false;

            const token = scanner.lex();
            expr = new Node(startToken).finishPostfixExpression(token.value, expr);
        }
    }

    return expr;
}

// ECMA-262 12.5 Unary Operators

function parseUnaryExpression() {
    let expr;
    if (scanner.lookahead.type !== Token.Punctuator && scanner.lookahead.type !== Token.Keyword) {
        expr = parsePostfixExpression();
    } else if (match('++') || match('--')) {
        const startToken = scanner.lookahead;
        const token = scanner.lex();
        expr = inheritCoverGrammar(parseUnaryExpression);
        // ECMA-262 11.4.4, 11.4.5
        if (scanner.strict && expr.type === Syntax.Identifier && scanner.isRestrictedWord(expr.name)) {
            tolerateError(Messages.StrictLHSPrefix);
        }

        if (!state.isAssignmentTarget) {
            tolerateError(Messages.InvalidLHSInAssignment);
        }
        expr = new Node(startToken).finishUnaryExpression(token.value, expr);
        state.isAssignmentTarget = state.isBindingElement = false;
    } else if (match('+') || match('-') || match('~') || match('!')) {
        const startToken = scanner.lookahead;
        const token = scanner.lex();
        expr = inheritCoverGrammar(parseUnaryExpression);
        expr = new Node(startToken).finishUnaryExpression(token.value, expr);
        state.isAssignmentTarget = state.isBindingElement = false;
    } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
        const startToken = scanner.lookahead;
        const token = scanner.lex();
        expr = inheritCoverGrammar(parseUnaryExpression);
        expr = new Node(startToken).finishUnaryExpression(token.value, expr);
        if (scanner.strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
            tolerateError(Messages.StrictDelete);
        }
        state.isAssignmentTarget = state.isBindingElement = false;
    } else {
        expr = parsePostfixExpression();
    }

    return expr;
}

function binaryPrecedence(token, allowIn) {
    let prec = 0;

    if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
        return 0;
    }

    switch (token.value) {
        case '||':
            prec = 1;
            break;

        case '&&':
            prec = 2;
            break;

        case '|':
            prec = 3;
            break;

        case '^':
            prec = 4;
            break;

        case '&':
            prec = 5;
            break;

        case '==':
        case '!=':
        case '===':
        case '!==':
            prec = 6;
            break;

        case '<':
        case '>':
        case '<=':
        case '>=':
        case 'instanceof':
            prec = 7;
            break;

        case 'in':
            prec = allowIn ? 7 : 0;
            break;

        case '<<':
        case '>>':
        case '>>>':
            prec = 8;
            break;

        case '+':
        case '-':
            prec = 9;
            break;

        case '*':
        case '/':
        case '%':
            prec = 11;
            break;

        default:
            break;
    }

    return prec;
}

// ECMA-262 12.6 Multiplicative Operators
// ECMA-262 12.7 Additive Operators
// ECMA-262 12.8 Bitwise Shift Operators
// ECMA-262 12.9 Relational Operators
// ECMA-262 12.10 Equality Operators
// ECMA-262 12.11 Binary Bitwise Operators
// ECMA-262 12.12 Binary Logical Operators

function parseBinaryExpression() {
    const marker = scanner.lookahead;

    let left = inheritCoverGrammar(parseUnaryExpression);

    let token = scanner.lookahead;
    let prec = binaryPrecedence(token, state.allowIn);
    if (prec === 0) {
        return left;
    }
    state.isAssignmentTarget = state.isBindingElement = false;
    token.prec = prec;
    scanner.lex();

    let markers = [marker, scanner.lookahead];
    let right = isolateCoverGrammar(parseUnaryExpression);

    let stack = [left, token, right];

    while ((prec = binaryPrecedence(scanner.lookahead, state.allowIn)) > 0) {
        let expr;

        // Reduce: make a binary expression from the three topmost entries.
        while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
            right = stack.pop();
            const operator = stack.pop().value;
            left = stack.pop();
            markers.pop();
            expr = new Node(markers[markers.length - 1]).finishBinaryExpression(operator, left, right);
            stack.push(expr);
        }

        // Shift.
        token = scanner.lex();
        token.prec = prec;
        stack.push(token);
        markers.push(scanner.lookahead);
        expr = isolateCoverGrammar(parseUnaryExpression);
        stack.push(expr);
    }

    // Final reduce to clean-up the stack.
    let i = stack.length - 1;
    let expr = stack[i];
    markers.pop();
    while (i > 1) {
        expr = new Node(markers.pop()).finishBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
        i -= 2;
    }

    return expr;
}


// ECMA-262 12.13 Conditional Operator

function parseConditionalExpression() {
    const startToken = scanner.lookahead;

    let expr = inheritCoverGrammar(parseBinaryExpression);
    if (match('?')) {
        scanner.lex();

        const previousAllowIn = state.allowIn;
        state.allowIn = true;
        const consequent = isolateCoverGrammar(parseAssignmentExpression);
        state.allowIn = previousAllowIn;

        expect(':');
        const alternate = isolateCoverGrammar(parseAssignmentExpression);

        expr = new Node(startToken).finishConditionalExpression(expr, consequent, alternate);
        state.isAssignmentTarget = state.isBindingElement = false;
    }

    return expr;
}

// ECMA-262 14.2 Arrow Function Definitions

function parseConciseBody() {
    if (match('{')) {
        return parseFunctionSourceElements();
    }
    return isolateCoverGrammar(parseAssignmentExpression);
}

function checkPatternParam(options, param) {
    switch (param.type) {
        case Syntax.Identifier:
            validateParam(options, param, param.name);
            break;
        case Syntax.RestElement:
            checkPatternParam(options, param.argument);
            break;
        case Syntax.AssignmentPattern:
            checkPatternParam(options, param.left);
            break;
        case Syntax.ArrayPattern:
            for (let i = 0; i < param.elements.length; i++) {
                if (param.elements[i] !== null) {
                    checkPatternParam(options, param.elements[i]);
                }
            }
            break;
        case Syntax.YieldExpression:
            break;
        default:
            assert(param.type === Syntax.ObjectPattern, 'Invalid type');
            for (let i = 0; i < param.properties.length; i++) {
                checkPatternParam(options, param.properties[i].value);
            }
            break;
    }
}
function reinterpretAsCoverFormalsList(expr) {
    let params = [expr];
    let options;

    switch (expr.type) {
        case Syntax.Identifier:
            break;
        case PlaceHolders.ArrowParameterPlaceHolder:
            params = expr.params;
            break;
        default:
            return null;
    }

    options = {
        paramSet: {}
    };

    let defaults = [];
    let defaultCount = 0;
    for (let i = 0; i < params.length; ++i) {
        const param = params[i];
        switch (param.type) {
            case Syntax.AssignmentPattern:
                params[i] = param.left;
                if (param.right.type === Syntax.YieldExpression) {
                    if (param.right.argument) {
                        throwUnexpectedToken(scanner.lookahead);
                    }
                    param.right.type = Syntax.Identifier;
                    param.right.name = 'yield';
                    delete param.right.argument;
                    delete param.right.delegate;
                }
                defaults.push(param.right);
                ++defaultCount;
                checkPatternParam(options, param.left);
                break;
            default:
                checkPatternParam(options, param);
                params[i] = param;
                defaults.push(null);
                break;
        }
    }

    if (scanner.strict || !state.allowYield) {
        for (let i = 0; i < params.length; ++i) {
            const param = params[i];
            if (param.type === Syntax.YieldExpression) {
                throwUnexpectedToken(scanner.lookahead);
            }
        }
    }

    if (options.message === Messages.StrictParamDupe) {
        const token = scanner.strict ? options.stricted : options.firstRestricted;
        throwUnexpectedToken(token, options.message);
    }

    if (defaultCount === 0) {
        defaults = [];
    }

    return {
        params: params,
        defaults: defaults,
        stricted: options.stricted,
        firstRestricted: options.firstRestricted,
        message: options.message
    };
}

function parseArrowFunctionExpression(options, node) {
    if (scanner.hasLineTerminator) {
        tolerateUnexpectedToken(scanner.lookahead);
    }
    expect('=>');

    const previousStrict = scanner.strict;
    const previousAllowYield = state.allowYield;
    state.allowYield = true;

    const body = parseConciseBody();

    if (scanner.strict && options.firstRestricted) {
        throwUnexpectedToken(options.firstRestricted, options.message);
    }
    if (scanner.strict && options.stricted) {
        tolerateUnexpectedToken(options.stricted, options.message);
    }

    scanner.strict = previousStrict;
    state.allowYield = previousAllowYield;

    return node.finishArrowFunctionExpression(options.params, options.defaults, body, body.type !== Syntax.BlockStatement);
}

// ECMA-262 14.4 Yield expression

function parseYieldExpression() {
    let expr = new Node();
    expectKeyword('yield');

    let argument = null;
    let delegate;
    if (!scanner.hasLineTerminator) {
        const previousAllowYield = state.allowYield;
        state.allowYield = false;
        delegate = match('*');
        if (delegate) {
            scanner.lex();
            argument = parseAssignmentExpression();
        } else {
            if (!match(';') && !match('}') && !match(')') && scanner.lookahead.type !== Token.EOF) {
                argument = parseAssignmentExpression();
            }
        }
        state.allowYield = previousAllowYield;
    }

    return expr.finishYieldExpression(argument, delegate);
}

// ECMA-262 12.14 Assignment Operators

function parseAssignmentExpression() {
    if (!state.allowYield && matchKeyword('yield')) {
        return parseYieldExpression();
    }

    const startToken = scanner.lookahead;
    let token = startToken;
    let expr = parseConditionalExpression();

    if (expr.type === PlaceHolders.ArrowParameterPlaceHolder || match('=>')) {
        state.isAssignmentTarget = state.isBindingElement = false;
        const list = reinterpretAsCoverFormalsList(expr);

        if (list) {
            state.firstCoverInitializedNameError = null;
            return parseArrowFunctionExpression(list, new Node(startToken));
        }

        return expr;
    }

    if (matchAssign()) {
        if (!state.isAssignmentTarget) {
            tolerateError(Messages.InvalidLHSInAssignment);
        }

        // ECMA-262 12.1.1
        if (scanner.strict && expr.type === Syntax.Identifier) {
            if (scanner.isRestrictedWord(expr.name)) {
                tolerateUnexpectedToken(token, Messages.StrictLHSAssignment);
            }
            if (scanner.isStrictModeReservedWord(expr.name)) {
                tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            }
        }

        if (!match('=')) {
            state.isAssignmentTarget = state.isBindingElement = false;
        } else {
            reinterpretExpressionAsPattern(expr);
        }

        token = scanner.lex();
        const right = isolateCoverGrammar(parseAssignmentExpression);
        expr = new Node(startToken).finishAssignmentExpression(token.value, expr, right);
        state.firstCoverInitializedNameError = null;
    }

    return expr;
}

// ECMA-262 12.15 Comma Operator

function parseExpression() {
    const startToken = scanner.lookahead;
    let expr = isolateCoverGrammar(parseAssignmentExpression);

    if (match(',')) {
        let expressions = [expr];

        while (scanner.startIndex < scanner.length) {
            if (!match(',')) {
                break;
            }
            scanner.lex();
            expressions.push(isolateCoverGrammar(parseAssignmentExpression));
        }

        expr = new Node(startToken).finishSequenceExpression(expressions);
    }

    return expr;
}

// ECMA-262 13.2 Block

function parseStatementListItem() {
    if (scanner.lookahead.type === Token.Keyword) {
        switch (scanner.lookahead.value) {
            case 'export':
                if (state.sourceType !== 'module') {
                    tolerateUnexpectedToken(scanner.lookahead, Messages.IllegalExportDeclaration);
                }
                return parseExportDeclaration();
            case 'import':
                if (state.sourceType !== 'module') {
                    tolerateUnexpectedToken(scanner.lookahead, Messages.IllegalImportDeclaration);
                }
                return parseImportDeclaration();
            case 'const':
                return parseLexicalDeclaration({ inFor: false });
            case 'function':
                return parseFunctionDeclaration(new Node());
            case 'class':
                return parseClassDeclaration();
        }
    }

    if (matchKeyword('let') && isLexicalDeclaration()) {
        return parseLexicalDeclaration({ inFor: false });
    }

    return parseStatement();
}

function parseStatementList() {
    let list = [];
    while (scanner.startIndex < scanner.length) {
        if (match('}')) {
            break;
        }
        list.push(parseStatementListItem());
    }

    return list;
}

function parseBlock() {
    const node = new Node();

    expect('{');
    const block = parseStatementList();
    expect('}');

    return node.finishBlockStatement(block);
}

// ECMA-262 13.3.2 Variable Statement

function parseVariableIdentifier(kind?) {
    const node = new Node();
    const token = scanner.lex();

    if (token.type === Token.Keyword && token.value === 'yield') {
        if (scanner.strict) {
            tolerateUnexpectedToken(token, Messages.StrictReservedWord);
        } if (!state.allowYield) {
            throwUnexpectedToken(token);
        }
    } else if (token.type !== Token.Identifier) {
        if (scanner.strict && token.type === Token.Keyword && scanner.isStrictModeReservedWord(token.value)) {
            tolerateUnexpectedToken(token, Messages.StrictReservedWord);
        } else {
            if (scanner.strict || token.value !== 'let' || kind !== 'var') {
                throwUnexpectedToken(token);
            }
        }
    } else if (state.sourceType === 'module' && token.type === Token.Identifier && token.value === 'await') {
        tolerateUnexpectedToken(token);
    }

    return node.finishIdentifier(token.value);
}

function parseVariableDeclaration(options) {
    const node = new Node();

    let params = [];
    const id = parsePattern(params, 'var');

    // ECMA-262 12.2.1
    if (scanner.strict && scanner.isRestrictedWord(id.name)) {
        tolerateError(Messages.StrictVarName);
    }

    let init = null;
    if (match('=')) {
        scanner.lex();
        init = isolateCoverGrammar(parseAssignmentExpression);
    } else if (id.type !== Syntax.Identifier && !options.inFor) {
        expect('=');
    }

    return node.finishVariableDeclarator(id, init);
}

function parseVariableDeclarationList(options) {
    let list = [];
    do {
        list.push(parseVariableDeclaration({ inFor: options.inFor }));
        if (!match(',')) {
            break;
        }
        scanner.lex();
    } while (scanner.startIndex < scanner.length);

    return list;
}

function parseVariableStatement(node) {
    expectKeyword('var');
    const declarations = parseVariableDeclarationList({ inFor: false });
    consumeSemicolon();

    return node.finishVariableDeclaration(declarations);
}

// ECMA-262 13.3.1 Let and Const Declarations

function parseLexicalBinding(kind, options) {
    const node = new Node();
    let params = [];
    const id = parsePattern(params, kind);

    // ECMA-262 12.2.1
    if (scanner.strict && id.type === Syntax.Identifier && scanner.isRestrictedWord(id.name)) {
        tolerateError(Messages.StrictVarName);
    }

    let init = null;
    if (kind === 'const') {
        if (!matchKeyword('in') && !matchContextualKeyword('of')) {
            expect('=');
            init = isolateCoverGrammar(parseAssignmentExpression);
        }
    } else if ((!options.inFor && id.type !== Syntax.Identifier) || match('=')) {
        expect('=');
        init = isolateCoverGrammar(parseAssignmentExpression);
    }

    return node.finishVariableDeclarator(id, init);
}

function parseBindingList(kind, options) {
    let list = [];
    do {
        list.push(parseLexicalBinding(kind, options));
        if (!match(',')) {
            break;
        }
        scanner.lex();
    } while (scanner.startIndex < scanner.length);

    return list;
}

function isLexicalDeclaration() {
    // Prevent adding a duplicated token during the second look-ahead.
    const previousAddToken = scanner.addToken;
    scanner.addToken = null;

    scanner.pushState();
    scanner.lex();
    const lexical = (scanner.lookahead.type === Token.Identifier) || match('[') || match('{') ||
        matchKeyword('let') || matchKeyword('yield');
    scanner.popState();
    scanner.addToken = previousAddToken;

    return lexical;
}

function parseLexicalDeclaration(options) {
    const node = new Node();
    const kind = scanner.lex().value;
    assert(kind === 'let' || kind === 'const', 'Lexical declaration must be either let or const');

    const declarations = parseBindingList(kind, options);
    consumeSemicolon();

    return node.finishLexicalDeclaration(declarations, kind);
}

function parseRestElement(params) {
    const node = new Node();

    scanner.lex();
    if (match('{')) {
        throwError(Messages.ObjectPatternAsRestParameter);
    }

    params.push(scanner.lookahead);

    const param = parseVariableIdentifier();
    if (match('=')) {
        throwError(Messages.DefaultRestParameter);
    }

    if (!match(')')) {
        throwError(Messages.ParameterAfterRestParameter);
    }

    return node.finishRestElement(param);
}

// ECMA-262 13.4 Empty Statement

function parseEmptyStatement(node) {
    expect(';');
    return node.finishEmptyStatement();
}

// ECMA-262 12.4 Expression Statement

function parseExpressionStatement(node) {
    const expr = parseExpression();
    consumeSemicolon();
    return node.finishExpressionStatement(expr);
}

// ECMA-262 13.6 If statement

function parseIfStatement(node) {
    expectKeyword('if');
    expect('(');
    const test = parseExpression();
    expect(')');

    const consequent = parseStatement();
    let alternate = null;
    if (matchKeyword('else')) {
        scanner.lex();
        alternate = parseStatement();
    }

    return node.finishIfStatement(test, consequent, alternate);
}

// ECMA-262 13.7 Iteration Statements

function parseDoWhileStatement(node) {
    expectKeyword('do');

    const oldInIteration = state.inIteration;
    state.inIteration = true;
    const body = parseStatement();
    state.inIteration = oldInIteration;

    expectKeyword('while');
    expect('(');
    const test = parseExpression();
    expect(')');
    if (match(';')) {
        scanner.lex();
    }

    return node.finishDoWhileStatement(body, test);
}

function parseWhileStatement(node) {
    expectKeyword('while');

    expect('(');
    const test = parseExpression();
    expect(')');

    const oldInIteration = state.inIteration;
    state.inIteration = true;
    const body = parseStatement();
    state.inIteration = oldInIteration;

    return node.finishWhileStatement(test, body);
}

function parseForStatement(node) {
    let init = null;
    let test = null;
    let update = null;
    let forIn = true;
    let left, right;

    expectKeyword('for');
    expect('(');

    if (match(';')) {
        scanner.lex();
    } else {
        if (matchKeyword('var')) {
            init = new Node();
            scanner.lex();

            const previousAllowIn = state.allowIn;
            state.allowIn = false;
            let declarations = parseVariableDeclarationList({ inFor: true });
            state.allowIn = previousAllowIn;

            if (declarations.length === 1 && matchKeyword('in')) {
                init = init.finishVariableDeclaration(declarations);
                scanner.lex();
                left = init;
                right = parseExpression();
                init = null;
            } else if (declarations.length === 1 && declarations[0].init === null && matchContextualKeyword('of')) {
                init = init.finishVariableDeclaration(declarations);
                scanner.lex();
                left = init;
                right = parseAssignmentExpression();
                init = null;
                forIn = false;
            } else {
                init = init.finishVariableDeclaration(declarations);
                expect(';');
            }
        } else if (matchKeyword('const') || matchKeyword('let')) {
            init = new Node();
            const kind = scanner.lex().value;

            if (!scanner.strict && scanner.lookahead.value === 'in') {
                init = init.finishIdentifier(kind);
                scanner.lex();
                left = init;
                right = parseExpression();
                init = null;
            } else {
                const previousAllowIn = state.allowIn;
                state.allowIn = false;
                const declarations = parseBindingList(kind, { inFor: true });
                state.allowIn = previousAllowIn;

                if (declarations.length === 1 && declarations[0].init === null && matchKeyword('in')) {
                    init = init.finishLexicalDeclaration(declarations, kind);
                    scanner.lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (declarations.length === 1 && declarations[0].init === null && matchContextualKeyword('of')) {
                    init = init.finishLexicalDeclaration(declarations, kind);
                    scanner.lex();
                    left = init;
                    right = parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    consumeSemicolon();
                    init = init.finishLexicalDeclaration(declarations, kind);
                }
            }
        } else {
            const initStartToken = scanner.lookahead;
            const previousAllowIn = state.allowIn;
            state.allowIn = false;
            init = inheritCoverGrammar(parseAssignmentExpression);
            state.allowIn = previousAllowIn;

            if (matchKeyword('in')) {
                if (!state.isAssignmentTarget) {
                    tolerateError(Messages.InvalidLHSInForIn);
                }

                scanner.lex();
                reinterpretExpressionAsPattern(init);
                left = init;
                right = parseExpression();
                init = null;
            } else if (matchContextualKeyword('of')) {
                if (!state.isAssignmentTarget) {
                    tolerateError(Messages.InvalidLHSInForLoop);
                }

                scanner.lex();
                reinterpretExpressionAsPattern(init);
                left = init;
                right = parseAssignmentExpression();
                init = null;
                forIn = false;
            } else {
                if (match(',')) {
                    let initSeq = [init];
                    while (match(',')) {
                        scanner.lex();
                        initSeq.push(isolateCoverGrammar(parseAssignmentExpression));
                    }
                    init = new Node(initStartToken).finishSequenceExpression(initSeq);
                }
                expect(';');
            }
        }
    }

    if (typeof left === 'undefined') {

        if (!match(';')) {
            test = parseExpression();
        }
        expect(';');

        if (!match(')')) {
            update = parseExpression();
        }
    }

    expect(')');

    const oldInIteration = state.inIteration;
    state.inIteration = true;
    const body = isolateCoverGrammar(parseStatement);
    state.inIteration = oldInIteration;

    return (typeof left === 'undefined') ?
        node.finishForStatement(init, test, update, body) :
        forIn ? node.finishForInStatement(left, right, body) :
            node.finishForOfStatement(left, right, body);
}

// ECMA-262 13.8 The continue statement

function parseContinueStatement(node) {
    expectKeyword('continue');

    // Optimize the most common form: 'continue;'.
    if (scanner.source.charCodeAt(scanner.startIndex) === 0x3B) {
        scanner.lex();

        if (!state.inIteration) {
            throwError(Messages.IllegalContinue);
        }

        return node.finishContinueStatement(null);
    }

    if (scanner.hasLineTerminator) {
        if (!state.inIteration) {
            throwError(Messages.IllegalContinue);
        }

        return node.finishContinueStatement(null);
    }

    let label = null;
    if (scanner.lookahead.type === Token.Identifier) {
        label = parseVariableIdentifier();

        const key = '$' + label.name;
        if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
            throwError(Messages.UnknownLabel, label.name);
        }
    }

    consumeSemicolon();

    if (label === null && !state.inIteration) {
        throwError(Messages.IllegalContinue);
    }

    return node.finishContinueStatement(label);
}

// ECMA-262 13.9 The break statement

function parseBreakStatement(node) {
    expectKeyword('break');

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (scanner.source.charCodeAt(scanner.lastIndex) === 0x3B) {
        scanner.lex();

        if (!(state.inIteration || state.inSwitch)) {
            throwError(Messages.IllegalBreak);
        }

        return node.finishBreakStatement(null);
    }

    let label = null;
    if (scanner.hasLineTerminator) {
        if (!(state.inIteration || state.inSwitch)) {
            throwError(Messages.IllegalBreak);
        }
    } else if (scanner.lookahead.type === Token.Identifier) {
        label = parseVariableIdentifier();

        const key = '$' + label.name;
        if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
            throwError(Messages.UnknownLabel, label.name);
        }
    }

    consumeSemicolon();

    if (label === null && !(state.inIteration || state.inSwitch)) {
        throwError(Messages.IllegalBreak);
    }

    return node.finishBreakStatement(label);
}

// ECMA-262 13.10 The return statement

function parseReturnStatement(node) {
    expectKeyword('return');

    if (!state.inFunctionBody) {
        tolerateError(Messages.IllegalReturn);
    }

    if (scanner.hasLineTerminator) {
        // HACK
        return node.finishReturnStatement(null);
    }

    let argument = null;
    if (!match(';')) {
        if (!match('}') && scanner.lookahead.type !== Token.EOF) {
            argument = parseExpression();
        }
    }

    consumeSemicolon();

    return node.finishReturnStatement(argument);
}

// ECMA-262 13.11 The with statement

function parseWithStatement(node) {
    if (scanner.strict) {
        tolerateError(Messages.StrictModeWith);
    }

    expectKeyword('with');
    expect('(');
    const object = parseExpression();
    expect(')');

    const body = parseStatement();
    return node.finishWithStatement(object, body);
}

// ECMA-262 13.12 The switch statement

function parseSwitchCase() {
    const node = new Node();

    let test;
    if (matchKeyword('default')) {
        scanner.lex();
        test = null;
    } else {
        expectKeyword('case');
        test = parseExpression();
    }
    expect(':');

    let consequent = [];
    while (scanner.startIndex < scanner.length) {
        if (match('}') || matchKeyword('default') || matchKeyword('case')) {
            break;
        }
        const statement = parseStatementListItem();
        consequent.push(statement);
    }

    return node.finishSwitchCase(test, consequent);
}

function parseSwitchStatement(node) {
    expectKeyword('switch');

    expect('(');
    const discriminant = parseExpression();
    expect(')');

    let cases = [];
    expect('{');
    if (match('}')) {
        scanner.lex();
        return node.finishSwitchStatement(discriminant, cases);
    }

    const oldInSwitch = state.inSwitch;
    state.inSwitch = true;

    let defaultFound = false;
    while (scanner.startIndex < scanner.length) {
        if (match('}')) {
            break;
        }
        const clause = parseSwitchCase();
        if (clause.test === null) {
            if (defaultFound) {
                throwError(Messages.MultipleDefaultsInSwitch);
            }
            defaultFound = true;
        }
        cases.push(clause);
    }

    state.inSwitch = oldInSwitch;

    expect('}');

    return node.finishSwitchStatement(discriminant, cases);
}

// ECMA-262 13.14 The throw statement

function parseThrowStatement(node) {
    expectKeyword('throw');

    if (scanner.hasLineTerminator) {
        throwError(Messages.NewlineAfterThrow);
    }

    const argument = parseExpression();
    consumeSemicolon();

    return node.finishThrowStatement(argument);
}

// ECMA-262 13.15 The try statement

function parseCatchClause() {
    const node = new Node();

    expectKeyword('catch');

    expect('(');
    if (match(')')) {
        throwUnexpectedToken(scanner.lookahead);
    }

    let params = [];
    const param = parsePattern(params);
    let paramMap = {};
    for (let i = 0; i < params.length; i++) {
        const key = '$' + params[i].value;
        if (Object.prototype.hasOwnProperty.call(paramMap, key)) {
            tolerateError(Messages.DuplicateBinding, params[i].value);
        }
        paramMap[key] = true;
    }

    // ECMA-262 12.14.1
    if (scanner.strict && scanner.isRestrictedWord(param.name)) {
        tolerateError(Messages.StrictCatchVariable);
    }

    expect(')');

    const body = parseBlock();
    return node.finishCatchClause(param, body);
}

function parseTryStatement(node) {
    expectKeyword('try');

    const block = parseBlock();
    let handler = null;
    let finalizer = null;

    if (matchKeyword('catch')) {
        handler = parseCatchClause();
    }

    if (matchKeyword('finally')) {
        scanner.lex();
        finalizer = parseBlock();
    }

    if (!handler && !finalizer) {
        throwError(Messages.NoCatchOrFinally);
    }

    return node.finishTryStatement(block, handler, finalizer);
}

// ECMA-262 13.16 The debugger statement

function parseDebuggerStatement(node) {
    expectKeyword('debugger');
    consumeSemicolon();
    return node.finishDebuggerStatement();
}

// 13 Statements

function parseStatement() {
    const type = scanner.lookahead.type;

    if (type === Token.EOF) {
        throwUnexpectedToken(scanner.lookahead);
    }

    if (type === Token.Punctuator && scanner.lookahead.value === '{') {
        return parseBlock();
    }
    state.isAssignmentTarget = state.isBindingElement = true;
    const node = new Node();

    if (type === Token.Punctuator) {
        switch (scanner.lookahead.value) {
            case ';':
                return parseEmptyStatement(node);
            case '(':
                return parseExpressionStatement(node);
            default:
                break;
        }
    } else if (type === Token.Keyword) {
        switch (scanner.lookahead.value) {
            case 'break':
                return parseBreakStatement(node);
            case 'continue':
                return parseContinueStatement(node);
            case 'debugger':
                return parseDebuggerStatement(node);
            case 'do':
                return parseDoWhileStatement(node);
            case 'for':
                return parseForStatement(node);
            case 'function':
                return parseFunctionDeclaration(node);
            case 'if':
                return parseIfStatement(node);
            case 'return':
                return parseReturnStatement(node);
            case 'switch':
                return parseSwitchStatement(node);
            case 'throw':
                return parseThrowStatement(node);
            case 'try':
                return parseTryStatement(node);
            case 'var':
                return parseVariableStatement(node);
            case 'while':
                return parseWhileStatement(node);
            case 'with':
                return parseWithStatement(node);
            default:
                break;
        }
    }

    const expr = parseExpression();

    // ECMA-262 12.12 Labelled Statements
    if ((expr.type === Syntax.Identifier) && match(':')) {
        scanner.lex();

        const key = '$' + expr.name;
        if (Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
            throwError(Messages.Redeclaration, 'Label', expr.name);
        }

        state.labelSet[key] = true;
        const labeledBody = parseStatement();
        delete state.labelSet[key];
        return node.finishLabeledStatement(expr, labeledBody);
    }

    consumeSemicolon();

    return node.finishExpressionStatement(expr);
}

// ECMA-262 14.1 Function Definition

function parseFunctionSourceElements() {
    const node = new Node();

    expect('{');

    let firstRestricted = null;
    let body = [];
    while (scanner.startIndex < scanner.length) {
        if (scanner.lookahead.type !== Token.StringLiteral) {
            break;
        }
        const token = scanner.lookahead;

        let statement = parseStatementListItem();
        body.push(statement);
        if (statement.expression.type !== Syntax.Literal) {
            // this is not directive
            break;
        }
        const directive = scanner.source.slice(token.start + 1, token.end - 1);
        if (directive === 'use strict') {
            scanner.strict = true;
            if (firstRestricted) {
                tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
            }
        } else {
            if (!firstRestricted && token.octal) {
                firstRestricted = token;
            }
        }
    }

    const oldLabelSet = state.labelSet;
    const oldInIteration = state.inIteration;
    const oldInSwitch = state.inSwitch;
    const oldInFunctionBody = state.inFunctionBody;
    const oldParenthesisCount = state.parenthesizedCount;

    state.labelSet = {};
    state.inIteration = false;
    state.inSwitch = false;
    state.inFunctionBody = true;
    state.parenthesizedCount = 0;

    while (scanner.startIndex < scanner.length) {
        if (match('}')) {
            break;
        }
        body.push(parseStatementListItem());
    }

    expect('}');

    state.labelSet = oldLabelSet;
    state.inIteration = oldInIteration;
    state.inSwitch = oldInSwitch;
    state.inFunctionBody = oldInFunctionBody;
    state.parenthesizedCount = oldParenthesisCount;

    return node.finishBlockStatement(body);
}

function validateParam(options, param, name) {
    const key = '$' + name;
    if (scanner.strict) {
        if (scanner.isRestrictedWord(name)) {
            options.stricted = param;
            options.message = Messages.StrictParamName;
        }
        if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
            options.stricted = param;
            options.message = Messages.StrictParamDupe;
        }
    } else if (!options.firstRestricted) {
        if (scanner.isRestrictedWord(name)) {
            options.firstRestricted = param;
            options.message = Messages.StrictParamName;
        } else if (scanner.isStrictModeReservedWord(name)) {
            options.firstRestricted = param;
            options.message = Messages.StrictReservedWord;
        } else if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
            options.stricted = param;
            options.message = Messages.StrictParamDupe;
        }
    }
    options.paramSet[key] = true;
}

function parseParam(options) {
    let param;
    let params = [];

    const token = scanner.lookahead;
    if (token.value === '...') {
        param = parseRestElement(params);
        validateParam(options, param.argument, param.argument.name);
        options.params.push(param);
        options.defaults.push(null);
        return false;
    }

    param = parsePatternWithDefault(params);
    for (let i = 0; i < params.length; i++) {
        validateParam(options, params[i], params[i].value);
    }

    let def;
    if (param.type === Syntax.AssignmentPattern) {
        def = param.right;
        param = param.left;
        ++options.defaultCount;
    }

    options.params.push(param);
    options.defaults.push(def);

    return !match(')');
}

function parseParams(firstRestricted?) {
    let options;

    options = {
        params: [],
        defaultCount: 0,
        defaults: [],
        firstRestricted: firstRestricted
    };

    expect('(');
    if (!match(')')) {
        options.paramSet = {};
        while (scanner.startIndex < scanner.length) {
            if (!parseParam(options)) {
                break;
            }
            expect(',');
        }
    }
    expect(')');

    if (options.defaultCount === 0) {
        options.defaults = [];
    }

    return {
        params: options.params,
        defaults: options.defaults,
        stricted: options.stricted,
        firstRestricted: options.firstRestricted,
        message: options.message
    };
}

function parseFunctionDeclaration(node, identifierIsOptional?) {
    expectKeyword('function');

    const isGenerator = match('*');
    if (isGenerator) {
        scanner.lex();
    }

    let message;
    let id = null;
    let firstRestricted = null;

    if (!identifierIsOptional || !match('(')) {
        const token = scanner.lookahead;
        id = parseVariableIdentifier();
        if (scanner.strict) {
            if (scanner.isRestrictedWord(token.value)) {
                tolerateUnexpectedToken(token, Messages.StrictFunctionName);
            }
        } else {
            if (scanner.isRestrictedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictFunctionName;
            } else if (scanner.isStrictModeReservedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictReservedWord;
            }
        }
    }

    const previousAllowYield = state.allowYield;
    state.allowYield = !isGenerator;

    const tmp = parseParams(firstRestricted);
    const params = tmp.params;
    const defaults = tmp.defaults;
    const stricted = tmp.stricted;
    firstRestricted = tmp.firstRestricted;
    if (tmp.message) {
        message = tmp.message;
    }

    const previousStrict = scanner.strict;
    const body = parseFunctionSourceElements();
    if (scanner.strict && firstRestricted) {
        throwUnexpectedToken(firstRestricted, message);
    }
    if (scanner.strict && stricted) {
        tolerateUnexpectedToken(stricted, message);
    }

    scanner.strict = previousStrict;
    state.allowYield = previousAllowYield;

    return node.finishFunctionDeclaration(id, params, defaults, body, isGenerator);
}

function parseFunctionExpression() {
    const node = new Node();

    expectKeyword('function');

    const isGenerator = match('*');
    if (isGenerator) {
        scanner.lex();
    }

    let message;
    let id = null;
    let firstRestricted;

    const previousAllowYield = state.allowYield;
    state.allowYield = !isGenerator;

    if (!match('(')) {
        const token = scanner.lookahead;
        id = (!scanner.strict && !isGenerator && matchKeyword('yield')) ? parseNonComputedProperty() : parseVariableIdentifier();
        if (scanner.strict) {
            if (scanner.isRestrictedWord(token.value)) {
                tolerateUnexpectedToken(token, Messages.StrictFunctionName);
            }
        } else {
            if (scanner.isRestrictedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictFunctionName;
            } else if (scanner.isStrictModeReservedWord(token.value)) {
                firstRestricted = token;
                message = Messages.StrictReservedWord;
            }
        }
    }

    const tmp = parseParams(firstRestricted);
    const params = tmp.params;
    const defaults = tmp.defaults;
    const stricted = tmp.stricted;
    firstRestricted = tmp.firstRestricted;
    if (tmp.message) {
        message = tmp.message;
    }

    const previousStrict = scanner.strict;
    const body = parseFunctionSourceElements();
    if (scanner.strict && firstRestricted) {
        throwUnexpectedToken(firstRestricted, message);
    }
    if (scanner.strict && stricted) {
        tolerateUnexpectedToken(stricted, message);
    }
    scanner.strict = previousStrict;
    state.allowYield = previousAllowYield;

    return node.finishFunctionExpression(id, params, defaults, body, isGenerator);
}

// ECMA-262 14.5 Class Definitions

function parseClassBody() {
    const node = new Node();
    let hasConstructor = false;
    let body = [];

    expect('{');
    while (!match('}')) {
        if (match(';')) {
            scanner.lex();
        } else {
            let method = new Node();
            let token = scanner.lookahead;
            let isStatic = false;
            let computed = match('[');
            let key;

            if (match('*')) {
                scanner.lex();
            } else {
                key = parseObjectPropertyKey();
                if (key.name === 'static' && (lookaheadPropertyName() || match('*'))) {
                    token = scanner.lookahead;
                    isStatic = true;
                    computed = match('[');
                    if (match('*')) {
                        scanner.lex();
                    } else {
                        key = parseObjectPropertyKey();
                    }
                }
            }
            method = tryParseMethodDefinition(token, key, computed, method);
            if (method) {
                method.static = isStatic;
                if (method.kind === 'init') {
                    method.kind = 'method';
                }
                if (!isStatic) {
                    if (!method.computed && (method.key.name || method.key.value.toString()) === 'constructor') {
                        if (method.kind !== 'method' || !method.method || method.value.generator) {
                            throwUnexpectedToken(token, Messages.ConstructorSpecialMethod);
                        }
                        if (hasConstructor) {
                            throwUnexpectedToken(token, Messages.DuplicateConstructor);
                        } else {
                            hasConstructor = true;
                        }
                        method.kind = 'constructor';
                    }
                } else {
                    if (!method.computed && (method.key.name || method.key.value.toString()) === 'prototype') {
                        throwUnexpectedToken(token, Messages.StaticPrototype);
                    }
                }
                method.type = Syntax.MethodDefinition;
                delete method.method;
                delete method.shorthand;
                body.push(method);
            } else {
                throwUnexpectedToken(scanner.lookahead);
            }
        }
    }
    expect('}');

    return node.finishClassBody(body);
}

function parseClassDeclaration(identifierIsOptional?) {
    const node = new Node();

    const previousStrict = scanner.strict;
    scanner.strict = true;

    expectKeyword('class');

    let id = null;
    if (!identifierIsOptional || scanner.lookahead.type === Token.Identifier) {
        id = parseVariableIdentifier();
    }

    let superClass = null;
    if (matchKeyword('extends')) {
        scanner.lex();
        superClass = isolateCoverGrammar(parseLeftHandSideExpressionAllowCall);
    }
    const classBody = parseClassBody();
    scanner.strict = previousStrict;

    return node.finishClassDeclaration(id, superClass, classBody);
}

function parseClassExpression() {
    const node = new Node();

    const previousStrict = scanner.strict;
    scanner.strict = true;

    expectKeyword('class');

    let id = null;
    if (scanner.lookahead.type === Token.Identifier) {
        id = parseVariableIdentifier();
    }

    let superClass = null;
    if (matchKeyword('extends')) {
        scanner.lex();
        superClass = isolateCoverGrammar(parseLeftHandSideExpressionAllowCall);
    }
    const classBody = parseClassBody();
    scanner.strict = previousStrict;

    return node.finishClassExpression(id, superClass, classBody);
}

// ECMA-262 15.2 Modules

function parseModuleSpecifier() {
    const node = new Node();

    if (scanner.lookahead.type !== Token.StringLiteral) {
        throwError(Messages.InvalidModuleSpecifier);
    }
    return node.finishLiteral(scanner.lex());
}

// ECMA-262 15.2.3 Exports

function parseExportSpecifier() {
    const node = new Node();
    let local, exported;
    if (matchKeyword('default')) {
        // export {default} from 'something';
        let def = new Node();
        scanner.lex();
        local = def.finishIdentifier('default');
    } else {
        local = parseVariableIdentifier();
    }
    if (matchContextualKeyword('as')) {
        scanner.lex();
        exported = parseNonComputedProperty();
    }
    return node.finishExportSpecifier(local, exported);
}

function parseExportNamedDeclaration(node) {
    let src = null;
    let specifiers = [];

    // non-default export
    if (scanner.lookahead.type === Token.Keyword) {
        // covers:
        // export var f = 1;
        let declaration;
        switch (scanner.lookahead.value) {
            case 'let':
            case 'const':
                declaration = parseLexicalDeclaration({ inFor: false });
                return node.finishExportNamedDeclaration(declaration, specifiers, null);
            case 'var':
            case 'class':
            case 'function':
                declaration = parseStatementListItem();
                return node.finishExportNamedDeclaration(declaration, specifiers, null);
        }
    }

    let isExportFromIdentifier = false;

    expect('{');
    while (!match('}')) {
        isExportFromIdentifier = isExportFromIdentifier || matchKeyword('default');
        specifiers.push(parseExportSpecifier());
        if (!match('}')) {
            expect(',');
            if (match('}')) {
                break;
            }
        }
    }
    expect('}');

    if (matchContextualKeyword('from')) {
        // covering:
        // export {default} from 'foo';
        // export {foo} from 'foo';
        scanner.lex();
        src = parseModuleSpecifier();
        consumeSemicolon();
    } else if (isExportFromIdentifier) {
        // covering:
        // export {default}; // missing fromClause
        throwError(scanner.lookahead.value ?
            Messages.UnexpectedToken : Messages.MissingFromClause, scanner.lookahead.value);
    } else {
        // cover
        // export {foo};
        consumeSemicolon();
    }
    return node.finishExportNamedDeclaration(null, specifiers, src);
}

function parseExportDefaultDeclaration(node) {
    // covers:
    // export default ...
    expectKeyword('default');

    if (matchKeyword('function')) {
        // covers:
        // export default function foo () {}
        // export default function () {}
        let declaration = parseFunctionDeclaration(new Node(), true);
        return node.finishExportDefaultDeclaration(declaration);
    }
    if (matchKeyword('class')) {
        let declaration = parseClassDeclaration(true);
        return node.finishExportDefaultDeclaration(declaration);
    }

    if (matchContextualKeyword('from')) {
        throwError(Messages.UnexpectedToken, scanner.lookahead.value);
    }

    // covers:
    // export default {};
    // export default [];
    // export default (1 + 2);
    let expression = null;
    if (match('{')) {
        expression = parseObjectInitializer();
    } else if (match('[')) {
        expression = parseArrayInitializer();
    } else {
        expression = parseAssignmentExpression();
    }
    consumeSemicolon();
    return node.finishExportDefaultDeclaration(expression);
}

function parseExportAllDeclaration(node) {
    // covers:
    // export * from 'foo';
    expect('*');
    if (!matchContextualKeyword('from')) {
        throwError(scanner.lookahead.value ?
            Messages.UnexpectedToken : Messages.MissingFromClause, scanner.lookahead.value);
    }
    scanner.lex();
    const src = parseModuleSpecifier();
    consumeSemicolon();

    return node.finishExportAllDeclaration(src);
}

function parseExportDeclaration() {
    const node = new Node();
    if (state.inFunctionBody) {
        throwError(Messages.IllegalExportDeclaration);
    }

    expectKeyword('export');

    if (matchKeyword('default')) {
        return parseExportDefaultDeclaration(node);
    }
    if (match('*')) {
        return parseExportAllDeclaration(node);
    }
    return parseExportNamedDeclaration(node);
}

// ECMA-262 15.2.2 Imports

function parseImportSpecifier() {
    // import {<foo as bar>} ...;
    const node = new Node();

    let local;
    const imported = parseNonComputedProperty();
    if (matchContextualKeyword('as')) {
        scanner.lex();
        local = parseVariableIdentifier();
    }

    return node.finishImportSpecifier(local, imported);
}

function parseNamedImports() {
    let specifiers = [];
    // {foo, bar as bas}
    expect('{');
    while (!match('}')) {
        specifiers.push(parseImportSpecifier());
        if (!match('}')) {
            expect(',');
            if (match('}')) {
                break;
            }
        }
    }
    expect('}');
    return specifiers;
}

function parseImportDefaultSpecifier() {
    // import <foo> ...;
    const node = new Node();
    const local = parseNonComputedProperty();
    return node.finishImportDefaultSpecifier(local);
}

function parseImportNamespaceSpecifier() {
    // import <* as foo> ...;
    const node = new Node();

    expect('*');
    if (!matchContextualKeyword('as')) {
        throwError(Messages.NoAsAfterImportNamespace);
    }
    scanner.lex();
    const local = parseNonComputedProperty();

    return node.finishImportNamespaceSpecifier(local);
}

function parseImportDeclaration() {
    if (state.inFunctionBody) {
        throwError(Messages.IllegalImportDeclaration);
    }

    const node = new Node();
    expectKeyword('import');

    let src;
    let specifiers = [];

    if (scanner.lookahead.type === Token.StringLiteral) {
        // import 'foo';
        src = parseModuleSpecifier();
    } else {

        if (match('{')) {
            // import {bar}
            specifiers = specifiers.concat(parseNamedImports());
        } else if (match('*')) {
            // import * as foo
            specifiers.push(parseImportNamespaceSpecifier());
        } else if (isIdentifierName(scanner.lookahead) && !matchKeyword('default')) {
            // import foo
            specifiers.push(parseImportDefaultSpecifier());
            if (match(',')) {
                scanner.lex();
                if (match('*')) {
                    // import foo, * as foo
                    specifiers.push(parseImportNamespaceSpecifier());
                } else if (match('{')) {
                    // import foo, {bar}
                    specifiers = specifiers.concat(parseNamedImports());
                } else {
                    throwUnexpectedToken(scanner.lookahead);
                }
            }
        } else {
            throwUnexpectedToken(scanner.lex());
        }

        if (!matchContextualKeyword('from')) {
            throwError(scanner.lookahead.value ?
                Messages.UnexpectedToken : Messages.MissingFromClause, scanner.lookahead.value);
        }
        scanner.lex();
        src = parseModuleSpecifier();
    }

    consumeSemicolon();
    return node.finishImportDeclaration(specifiers, src);
}

// ECMA-262 15.1 Scripts

function parseScriptBody() {
    let body = [];

    let firstRestricted = null;
    while (scanner.startIndex < scanner.length) {
        const token = scanner.lookahead;
        if (token.type !== Token.StringLiteral) {
            break;
        }

        let statement = parseStatementListItem();
        body.push(statement);
        if (statement.expression.type !== Syntax.Literal) {
            // this is not directive
            break;
        }
        const directive = scanner.source.slice(token.start + 1, token.end - 1);
        if (directive === 'use strict') {
            scanner.strict = true;
            if (firstRestricted) {
                tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
            }
        } else {
            if (!firstRestricted && token.octal) {
                firstRestricted = token;
            }
        }
    }

    while (scanner.startIndex < scanner.length) {
        let statement = parseStatementListItem();
        /* istanbul ignore if */
        if (typeof statement === 'undefined') {
            break;
        }
        body.push(statement);
    }
    return body;
}

function parseProgram() {
    const node = new Node();
    const body = parseScriptBody();
    return node.finishProgram(body, state.sourceType);
}

function addComment(type, value, start, end, loc) {
    let comment;

    assert(typeof start === 'number', 'Comment must have valid position');

    state.lastCommentStart = start;

    comment = {
        type: type,
        value: value
    };
    if (options.range) {
        comment.range = [start, end];
    }
    if (options.loc) {
        comment.loc = loc;
    }
    state.comments.push(comment);
    if (options.attachComment) {
        state.leadingComments.push(comment);
        state.trailingComments.push(comment);
    }
    if (state.tokenizeOnly) {
        comment.type = comment.type + 'Comment';
        if (state.delegate) {
            comment = state.delegate(comment);
        }
        state.tokens.push(comment);
    }
}

function markBracket(type) {
    switch (type) {
        case '{':
            state.openCurlyToken = state.tokenValues.length;
            break;
        case '(':
            state.openParenToken = state.tokenValues.length;
            break;
        /* istanbul ignore next */
        default:
            break;
    }
}

let TokenName = {};
TokenName[Token.BooleanLiteral] = 'Boolean';
TokenName[Token.EOF] = '<end>';
TokenName[Token.Identifier] = 'Identifier';
TokenName[Token.Keyword] = 'Keyword';
TokenName[Token.NullLiteral] = 'Null';
TokenName[Token.NumericLiteral] = 'Numeric';
TokenName[Token.Punctuator] = 'Punctuator';
TokenName[Token.StringLiteral] = 'String';
TokenName[Token.RegularExpression] = 'RegularExpression';
TokenName[Token.Template] = 'Template';

function addToken(token) {
    let entry;
    if (token.type !== Token.EOF) {
        entry = {
            type: TokenName[token.type],
            value: scanner.source.slice(token.start, token.end),
            range: [token.start, token.end],
            loc: {
                start: {
                    line: scanner.startLineNumber,
                    column: scanner.startIndex - scanner.startLineStart
                },
                end: {
                    line: scanner.lineNumber,
                    column: scanner.index - scanner.lineStart
                }
            }
        };
        if (token.regex) {
            entry.regex = {
                pattern: token.regex.pattern,
                flags: token.regex.flags
            };
        }
        if (state.tokenizeOnly) {
            state.tokenValues.push((entry.type === 'Punctuator' || entry.type === 'Keyword') ? entry.value : null);
            if (!options.range) {
                delete entry.range;
            }
            if (!options.loc) {
                delete entry.loc;
            }
            if (state.delegate) {
                entry = state.delegate(entry);
            }
        }
        state.tokens.push(entry);
    }
}

function filterTokenLocation(tokens) {
    let result = [];
    for (let i = 0; i < tokens.length; ++i) {
        let token;
        const entry = tokens[i];
        token = {
            type: entry.type,
            value: entry.value
        };
        if (entry.regex) {
            token.regex = {
                pattern: entry.regex.pattern,
                flags: entry.regex.flags
            };
        }
        if (options.range) {
            token.range = entry.range;
        }
        if (options.loc) {
            token.loc = entry.loc;
        }
        result.push(token);
    }

    return result;
}

function initialize(code: string, opt: any, delegate: any): void {
    options = {
        range: false,
        loc: false,
        source: null,
        tokens: false,
        comment: false,
        attachComment: false,
        tolerant: false,
        sourceType: 'script'
    };

    if (typeof opt !== 'undefined') {
        options = {
            range: (typeof opt.range === 'boolean') && opt.range,
            loc: (typeof opt.loc === 'boolean') && opt.loc,
            tokens: (typeof opt.tokens === 'boolean' && opt.tokens),
            comment: (typeof opt.comment === 'boolean' && opt.comment),
            attachComment: (typeof opt.attachComment === 'boolean') && opt.attachComment,
            tolerant: (typeof opt.tolerant === 'boolean' && opt.tolerant),
            sourceType: (opt.sourceType === 'module') ? 'module' : 'script'
        };
        if (options.loc && opt.source !== null && opt.source !== undefined) {
            options.source = String(opt.source);
        }
    }

    delegate.addComment = (options.comment) ? addComment : delegate.addComment;
    delegate.throwUnexpectedToken = throwUnexpectedToken;
    delegate.tolerateUnexpectedToken = tolerateUnexpectedToken;

    scanner = new Scanner(code, delegate);
    scanner.addToken = (options.tokens) ? addToken : scanner.addToken;

    state = {
        allowIn: true,
        allowYield: true,
        comments: [],
        errors: [],
        firstCoverInitializedNameError: null,
        isAssignmentTarget: false,
        isBindingElement: false,
        labelSet: {},
        inFunctionBody: false,
        inIteration: false,
        inSwitch: false,
        lastCommentStart: -1,
        openCurlyToken: -1,
        openParenToken: -1,
        source: null,
        sourceType: 'script',
        tokenizeOnly: false,
        tokens: [],
        tokenValues: []
    };

    state.sourceType = options.sourceType;
    scanner.strict = (options.sourceType === 'module');

    if (options.attachComment) {
        options.range = true;
        state.bottomRightStack = [];
        state.trailingComments = [];
        state.leadingComments = [];
    }
}

export function tokenize(code: string, opt, delegate) {
    initialize(code, opt, {});

    options.tokens = true;
    state.tokenizeOnly = true;
    state.delegate = delegate;
    scanner.addToken = addToken;
    scanner.markBracket = markBracket;
    scanner.handleSlash = advanceSlash;

    scanner.start();
    if (scanner.lookahead.type === Token.EOF) {
        return state.tokens;
    }

    scanner.lex();
    while (!scanner.eof()) {
        try {
            scanner.lex();
        } catch (lexError) {
            if (options.tolerant) {
                recordError(lexError);
                // We have to break on the first error
                // to avoid infinite loops.
                break;
            } else {
                throw lexError;
            }
        }
    }

    const tokens = state.tokens;
    tokens.errors = state.errors;

    return tokens;
}

export function parse(code: string, opt) {
    initialize(code, opt, {});

    scanner.start();
    const program = parseProgram();
    if (options.comment) {
        program.comments = state.comments;
    }
    if (options.tokens) {
        program.tokens = filterTokenLocation(state.tokens);
    }
    if (options.tolerant) {
        program.errors = state.errors;
    }

    return program;
}
