import { assert } from './assert';
import { Messages} from './messages';

import { ErrorHandler } from './error-handler';
import { Token, TokenName } from './token';
import { Syntax } from './syntax';

import { Comment, Scanner } from './scanner';

let scanner: Scanner;
let errorHandler: ErrorHandler;
let options, state;

let PlaceHolders = {
    ArrowParameterPlaceHolder: 'ArrowParameterPlaceHolder'
};

function collectComments() {
    state.scanning = true;
    const comments: Comment[] = scanner.scanComments();
    state.scanning = false;

    if (options.comment && comments.length > 0) {
        for (let i = 0; i < comments.length; ++i) {
            const e: Comment = comments[i];
            let comment;
            let value = scanner.source.slice(e.slice[0], e.slice[1]);
            comment = {
                type: e.multiLine ? 'Block' : 'Line',
                value: value
            };
            if (options.range) {
                comment.range = e.range;
            }
            if (options.loc) {
                comment.loc = e.loc;
            }
            state.comments.push(comment);
            if (options.attachComment) {
                state.leadingComments.push(comment);
                state.trailingComments.push(comment);
            }
        }
    }
}

// From internal representation to an external structure
function convertToken(token) {
    return {
        type: TokenName[token.type],
        value: scanner.source.slice(token.start, token.end),
        range: [token.start, token.end],
        loc: {
            start: {
                line: state.startLineNumber,
                column: state.startIndex - state.startLineStart
            },
            end: {
                line: scanner.lineNumber,
                column: scanner.index - scanner.lineStart
            }
        },
        regex: token.regex
    };
}

function nextToken() {
    const token = state.lookahead;

    state.lastIndex = scanner.index;
    state.lastLineNumber = scanner.lineNumber;
    state.lastLineStart = scanner.lineStart;

    collectComments();

    state.startIndex = scanner.index;
    state.startLineNumber = scanner.lineNumber;
    state.startLineStart = scanner.lineStart;

    let next;
    state.scanning = true;
    next = scanner.lex();
    state.hasLineTerminator = (token && next) ? (token.lineNumber !== next.lineNumber) : false;
    state.scanning = false;

    if (next && state.strict && next.type === Token.Identifier) {
        if (scanner.isStrictModeReservedWord(next.value)) {
            next.type = Token.Keyword;
        }
    }
    state.lookahead = next;

    if (options.tokens && next.type !== Token.EOF) {
        state.tokens.push(convertToken(next));
    }

    return token;
}

function nextRegexToken() {
    let pos, loc;

    if (options.tokens) {
        collectComments();

        pos = scanner.index;
        loc = {
            start: {
                line: scanner.lineNumber,
                column: scanner.index - scanner.lineStart
            },
            end: {}
        };
    }

    state.scanning = true;
    const token = scanner.scanRegExp();
    state.scanning = false;
    const regex = {
        literal: token.literal,
        value: token.value,
        regex: token.regex,
        start: token.start,
        end: token.end
    };

    if (options.tokens) {
        loc.end = {
            line: scanner.lineNumber,
            column: scanner.index - scanner.lineStart
        };

        // Pop the previous token, '/' or '/='
        // This is added from the lookahead token.
        state.tokens.pop();

        state.tokens.push({
            type: 'RegularExpression',
            value: regex.literal,
            regex: regex.regex,
            range: [pos, scanner.index],
            loc: loc
        });
    }

    // Prime the next lookahead.
    state.lookahead = token;
    nextToken();

    return regex;
}

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
            this.range = [state.startIndex, 0];
        }
        if (options.loc) {
            this.loc = {
                start: {
                    line: state.startLineNumber,
                    column: state.startIndex - state.startLineStart
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
            this.range[1] = state.lastIndex;
        }
        if (options.loc) {
            this.loc.end = {
                line: state.lastLineNumber,
                column: state.lastIndex - state.lastLineStart
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
        this.sourceType = sourceType;
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

// Expect the next token to match the specified punctuator.
// If not, an exception will be thrown.

function expect(value) {
    const token = nextToken();
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
        let token = state.lookahead;
        if (token.type === Token.Punctuator && token.value === ',') {
            nextToken();
        } else if (token.type === Token.Punctuator && token.value === ';') {
            nextToken();
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
    const token = nextToken();
    if (token.type !== Token.Keyword || token.value !== keyword) {
        throwUnexpectedToken(token);
    }
}

// Return true if the next token matches the specified punctuator.

function match(value) {
    return state.lookahead.type === Token.Punctuator && state.lookahead.value === value;
}

// Return true if the next token matches the specified keyword

function matchKeyword(keyword) {
    return state.lookahead.type === Token.Keyword && state.lookahead.value === keyword;
}

// Return true if the next token matches the specified contextual keyword
// (where an identifier is sometimes a keyword depending on the context)

function matchContextualKeyword(keyword) {
    return state.lookahead.type === Token.Identifier && state.lookahead.value === keyword;
}

// Return true if the next token is an assignment operator

function matchAssign() {
    if (state.lookahead.type !== Token.Punctuator) {
        return false;
    }
    const op = state.lookahead.value;
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
    if (scanner.source.charCodeAt(state.startIndex) === 0x3B || match(';')) {
        nextToken();
        return;
    }

    if (state.hasLineTerminator) {
        return;
    }

    // FIXME(ikarienator): this is seemingly an issue in the previous location info convention.
    state.lastIndex = state.startIndex;
    state.lastLineNumber = state.startLineNumber;
    state.lastLineStart = state.startLineStart;

    if (state.lookahead.type !== Token.EOF && !match('}')) {
        throwUnexpectedToken(state.lookahead);
    }
}

function isIdentifierName(token) {
    return token.type === Token.Identifier ||
        token.type === Token.Keyword ||
        token.type === Token.BooleanLiteral ||
        token.type === Token.NullLiteral;
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
            nextToken();
            elements.push(null);
        } else {
            if (match('...')) {
                const restNode = new Node();
                nextToken();
                params.push(state.lookahead);
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
    if (state.lookahead.type === Token.Identifier) {
        const keyToken = state.lookahead;
        key = parseVariableIdentifier();
        if (match('=')) {
            params.push(keyToken);
            nextToken();
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
            tolerateUnexpectedToken(state.lookahead, Messages.UnexpectedToken);
        }
    }

    params.push(state.lookahead);
    return parseVariableIdentifier(kind);
}

function parsePatternWithDefault(params, kind?) {
    let startToken = state.lookahead;
    let pattern = parsePattern(params, kind);

    if (match('=')) {
        nextToken();
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
            nextToken();
            elements.push(null);
        } else if (match('...')) {
            const restSpread = new Node();
            nextToken();
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

    const previousStrict = state.strict;
    const body = isolateCoverGrammar(parseFunctionSourceElements);

    if (state.strict && paramInfo.firstRestricted) {
        tolerateUnexpectedToken(paramInfo.firstRestricted, paramInfo.message);
    }
    if (state.strict && paramInfo.stricted) {
        tolerateUnexpectedToken(paramInfo.stricted, paramInfo.message);
    }

    state.strict = previousStrict;
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
    const token = nextToken();

    // Note: This function is called only from parseObjectProperty(), where
    // EOF and Punctuator tokens are already filtered out.

    switch (token.type) {
        case Token.StringLiteral:
        case Token.NumericLiteral:
            if (state.strict && token.octal) {
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
    switch (state.lookahead.type) {
        case Token.Identifier:
        case Token.StringLiteral:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.NumericLiteral:
        case Token.Keyword:
            return true;
        case Token.Punctuator:
            return state.lookahead.value === '[';
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
                tolerateUnexpectedToken(state.lookahead);
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

    const token = state.lookahead;
    const computed = match('[');
    let key;
    if (match('*')) {
        nextToken();
    } else {
        key = parseObjectPropertyKey();
    }

    const maybeMethod = tryParseMethodDefinition(token, key, computed, node);
    if (maybeMethod) {
        return maybeMethod;
    }

    if (!key) {
        throwUnexpectedToken(state.lookahead);
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
        nextToken();
        const value = inheritCoverGrammar(parseAssignmentExpression);
        return node.finishProperty('init', key, computed, value, false, false);
    }

    if (token.type === Token.Identifier) {
        if (match('=')) {
            state.firstCoverInitializedNameError = state.lookahead;
            nextToken();
            const value = isolateCoverGrammar(parseAssignmentExpression);
            return node.finishProperty('init', key, computed,
                new Node(token).finishAssignmentPattern(key, value), false, true);
        }
        return node.finishProperty('init', key, computed, key, false, true);
    }

    throwUnexpectedToken(state.lookahead);
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
    if (state.lookahead.type !== Token.Template || (option.head && !state.lookahead.head)) {
        throwUnexpectedToken();
    }

    const node = new Node();
    const token = nextToken();

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
        nextToken();
        if (!match('=>')) {
            expect('=>');
        }
        return {
            type: PlaceHolders.ArrowParameterPlaceHolder,
            params: [],
            rawParams: []
        };
    }

    const startToken = state.lookahead;
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

        while (state.startIndex < scanner.length) {
            if (!match(',')) {
                break;
            }
            nextToken();

            if (match('...')) {
                if (!state.isBindingElement) {
                    throwUnexpectedToken(state.lookahead);
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
            throwUnexpectedToken(state.lookahead);
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

    const type = state.lookahead.type;
    const node = new Node();
    let expr;

    if (type === Token.Identifier) {
        if (state.sourceType === 'module' && state.lookahead.value === 'await') {
            tolerateUnexpectedToken(state.lookahead);
        }
        expr = node.finishIdentifier(nextToken().value);
    } else if (type === Token.StringLiteral || type === Token.NumericLiteral) {
        state.isAssignmentTarget = state.isBindingElement = false;
        if (state.strict && state.lookahead.octal) {
            tolerateUnexpectedToken(state.lookahead, Messages.StrictOctalLiteral);
        }
        expr = node.finishLiteral(nextToken());
    } else if (type === Token.Keyword) {
        if (!state.strict && state.allowYield && matchKeyword('yield')) {
            return parseNonComputedProperty();
        }
        if (!state.strict && matchKeyword('let')) {
            return node.finishIdentifier(nextToken().value);
        }
        state.isAssignmentTarget = state.isBindingElement = false;
        if (matchKeyword('function')) {
            return parseFunctionExpression();
        }
        if (matchKeyword('this')) {
            nextToken();
            return node.finishThisExpression();
        }
        if (matchKeyword('class')) {
            return parseClassExpression();
        }
        throwUnexpectedToken(nextToken());
    } else if (type === Token.BooleanLiteral) {
        state.isAssignmentTarget = state.isBindingElement = false;
        let token = nextToken();
        token.value = (token.value === 'true');
        expr = node.finishLiteral(token);
    } else if (type === Token.NullLiteral) {
        state.isAssignmentTarget = state.isBindingElement = false;
        let token = nextToken();
        token.value = null;
        expr = node.finishLiteral(token);
    } else if (match('/') || match('/=')) {
        state.isAssignmentTarget = state.isBindingElement = false;
        scanner.index = state.startIndex;
        let token = nextRegexToken();
        expr = node.finishLiteral(token);
    } else if (type === Token.Template) {
        expr = parseTemplateLiteral();
    } else {
        throwUnexpectedToken(nextToken());
    }

    return expr;
}

// ECMA-262 12.3 Left-Hand-Side Expressions

function parseArguments() {
    let args = [];

    expect('(');
    if (!match(')')) {
        while (state.startIndex < scanner.length) {
            let expr;
            if (match('...')) {
                expr = new Node();
                nextToken();
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
    const token = nextToken();
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

    const newNode = new Node();
    const newToken = nextToken();
    assert(newToken.value === 'new', 'New expression must start with `new`');
    const newId = newNode.finishIdentifier(newToken.value);

    if (match('.')) {
        nextToken();
        if (state.lookahead.type === Token.Identifier && state.lookahead.value === 'target') {
            if (state.inFunctionBody) {
                const targetNode = new Node();
                const targetId = targetNode.finishIdentifier(nextToken().value);
                return node.finishMetaProperty(newId, targetId);
            }
        }
        throwUnexpectedToken(state.lookahead);
    }

    const callee = isolateCoverGrammar(parseLeftHandSideExpression);
    const args = match('(') ? parseArguments() : [];

    state.isAssignmentTarget = state.isBindingElement = false;
    return node.finishNewExpression(callee, args);
}

// ECMA-262 12.3.4 Function Calls

function parseLeftHandSideExpressionAllowCall() {
    const startToken = state.lookahead;
    const previousAllowIn = state.allowIn;
    state.allowIn = true;

    let expr;
    if (matchKeyword('super') && state.inFunctionBody) {
        expr = new Node();
        nextToken();
        expr = expr.finishSuper();
        if (!match('(') && !match('.') && !match('[')) {
            throwUnexpectedToken(state.lookahead);
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
        } else if (state.lookahead.type === Token.Template && state.lookahead.head) {
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

    const startToken = state.lookahead;
    let expr;
    if (matchKeyword('super') && state.inFunctionBody) {
        expr = new Node();
        nextToken();
        expr = expr.finishSuper();
        if (!match('[') && !match('.')) {
            throwUnexpectedToken(state.lookahead);
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
        } else if (state.lookahead.type === Token.Template && state.lookahead.head) {
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
    const startToken = state.lookahead;
    let expr = inheritCoverGrammar(parseLeftHandSideExpressionAllowCall);

    if (!state.hasLineTerminator && state.lookahead.type === Token.Punctuator) {
        if (match('++') || match('--')) {
            // ECMA-262 11.3.1, 11.3.2
            if (state.strict && expr.type === Syntax.Identifier && scanner.isRestrictedWord(expr.name)) {
                tolerateError(Messages.StrictLHSPostfix);
            }

            if (!state.isAssignmentTarget) {
                tolerateError(Messages.InvalidLHSInAssignment);
            }

            state.isAssignmentTarget = state.isBindingElement = false;

            const token = nextToken();
            expr = new Node(startToken).finishPostfixExpression(token.value, expr);
        }
    }

    return expr;
}

// ECMA-262 12.5 Unary Operators

function parseUnaryExpression() {
    let expr;
    if (state.lookahead.type !== Token.Punctuator && state.lookahead.type !== Token.Keyword) {
        expr = parsePostfixExpression();
    } else if (match('++') || match('--')) {
        const startToken = state.lookahead;
        const token = nextToken();
        expr = inheritCoverGrammar(parseUnaryExpression);
        // ECMA-262 11.4.4, 11.4.5
        if (state.strict && expr.type === Syntax.Identifier && scanner.isRestrictedWord(expr.name)) {
            tolerateError(Messages.StrictLHSPrefix);
        }

        if (!state.isAssignmentTarget) {
            tolerateError(Messages.InvalidLHSInAssignment);
        }
        expr = new Node(startToken).finishUnaryExpression(token.value, expr);
        state.isAssignmentTarget = state.isBindingElement = false;
    } else if (match('+') || match('-') || match('~') || match('!')) {
        const startToken = state.lookahead;
        const token = nextToken();
        expr = inheritCoverGrammar(parseUnaryExpression);
        expr = new Node(startToken).finishUnaryExpression(token.value, expr);
        state.isAssignmentTarget = state.isBindingElement = false;
    } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
        const startToken = state.lookahead;
        const token = nextToken();
        expr = inheritCoverGrammar(parseUnaryExpression);
        expr = new Node(startToken).finishUnaryExpression(token.value, expr);
        if (state.strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
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
    const marker = state.lookahead;

    let left = inheritCoverGrammar(parseUnaryExpression);

    let token = state.lookahead;
    let prec = binaryPrecedence(token, state.allowIn);
    if (prec === 0) {
        return left;
    }
    state.isAssignmentTarget = state.isBindingElement = false;
    token.prec = prec;
    nextToken();

    let markers = [marker, state.lookahead];
    let right = isolateCoverGrammar(parseUnaryExpression);

    let stack = [left, token, right];

    while ((prec = binaryPrecedence(state.lookahead, state.allowIn)) > 0) {
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
        token = nextToken();
        token.prec = prec;
        stack.push(token);
        markers.push(state.lookahead);
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
    const startToken = state.lookahead;

    let expr = inheritCoverGrammar(parseBinaryExpression);
    if (match('?')) {
        nextToken();

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
                        throwUnexpectedToken(state.lookahead);
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

    if (state.strict || !state.allowYield) {
        for (let i = 0; i < params.length; ++i) {
            const param = params[i];
            if (param.type === Syntax.YieldExpression) {
                throwUnexpectedToken(state.lookahead);
            }
        }
    }

    if (options.message === Messages.StrictParamDupe) {
        const token = state.strict ? options.stricted : options.firstRestricted;
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
    if (state.hasLineTerminator) {
        tolerateUnexpectedToken(state.lookahead);
    }
    expect('=>');

    const previousStrict = state.strict;
    const previousAllowYield = state.allowYield;
    state.allowYield = true;

    const body = parseConciseBody();

    if (state.strict && options.firstRestricted) {
        throwUnexpectedToken(options.firstRestricted, options.message);
    }
    if (state.strict && options.stricted) {
        tolerateUnexpectedToken(options.stricted, options.message);
    }

    state.strict = previousStrict;
    state.allowYield = previousAllowYield;

    return node.finishArrowFunctionExpression(options.params, options.defaults, body, body.type !== Syntax.BlockStatement);
}

// ECMA-262 14.4 Yield expression

function parseYieldExpression() {
    let expr = new Node();
    expectKeyword('yield');

    let argument = null;
    let delegate;
    if (!state.hasLineTerminator) {
        const previousAllowYield = state.allowYield;
        state.allowYield = false;
        delegate = match('*');
        if (delegate) {
            nextToken();
            argument = parseAssignmentExpression();
        } else {
            if (!match(';') && !match('}') && !match(')') && state.lookahead.type !== Token.EOF) {
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

    const startToken = state.lookahead;
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
        if (state.strict && expr.type === Syntax.Identifier) {
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

        token = nextToken();
        const right = isolateCoverGrammar(parseAssignmentExpression);
        expr = new Node(startToken).finishAssignmentExpression(token.value, expr, right);
        state.firstCoverInitializedNameError = null;
    }

    return expr;
}

// ECMA-262 12.15 Comma Operator

function parseExpression() {
    const startToken = state.lookahead;
    let expr = isolateCoverGrammar(parseAssignmentExpression);

    if (match(',')) {
        let expressions = [expr];

        while (state.startIndex < scanner.length) {
            if (!match(',')) {
                break;
            }
            nextToken();
            expressions.push(isolateCoverGrammar(parseAssignmentExpression));
        }

        expr = new Node(startToken).finishSequenceExpression(expressions);
    }

    return expr;
}

// ECMA-262 13.2 Block

function parseStatementListItem() {
    if (state.lookahead.type === Token.Keyword) {
        switch (state.lookahead.value) {
            case 'export':
                if (state.sourceType !== 'module') {
                    tolerateUnexpectedToken(state.lookahead, Messages.IllegalExportDeclaration);
                }
                return parseExportDeclaration();
            case 'import':
                if (state.sourceType !== 'module') {
                    tolerateUnexpectedToken(state.lookahead, Messages.IllegalImportDeclaration);
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
    while (state.startIndex < scanner.length) {
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
    const token = nextToken();

    if (token.type === Token.Keyword && token.value === 'yield') {
        if (state.strict) {
            tolerateUnexpectedToken(token, Messages.StrictReservedWord);
        } if (!state.allowYield) {
            throwUnexpectedToken(token);
        }
    } else if (token.type !== Token.Identifier) {
        if (state.strict && token.type === Token.Keyword && scanner.isStrictModeReservedWord(token.value)) {
            tolerateUnexpectedToken(token, Messages.StrictReservedWord);
        } else {
            if (state.strict || token.value !== 'let' || kind !== 'var') {
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
    if (state.strict && scanner.isRestrictedWord(id.name)) {
        tolerateError(Messages.StrictVarName);
    }

    let init = null;
    if (match('=')) {
        nextToken();
        init = isolateCoverGrammar(parseAssignmentExpression);
    } else if (id.type !== Syntax.Identifier && !options.inFor) {
        expect('=');
    }

    return node.finishVariableDeclarator(id, init);
}

function parseVariableDeclarationList(options) {
    let opt = { inFor: options.inFor };
    let list = [parseVariableDeclaration(opt)];

    while (match(',')) {
        nextToken();
        list.push(parseVariableDeclaration(opt));
    }

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
    if (state.strict && id.type === Syntax.Identifier && scanner.isRestrictedWord(id.name)) {
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
    let list = [parseLexicalBinding(kind, options)];

    while (match(',')) {
        nextToken();
        list.push(parseLexicalBinding(kind, options));
    }

    return list;
}

function isLexicalDeclaration() {
    const location = {
        index: scanner.index,
        lineNumber: scanner.lineNumber,
        lineStart: scanner.lineStart
    };

    collectComments();

    let next;
    state.scanning = true;
    next = scanner.lex();
    state.scanning = false;

    const lexical = (next.type === Token.Identifier) ||
        (next.type === Token.Punctuator && next.value === '[') ||
        (next.type === Token.Punctuator && next.value === '{') ||
        (next.type === Token.Keyword && next.value === 'let') ||
        (next.type === Token.Keyword && next.value === 'yield');

    scanner.index = location.index;
    scanner.lineNumber = location.lineNumber;
    scanner.lineStart = location.lineStart;

    return lexical;
}

function parseLexicalDeclaration(options) {
    const node = new Node();
    const kind = nextToken().value;
    assert(kind === 'let' || kind === 'const', 'Lexical declaration must be either let or const');

    const declarations = parseBindingList(kind, options);
    consumeSemicolon();

    return node.finishLexicalDeclaration(declarations, kind);
}

function parseRestElement(params) {
    const node = new Node();

    nextToken();
    if (match('{')) {
        throwError(Messages.ObjectPatternAsRestParameter);
    }

    params.push(state.lookahead);

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
        nextToken();
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
        nextToken();
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
        nextToken();
    } else {
        if (matchKeyword('var')) {
            init = new Node();
            nextToken();

            const previousAllowIn = state.allowIn;
            state.allowIn = false;
            let declarations = parseVariableDeclarationList({ inFor: true });
            state.allowIn = previousAllowIn;

            if (declarations.length === 1 && matchKeyword('in')) {
                init = init.finishVariableDeclaration(declarations);
                nextToken();
                left = init;
                right = parseExpression();
                init = null;
            } else if (declarations.length === 1 && declarations[0].init === null && matchContextualKeyword('of')) {
                init = init.finishVariableDeclaration(declarations);
                nextToken();
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
            const kind = nextToken().value;

            if (!state.strict && state.lookahead.value === 'in') {
                init = init.finishIdentifier(kind);
                nextToken();
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
                    nextToken();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (declarations.length === 1 && declarations[0].init === null && matchContextualKeyword('of')) {
                    init = init.finishLexicalDeclaration(declarations, kind);
                    nextToken();
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
            const initStartToken = state.lookahead;
            const previousAllowIn = state.allowIn;
            state.allowIn = false;
            init = inheritCoverGrammar(parseAssignmentExpression);
            state.allowIn = previousAllowIn;

            if (matchKeyword('in')) {
                if (!state.isAssignmentTarget) {
                    tolerateError(Messages.InvalidLHSInForIn);
                }

                nextToken();
                reinterpretExpressionAsPattern(init);
                left = init;
                right = parseExpression();
                init = null;
            } else if (matchContextualKeyword('of')) {
                if (!state.isAssignmentTarget) {
                    tolerateError(Messages.InvalidLHSInForLoop);
                }

                nextToken();
                reinterpretExpressionAsPattern(init);
                left = init;
                right = parseAssignmentExpression();
                init = null;
                forIn = false;
            } else {
                if (match(',')) {
                    let initSeq = [init];
                    while (match(',')) {
                        nextToken();
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
    if (scanner.source.charCodeAt(state.startIndex) === 0x3B) {
        nextToken();

        if (!state.inIteration) {
            throwError(Messages.IllegalContinue);
        }

        return node.finishContinueStatement(null);
    }

    if (state.hasLineTerminator) {
        if (!state.inIteration) {
            throwError(Messages.IllegalContinue);
        }

        return node.finishContinueStatement(null);
    }

    let label = null;
    if (state.lookahead.type === Token.Identifier) {
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
    if (scanner.source.charCodeAt(state.lastIndex) === 0x3B) {
        nextToken();

        if (!(state.inIteration || state.inSwitch)) {
            throwError(Messages.IllegalBreak);
        }

        return node.finishBreakStatement(null);
    }

    let label = null;
    if (state.hasLineTerminator) {
        if (!(state.inIteration || state.inSwitch)) {
            throwError(Messages.IllegalBreak);
        }
    } else if (state.lookahead.type === Token.Identifier) {
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

    if (state.hasLineTerminator) {
        // HACK
        return node.finishReturnStatement(null);
    }

    let argument = null;
    if (!match(';')) {
        if (!match('}') && state.lookahead.type !== Token.EOF) {
            argument = parseExpression();
        }
    }

    consumeSemicolon();

    return node.finishReturnStatement(argument);
}

// ECMA-262 13.11 The with statement

function parseWithStatement(node) {
    if (state.strict) {
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
        nextToken();
        test = null;
    } else {
        expectKeyword('case');
        test = parseExpression();
    }
    expect(':');

    let consequent = [];
    while (state.startIndex < scanner.length) {
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
        nextToken();
        return node.finishSwitchStatement(discriminant, cases);
    }

    const oldInSwitch = state.inSwitch;
    state.inSwitch = true;

    let defaultFound = false;
    while (state.startIndex < scanner.length) {
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

    if (state.hasLineTerminator) {
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
        throwUnexpectedToken(state.lookahead);
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
    if (state.strict && scanner.isRestrictedWord(param.name)) {
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
        nextToken();
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
    const type = state.lookahead.type;

    if (type === Token.EOF) {
        throwUnexpectedToken(state.lookahead);
    }

    if (type === Token.Punctuator && state.lookahead.value === '{') {
        return parseBlock();
    }
    state.isAssignmentTarget = state.isBindingElement = true;
    const node = new Node();

    if (type === Token.Punctuator) {
        switch (state.lookahead.value) {
            case ';':
                return parseEmptyStatement(node);
            case '(':
                return parseExpressionStatement(node);
            default:
                break;
        }
    } else if (type === Token.Keyword) {
        switch (state.lookahead.value) {
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
        nextToken();

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
    while (state.startIndex < scanner.length) {
        if (state.lookahead.type !== Token.StringLiteral) {
            break;
        }
        const token = state.lookahead;

        let statement = parseStatementListItem();
        body.push(statement);
        if (statement.expression.type !== Syntax.Literal) {
            // this is not directive
            break;
        }
        const directive = scanner.source.slice(token.start + 1, token.end - 1);
        if (directive === 'use strict') {
            state.strict = true;
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

    while (state.startIndex < scanner.length) {
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
    if (state.strict) {
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

    const token = state.lookahead;
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
        while (state.startIndex < scanner.length) {
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
        nextToken();
    }

    let message;
    let id = null;
    let firstRestricted = null;

    if (!identifierIsOptional || !match('(')) {
        const token = state.lookahead;
        id = parseVariableIdentifier();
        if (state.strict) {
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

    const previousStrict = state.strict;
    const body = parseFunctionSourceElements();
    if (state.strict && firstRestricted) {
        throwUnexpectedToken(firstRestricted, message);
    }
    if (state.strict && stricted) {
        tolerateUnexpectedToken(stricted, message);
    }

    state.strict = previousStrict;
    state.allowYield = previousAllowYield;

    return node.finishFunctionDeclaration(id, params, defaults, body, isGenerator);
}

function parseFunctionExpression() {
    const node = new Node();

    expectKeyword('function');

    const isGenerator = match('*');
    if (isGenerator) {
        nextToken();
    }

    let message;
    let id = null;
    let firstRestricted;

    const previousAllowYield = state.allowYield;
    state.allowYield = !isGenerator;

    if (!match('(')) {
        const token = state.lookahead;
        id = (!state.strict && !isGenerator && matchKeyword('yield')) ? parseNonComputedProperty() : parseVariableIdentifier();
        if (state.strict) {
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

    const previousStrict = state.strict;
    const body = parseFunctionSourceElements();
    if (state.strict && firstRestricted) {
        throwUnexpectedToken(firstRestricted, message);
    }
    if (state.strict && stricted) {
        tolerateUnexpectedToken(stricted, message);
    }
    state.strict = previousStrict;
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
            nextToken();
        } else {
            let method = new Node();
            let token = state.lookahead;
            let isStatic = false;
            let computed = match('[');
            let key;

            if (match('*')) {
                nextToken();
            } else {
                key = parseObjectPropertyKey();
                if (key.name === 'static' && (lookaheadPropertyName() || match('*'))) {
                    token = state.lookahead;
                    isStatic = true;
                    computed = match('[');
                    if (match('*')) {
                        nextToken();
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
                throwUnexpectedToken(state.lookahead);
            }
        }
    }
    expect('}');

    return node.finishClassBody(body);
}

function parseClassDeclaration(identifierIsOptional?) {
    const node = new Node();

    const previousStrict = state.strict;
    state.strict = true;

    expectKeyword('class');

    let id = null;
    if (!identifierIsOptional || state.lookahead.type === Token.Identifier) {
        id = parseVariableIdentifier();
    }

    let superClass = null;
    if (matchKeyword('extends')) {
        nextToken();
        superClass = isolateCoverGrammar(parseLeftHandSideExpressionAllowCall);
    }
    const classBody = parseClassBody();
    state.strict = previousStrict;

    return node.finishClassDeclaration(id, superClass, classBody);
}

function parseClassExpression() {
    const node = new Node();

    const previousStrict = state.strict;
    state.strict = true;

    expectKeyword('class');

    let id = null;
    if (state.lookahead.type === Token.Identifier) {
        id = parseVariableIdentifier();
    }

    let superClass = null;
    if (matchKeyword('extends')) {
        nextToken();
        superClass = isolateCoverGrammar(parseLeftHandSideExpressionAllowCall);
    }
    const classBody = parseClassBody();
    state.strict = previousStrict;

    return node.finishClassExpression(id, superClass, classBody);
}

// ECMA-262 15.2 Modules

function parseModuleSpecifier() {
    const node = new Node();

    if (state.lookahead.type !== Token.StringLiteral) {
        throwError(Messages.InvalidModuleSpecifier);
    }
    return node.finishLiteral(nextToken());
}

// ECMA-262 15.2.3 Exports

function parseExportSpecifier() {
    const node = new Node();
    let local, exported;
    if (matchKeyword('default')) {
        // export {default} from 'something';
        let def = new Node();
        nextToken();
        local = def.finishIdentifier('default');
    } else {
        local = parseVariableIdentifier();
    }
    if (matchContextualKeyword('as')) {
        nextToken();
        exported = parseNonComputedProperty();
    }
    return node.finishExportSpecifier(local, exported);
}

function parseExportNamedDeclaration(node) {
    let src = null;
    let specifiers = [];

    // non-default export
    if (state.lookahead.type === Token.Keyword) {
        // covers:
        // export var f = 1;
        let declaration;
        switch (state.lookahead.value) {
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
        nextToken();
        src = parseModuleSpecifier();
        consumeSemicolon();
    } else if (isExportFromIdentifier) {
        // covering:
        // export {default}; // missing fromClause
        throwError(state.lookahead.value ?
            Messages.UnexpectedToken : Messages.MissingFromClause, state.lookahead.value);
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
        throwError(Messages.UnexpectedToken, state.lookahead.value);
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
        throwError(state.lookahead.value ?
            Messages.UnexpectedToken : Messages.MissingFromClause, state.lookahead.value);
    }
    nextToken();
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
        nextToken();
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
    nextToken();
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

    if (state.lookahead.type === Token.StringLiteral) {
        // import 'foo';
        src = parseModuleSpecifier();
    } else {

        if (match('{')) {
            // import {bar}
            specifiers = specifiers.concat(parseNamedImports());
        } else if (match('*')) {
            // import * as foo
            specifiers.push(parseImportNamespaceSpecifier());
        } else if (isIdentifierName(state.lookahead) && !matchKeyword('default')) {
            // import foo
            specifiers.push(parseImportDefaultSpecifier());
            if (match(',')) {
                nextToken();
                if (match('*')) {
                    // import foo, * as foo
                    specifiers.push(parseImportNamespaceSpecifier());
                } else if (match('{')) {
                    // import foo, {bar}
                    specifiers = specifiers.concat(parseNamedImports());
                } else {
                    throwUnexpectedToken(state.lookahead);
                }
            }
        } else {
            throwUnexpectedToken(nextToken());
        }

        if (!matchContextualKeyword('from')) {
            throwError(state.lookahead.value ?
                Messages.UnexpectedToken : Messages.MissingFromClause, state.lookahead.value);
        }
        nextToken();
        src = parseModuleSpecifier();
    }

    consumeSemicolon();
    return node.finishImportDeclaration(specifiers, src);
}

// ECMA-262 15.1 Scripts

function parseScriptBody() {
    let body = [];

    let firstRestricted = null;
    while (state.startIndex < scanner.length) {
        const token = state.lookahead;
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
            state.strict = true;
            if (firstRestricted) {
                tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
            }
        } else {
            if (!firstRestricted && token.octal) {
                firstRestricted = token;
            }
        }
    }

    while (state.startIndex < scanner.length) {
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

function throwError(messageFormat: string, ...values): void {
    const args = Array.prototype.slice.call(arguments, 1);
    const msg = messageFormat.replace(/%(\d)/g,
        function(whole, idx) {
            assert(idx < args.length, 'Message reference must be in range');
            return args[idx];
        }
    );

    const index = state.lastIndex;
    const line = state.lastLineNumber;
    const column = state.lastIndex - state.lastLineStart + 1;
    throw errorHandler.createError(index, line, column, msg);
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

    const index = state.lastIndex;
    const line = scanner.lineNumber;
    const column = state.lastIndex - state.lastLineStart + 1;
    errorHandler.tolerateError(index, line, column, msg);
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
                } else if (state.strict && scanner.isStrictModeReservedWord(token.value)) {
                    msg = Messages.StrictReservedWord;
                }
            }
        }

        value = (token.type === Token.Template) ? token.value.raw : token.value;
    } else {
        value = 'ILLEGAL';
    }

    msg = msg.replace('%0', value);

    if (token && typeof token.lineNumber === 'number') {
        const index = token.start;
        const line = token.lineNumber;
        const column = token.start - state.lastLineStart + 1;
        return errorHandler.createError(index, line, column, msg);
    } else {
        const index = state.lastIndex;
        const line = state.lastLineNumber;
        const column = index - state.lastLineStart + 1;
        return errorHandler.createError(index, line, column, msg);
    }
}

function throwUnexpectedToken(token?, message?) {
    throw unexpectedTokenError(token, message);
}

function tolerateUnexpectedToken(token?, message?) {
    errorHandler.tolerate(unexpectedTokenError(token, message));
}

function initialize(code: string, opt: any): void {
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

    errorHandler = new ErrorHandler();
    errorHandler.tolerant = options.tolerant;

    scanner = new Scanner(code, errorHandler);
    scanner.trackComment = options.comment;

    state = {
        allowIn: true,
        allowYield: true,
        comments: [],
        firstCoverInitializedNameError: null,
        hasLineTerminator: false,
        isAssignmentTarget: false,
        isBindingElement: false,
        labelSet: {},
        lastIndex: 0,
        lastLineNumber: scanner.lineNumber,
        lastLineStart: 0,
        lookahead: null,
        inFunctionBody: false,
        inIteration: false,
        inSwitch: false,
        scanning: false,
        source: null,
        sourceType: options.sourceType,
        startIndex: 0,
        startLineNumber: scanner.lineNumber,
        startLineStart: 0,
        strict: (options.sourceType === 'module'),
        tokens: []
    };

    if (options.attachComment) {
        options.range = true;
        state.bottomRightStack = [];
        state.trailingComments = [];
        state.leadingComments = [];
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

export function parse(code: string, opt) {
    initialize(code, opt);

    nextToken();
    state.lastIndex = scanner.index;
    state.lastLineNumber = scanner.lineNumber;
    state.lastLineStart = scanner.lineStart;

    const program = parseProgram();
    if (options.comment) {
        program.comments = state.comments;
    }
    if (options.tokens) {
        program.tokens = filterTokenLocation(state.tokens);
    }

    if (errorHandler.tolerant) {
        program.errors = errorHandler.errors;
    }

    return program;
}
