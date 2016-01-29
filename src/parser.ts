import { assert } from './assert';
import { Messages} from './messages';

import { ErrorHandler } from './error-handler';
import { Token, TokenName } from './token';
import { Comment, Scanner } from './scanner';

import { Syntax } from './syntax';
import * as Node from './nodes';

interface Config {
    range: boolean;
    loc: boolean;
    source: string;
    tokens: boolean;
    comment: boolean;
    tolerant: boolean;
}

interface Context {
    allowIn: boolean;
    allowYield: boolean;
    firstCoverInitializedNameError: any;
    isAssignmentTarget: boolean;
    isBindingElement: boolean;
    inFunctionBody: boolean;
    inIteration: boolean;
    inSwitch: boolean;
    labelSet: any;
    strict: boolean;
}

interface Marker {
    index: number;
    lineNumber: number;
    lineStart: number;
}

interface MetaNode {
    index: number;
    line: number;
    column: number;
}

const ArrowParameterPlaceHolder = 'ArrowParameterPlaceHolder';

interface ArrowParameterPlaceHolderNode {
    type: string;
    params: Node.Expression[];
}

interface DeclarationOptions {
    inFor: boolean;
}

export class Parser {
    config: Config;
    delegate: any;
    errorHandler: ErrorHandler;
    scanner: Scanner;
    operatorPrecedence: any;

    sourceType: string;
    lookahead: any;
    hasLineTerminator: boolean;

    context: Context;
    tokens: any[];
    startMarker: Marker;
    lastMarker: Marker;

    constructor(code: string, options: any = {}, delegate) {
        this.config = {
            range: (typeof options.range === 'boolean') && options.range,
            loc: (typeof options.loc === 'boolean') && options.loc,
            source: null,
            tokens: (typeof options.tokens === 'boolean') && options.tokens,
            comment: (typeof options.comment === 'boolean') && options.comment,
            tolerant: (typeof options.tolerant === 'boolean') && options.tolerant
        };
        if (this.config.loc && options.source && options.source !== null) {
            this.config.source = String(options.source);
        }

        this.delegate = delegate;

        this.errorHandler = new ErrorHandler();
        this.errorHandler.tolerant = this.config.tolerant;
        this.scanner = new Scanner(code, this.errorHandler);
        this.scanner.trackComment = this.config.comment;

        this.operatorPrecedence = {
            ')': 0,
            ';': 0,
            ',': 0,
            '=': 0,
            ']': 0,
            '||': 1,
            '&&': 2,
            '|': 3,
            '^': 4,
            '&': 5,
            '==': 6,
            '!=': 6,
            '===': 6,
            '!==': 6,
            '<': 7,
            '>': 7,
            '<=': 7,
            '>=': 7,
            '<<': 8,
            '>>': 8,
            '>>>': 8,
            '+': 9,
            '-': 9,
            '*': 11,
            '/': 11,
            '%': 11
        };

        this.sourceType = (options && options.sourceType === 'module') ? 'module' : 'script';
        this.lookahead = null;
        this.hasLineTerminator = false;

        this.context = {
            allowIn: true,
            allowYield: true,
            firstCoverInitializedNameError: null,
            isAssignmentTarget: false,
            isBindingElement: false,
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            labelSet: {},
            strict: (this.sourceType === 'module')
        };
        this.tokens = [];

        this.startMarker = {
            index: 0,
            lineNumber: this.scanner.lineNumber,
            lineStart: 0
        };
        this.lastMarker = {
            index: 0,
            lineNumber: this.scanner.lineNumber,
            lineStart: 0
        };
        this.nextToken();
        this.lastMarker = {
            index: this.scanner.index,
            lineNumber: this.scanner.lineNumber,
            lineStart: this.scanner.lineStart
        };
    }

    throwError(messageFormat: string, ...values): void {
        const args = Array.prototype.slice.call(arguments, 1);
        const msg = messageFormat.replace(/%(\d)/g,
            function(whole, idx) {
                assert(idx < args.length, 'Message reference must be in range');
                return args[idx];
            }
        );

        const index = this.lastMarker.index;
        const line = this.lastMarker.lineNumber;
        const column = this.lastMarker.index - this.lastMarker.lineStart + 1;
        throw this.errorHandler.createError(index, line, column, msg);
    }

    tolerateError(messageFormat, ...values) {
        const args = Array.prototype.slice.call(arguments, 1);
        const msg = messageFormat.replace(/%(\d)/g,
            function(whole, idx) {
                assert(idx < args.length, 'Message reference must be in range');
                return args[idx];
            }
        );

        const index = this.lastMarker.index;
        const line = this.scanner.lineNumber;
        const column = this.lastMarker.index - this.lastMarker.lineStart + 1;
        this.errorHandler.tolerateError(index, line, column, msg);
    }

    // Throw an exception because of the token.
    unexpectedTokenError(token?: any, message?: string): Error {
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
                    if (this.scanner.isFutureReservedWord(token.value)) {
                        msg = Messages.UnexpectedReserved;
                    } else if (this.context.strict && this.scanner.isStrictModeReservedWord(token.value)) {
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
            const column = token.start - this.lastMarker.lineStart + 1;
            return this.errorHandler.createError(index, line, column, msg);
        } else {
            const index = this.lastMarker.index;
            const line = this.lastMarker.lineNumber;
            const column = index - this.lastMarker.lineStart + 1;
            return this.errorHandler.createError(index, line, column, msg);
        }
    }

    throwUnexpectedToken(token?, message?) {
        throw this.unexpectedTokenError(token, message);
    }

    tolerateUnexpectedToken(token?, message?) {
        this.errorHandler.tolerate(this.unexpectedTokenError(token, message));
    }

    collectComments() {
        if (!this.config.comment) {
            this.scanner.scanComments();
        } else {
            const comments: Comment[] = this.scanner.scanComments();
            if (comments.length > 0 && this.delegate) {
                for (let i = 0; i < comments.length; ++i) {
                    const e: Comment = comments[i];
                    let node;
                    node = {
                        type: e.multiLine ? 'BlockComment' : 'LineComment',
                        value: this.scanner.source.slice(e.slice[0], e.slice[1])
                    };
                    if (this.config.range) {
                        node.range = e.range;
                    }
                    if (this.config.loc) {
                        node.loc = e.loc;
                    }
                    const metadata = {
                        start: {
                            line: e.loc.start.line,
                            column: e.loc.start.column,
                            offset: e.range[0]
                        },
                        end: {
                            line: e.loc.end.line,
                            column: e.loc.end.column,
                            offset: e.range[1]
                        }
                    };
                    this.delegate(node, metadata);
                }
            }
        }
    }

    // From internal representation to an external structure

    getTokenRaw(token): string {
        return this.scanner.source.slice(token.start, token.end);
    }

    convertToken(token) {
        let t;

        t = {
            type: TokenName[token.type],
            value: this.getTokenRaw(token)
        };
        if (this.config.range) {
            t.range = [token.start, token.end];
        }
        if (this.config.loc) {
            t.loc = {
                start: {
                    line: this.startMarker.lineNumber,
                    column: this.startMarker.index - this.startMarker.lineStart
                },
                end: {
                    line: this.scanner.lineNumber,
                    column: this.scanner.index - this.scanner.lineStart
                }
            };
        }
        if (token.regex) {
            t.regex = token.regex;
        }

        return t;
    }

    nextToken() {
        const token = this.lookahead;

        this.lastMarker.index = this.scanner.index;
        this.lastMarker.lineNumber = this.scanner.lineNumber;
        this.lastMarker.lineStart = this.scanner.lineStart;

        this.collectComments();

        this.startMarker.index = this.scanner.index;
        this.startMarker.lineNumber = this.scanner.lineNumber;
        this.startMarker.lineStart = this.scanner.lineStart;

        let next;
        next = this.scanner.lex();
        this.hasLineTerminator = (token && next) ? (token.lineNumber !== next.lineNumber) : false;

        if (next && this.context.strict && next.type === Token.Identifier) {
            if (this.scanner.isStrictModeReservedWord(next.value)) {
                next.type = Token.Keyword;
            }
        }
        this.lookahead = next;

        if (this.config.tokens && next.type !== Token.EOF) {
            this.tokens.push(this.convertToken(next));
        }

        return token;
    }

    nextRegexToken() {
        this.collectComments();

        const token = this.scanner.scanRegExp();
        if (this.config.tokens) {
            // Pop the previous token, '/' or '/='
            // This is added from the lookahead token.
            this.tokens.pop();

            this.tokens.push(this.convertToken(token));
        }

        // Prime the next lookahead.
        this.lookahead = token;
        this.nextToken();

        return token;
    }

    createNode(): MetaNode {
        return {
            index: this.startMarker.index,
            line: this.startMarker.lineNumber,
            column: this.startMarker.index - this.startMarker.lineStart
        };
    }

    startNode(token): MetaNode {
        return {
            index: token.start,
            line: token.lineNumber,
            column: token.start - token.lineStart
        };
    }

    finalize(meta: MetaNode, node) {
        if (this.config.range) {
            node.range = [meta.index, this.lastMarker.index];
        }

        if (this.config.loc) {
            node.loc = {
                start: {
                    line: meta.line,
                    column: meta.column
                },
                end: {
                    line: this.lastMarker.lineNumber,
                    column: this.lastMarker.index - this.lastMarker.lineStart
                }
            };
            if (this.config.source) {
                node.loc.source = this.config.source;
            }
        }

        if (this.delegate) {
            const metadata = {
                start: {
                    line: meta.line,
                    column: meta.column,
                    offset: meta.index
                },
                end: {
                    line: this.lastMarker.lineNumber,
                    column: this.lastMarker.index - this.lastMarker.lineStart,
                    offset: this.lastMarker.index
                }
            };
            this.delegate(node, metadata);
        }

        return node;
    }

    // Expect the next token to match the specified punctuator.
    // If not, an exception will be thrown.

    expect(value) {
        const token = this.nextToken();
        if (token.type !== Token.Punctuator || token.value !== value) {
            this.throwUnexpectedToken(token);
        }
    }

    // Quietly expect a comma when in tolerant mode, otherwise delegates to expect().

    expectCommaSeparator() {
        if (this.config.tolerant) {
            let token = this.lookahead;
            if (token.type === Token.Punctuator && token.value === ',') {
                this.nextToken();
            } else if (token.type === Token.Punctuator && token.value === ';') {
                this.nextToken();
                this.tolerateUnexpectedToken(token);
            } else {
                this.tolerateUnexpectedToken(token, Messages.UnexpectedToken);
            }
        } else {
            this.expect(',');
        }
    }

    // Expect the next token to match the specified keyword.
    // If not, an exception will be thrown.

    expectKeyword(keyword) {
        const token = this.nextToken();
        if (token.type !== Token.Keyword || token.value !== keyword) {
            this.throwUnexpectedToken(token);
        }
    }

    // Return true if the next token matches the specified punctuator.

    match(value) {
        return this.lookahead.type === Token.Punctuator && this.lookahead.value === value;
    }

    // Return true if the next token matches the specified keyword

    matchKeyword(keyword) {
        return this.lookahead.type === Token.Keyword && this.lookahead.value === keyword;
    }

    // Return true if the next token matches the specified contextual keyword
    // (where an identifier is sometimes a keyword depending on the context)

    matchContextualKeyword(keyword) {
        return this.lookahead.type === Token.Identifier && this.lookahead.value === keyword;
    }

    // Return true if the next token is an assignment operator

    matchAssign() {
        if (this.lookahead.type !== Token.Punctuator) {
            return false;
        }
        const op = this.lookahead.value;
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

    isolateCoverGrammar(parseFunction) {
        const previousIsBindingElement = this.context.isBindingElement;
        const previousIsAssignmentTarget = this.context.isAssignmentTarget;
        const previousFirstCoverInitializedNameError = this.context.firstCoverInitializedNameError;

        this.context.isBindingElement = true;
        this.context.isAssignmentTarget = true;
        this.context.firstCoverInitializedNameError = null;

        const result = parseFunction.call(this);
        if (this.context.firstCoverInitializedNameError !== null) {
            this.throwUnexpectedToken(this.context.firstCoverInitializedNameError);
        }

        this.context.isBindingElement = previousIsBindingElement;
        this.context.isAssignmentTarget = previousIsAssignmentTarget;
        this.context.firstCoverInitializedNameError = previousFirstCoverInitializedNameError;

        return result;
    }

    inheritCoverGrammar(parseFunction) {
        const previousIsBindingElement = this.context.isBindingElement;
        const previousIsAssignmentTarget = this.context.isAssignmentTarget;
        const previousFirstCoverInitializedNameError = this.context.firstCoverInitializedNameError;

        this.context.isBindingElement = true;
        this.context.isAssignmentTarget = true;
        this.context.firstCoverInitializedNameError = null;

        const result = parseFunction.call(this);

        this.context.isBindingElement = this.context.isBindingElement && previousIsBindingElement;
        this.context.isAssignmentTarget = this.context.isAssignmentTarget && previousIsAssignmentTarget;
        this.context.firstCoverInitializedNameError = previousFirstCoverInitializedNameError || this.context.firstCoverInitializedNameError;

        return result;
    }

    consumeSemicolon() {
        if (this.match(';')) {
            this.nextToken();
        } else if (!this.hasLineTerminator) {
            if (this.lookahead.type !== Token.EOF && !this.match('}')) {
                this.throwUnexpectedToken(this.lookahead);
            }
            this.lastMarker.index = this.startMarker.index;
            this.lastMarker.lineNumber = this.startMarker.lineNumber;
            this.lastMarker.lineStart = this.startMarker.lineStart;
        }
    }

    // ECMA-262 12.2 Primary Expressions

    parsePrimaryExpression(): Node.Expression {
        const node = this.createNode();

        let expr: Node.Expression;
        let value, token, raw;

        switch (this.lookahead.type) {
            case Token.Identifier:
                if (this.sourceType === 'module' && this.lookahead.value === 'await') {
                    this.tolerateUnexpectedToken(this.lookahead);
                }
                expr = this.finalize(node, new Node.Identifier(this.nextToken().value));
                break;

            case Token.NumericLiteral:
            case Token.StringLiteral:
                if (this.context.strict && this.lookahead.octal) {
                    this.tolerateUnexpectedToken(this.lookahead, Messages.StrictOctalLiteral);
                }
                this.context.isAssignmentTarget = false;
                this.context.isBindingElement = false;
                token = this.nextToken();
                raw = this.getTokenRaw(token);
                expr = this.finalize(node, new Node.Literal(token.value, raw));
                break;

            case Token.BooleanLiteral:
                this.context.isAssignmentTarget = false;
                this.context.isBindingElement = false;
                token = this.nextToken();
                token.value = (token.value === 'true');
                raw = this.getTokenRaw(token);
                expr = this.finalize(node, new Node.Literal(token.value, raw));
                break;

            case Token.NullLiteral:
                this.context.isAssignmentTarget = false;
                this.context.isBindingElement = false;
                token = this.nextToken();
                token.value = null;
                raw = this.getTokenRaw(token);
                expr = this.finalize(node, new Node.Literal(token.value, raw));
                break;

            case Token.Template:
                expr = this.parseTemplateLiteral();
                break;

            case Token.Punctuator:
                value = this.lookahead.value;
                switch (value) {
                    case '(':
                        this.context.isBindingElement = false;
                        expr = this.inheritCoverGrammar(this.parseGroupExpression);
                        break;
                    case '[':
                        expr = this.inheritCoverGrammar(this.parseArrayInitializer);
                        break;
                    case '{':
                        expr = this.inheritCoverGrammar(this.parseObjectInitializer);
                        break;
                    case '/':
                    case '/=':
                        this.context.isAssignmentTarget = false;
                        this.context.isBindingElement = false;
                        this.scanner.index = this.startMarker.index;
                        token = this.nextRegexToken();
                        raw = this.getTokenRaw(token);
                        expr = this.finalize(node, new Node.RegexLiteral(token.value, raw, token.regex));
                        break;
                    default:
                        this.throwUnexpectedToken(this.nextToken());
                }
                break;

            case Token.Keyword:
                if (!this.context.strict && this.context.allowYield && this.matchKeyword('yield')) {
                    expr = this.parseNonComputedProperty();
                } else if (!this.context.strict && this.matchKeyword('let')) {
                    expr = this.finalize(node, new Node.Identifier(this.nextToken().value));
                } else {
                    this.context.isAssignmentTarget = false;
                    this.context.isBindingElement = false;
                    if (this.matchKeyword('function')) {
                        expr = this.parseFunctionExpression();
                    } else if (this.matchKeyword('this')) {
                        this.nextToken();
                        expr = this.finalize(node, new Node.ThisExpression());
                    } else if (this.matchKeyword('class')) {
                        expr = this.parseClassExpression();
                    } else {
                        this.throwUnexpectedToken(this.nextToken());
                    }
                }
                break;

            default:
                this.throwUnexpectedToken(this.nextToken());
        }

        return expr;
    }

    // ECMA-262 12.2.5 Array Initializer

    parseSpreadElement(): Node.SpreadElement {
        const node = this.createNode();
        this.expect('...');
        const arg = this.inheritCoverGrammar(this.parseAssignmentExpression);
        return this.finalize(node, new Node.SpreadElement(arg));
    }

    parseArrayInitializer(): Node.ArrayExpression {
        const node = this.createNode();
        const elements: Node.ArrayExpressionElement[] = [];

        this.expect('[');
        while (!this.match(']')) {
            if (this.match(',')) {
                this.nextToken();
                elements.push(null);
            } else if (this.match('...')) {
                const element = this.parseSpreadElement();
                if (!this.match(']')) {
                    this.context.isAssignmentTarget = false;
                    this.context.isBindingElement = false;
                    this.expect(',');
                }
                elements.push(element);
            } else {
                elements.push(this.inheritCoverGrammar(this.parseAssignmentExpression));
                if (!this.match(']')) {
                    this.expect(',');
                }
            }
        }
        this.expect(']');

        return this.finalize(node, new Node.ArrayExpression(elements));
    }

    // ECMA-262 12.2.6 Object Initializer

    parsePropertyMethod(params): Node.BlockStatement {
        this.context.isAssignmentTarget = false;
        this.context.isBindingElement = false;

        const previousStrict = this.context.strict;
        const body = this.isolateCoverGrammar(this.parseFunctionSourceElements);
        if (this.context.strict && params.firstRestricted) {
            this.tolerateUnexpectedToken(params.firstRestricted, params.message);
        }
        if (this.context.strict && params.stricted) {
            this.tolerateUnexpectedToken(params.stricted, params.message);
        }
        this.context.strict = previousStrict;

        return body;
    }

    parsePropertyMethodFunction(): Node.FunctionExpression {
        const isGenerator = false;
        const node = this.createNode();

        const previousAllowYield = this.context.allowYield;
        this.context.allowYield = false;
        const params = this.parseFormalParameters();
        const method = this.parsePropertyMethod(params);
        this.context.allowYield = previousAllowYield;

        return this.finalize(node, new Node.FunctionExpression(null, params.params, method, isGenerator));
    }

    parseObjectPropertyKey(): Node.PropertyKey {
        const node = this.createNode();
        const token = this.nextToken();

        let key = null;
        switch (token.type) {
            case Token.StringLiteral:
            case Token.NumericLiteral:
                if (this.context.strict && token.octal) {
                    this.tolerateUnexpectedToken(token, Messages.StrictOctalLiteral);
                }
                const raw = this.getTokenRaw(token);
                key = this.finalize(node, new Node.Literal(token.value, raw));
                break;

            case Token.Identifier:
            case Token.BooleanLiteral:
            case Token.NullLiteral:
            case Token.Keyword:
                key = this.finalize(node, new Node.Identifier(token.value));
                break;

            case Token.Punctuator:
                if (token.value === '[') {
                    key = this.isolateCoverGrammar(this.parseAssignmentExpression);
                    this.expect(']');
                } else {
                    this.throwUnexpectedToken(token);
                }
                break;

            default:
                this.throwUnexpectedToken(token);
        }

        return key;
    }

    isPropertyKey(key, value) {
        return (key.type === Syntax.Identifier && key.name === value) ||
            (key.type === Syntax.Literal && key.value === value);
    }

    checkDuplicatedProto(key, hasProto) {
        if (this.isPropertyKey(key, '__proto__')) {
            if (hasProto.value) {
                this.tolerateError(Messages.DuplicateProtoProperty);
            } else {
                hasProto.value = true;
            }
        }
    }

    parseObjectProperty(hasProto): Node.Property {
        const node = this.createNode();
        const token = this.lookahead;

        let kind: string;
        let key: Node.PropertyKey;
        let value: Node.PropertyValue;

        let computed = false;
        let method = false;
        let shorthand = false;

        if (token.type === Token.Identifier) {
            this.nextToken();
            key = this.finalize(node, new Node.Identifier(token.value));
        } else if (this.match('*')) {
            this.nextToken();
        } else {
            computed = this.match('[');
            key = this.parseObjectPropertyKey();
        }

        const lookaheadPropertyKey = this.qualifiedPropertyName(this.lookahead);
        if (token.type === Token.Identifier && token.value === 'get' && lookaheadPropertyKey) {
            kind = 'get';
            computed = this.match('[');
            key = this.parseObjectPropertyKey();
            this.context.allowYield = false;
            value = this.parseGetterMethod();

        } else if (token.type === Token.Identifier && token.value === 'set' && lookaheadPropertyKey) {
            kind = 'set';
            computed = this.match('[');
            key = this.parseObjectPropertyKey();
            value = this.parseSetterMethod();

        } else if (token.type === Token.Punctuator && token.value === '*' && lookaheadPropertyKey) {
            kind = 'init';
            computed = this.match('[');
            key = this.parseObjectPropertyKey();
            value = this.parseGeneratorMethod();
            method = true;

        } else {
            if (!key) {
                this.throwUnexpectedToken(this.lookahead);
            }

            kind = 'init';
            if (this.match(':')) {
                if (!computed) {
                    this.checkDuplicatedProto(key, hasProto);
                }
                this.nextToken();
                value = this.inheritCoverGrammar(this.parseAssignmentExpression);

            } else if (this.match('(')) {
                value = this.parsePropertyMethodFunction();
                method = true;

            } else if (token.type === Token.Identifier) {
                this.checkDuplicatedProto(key, hasProto);
                const id = <Node.Identifier>key;
                if (this.match('=')) {
                    this.context.firstCoverInitializedNameError = this.lookahead;
                    this.nextToken();
                    shorthand = true;
                    const init = this.isolateCoverGrammar(this.parseAssignmentExpression);
                    value = this.finalize(node, new Node.AssignmentPattern(id, init));
                } else {
                    shorthand = true;
                    value = id;
                }
            } else {
                this.throwUnexpectedToken(this.nextToken());
            }
        }

        return this.finalize(node, new Node.Property(kind, key, computed, value, method, shorthand));
    }

    parseObjectInitializer(): Node.ObjectExpression {
        const node = this.createNode();

        this.expect('{');
        const properties: Node.Property[] = [];
        let hasProto = { value: false };
        while (!this.match('}')) {
            properties.push(this.parseObjectProperty(hasProto));
            if (!this.match('}')) {
                this.expectCommaSeparator();
            }
        }
        this.expect('}');

        return this.finalize(node, new Node.ObjectExpression(properties));
    }

    // ECMA-262 12.2.9 Template Literals

    parseTemplateHead(): Node.TemplateElement {
        assert(this.lookahead.head, 'Template literal must start with a template head');

        const node = this.createNode();
        const token = this.nextToken();
        const value = {
            raw: token.value.raw,
            cooked: token.value.cooked
        };

        return this.finalize(node, new Node.TemplateElement(value, token.tail));
    }

    parseTemplateElement(): Node.TemplateElement {
        if (this.lookahead.type !== Token.Template) {
            this.throwUnexpectedToken();
        }

        const node = this.createNode();
        const token = this.nextToken();
        const value = {
            raw: token.value.raw,
            cooked: token.value.cooked
        };

        return this.finalize(node, new Node.TemplateElement(value, token.tail));
    }

    parseTemplateLiteral(): Node.TemplateLiteral {
        const node = this.createNode();

        const expressions = [];
        const quasis = [];

        let quasi = this.parseTemplateHead();
        quasis.push(quasi);
        while (!quasi.tail) {
            expressions.push(this.parseExpression());
            quasi = this.parseTemplateElement();
            quasis.push(quasi);
        }

        return this.finalize(node, new Node.TemplateLiteral(quasis, expressions));
    }

    // ECMA-262 12.2.10 The Grouping Operator

    reinterpretExpressionAsPattern(expr) {
        switch (expr.type) {
            case Syntax.Identifier:
            case Syntax.MemberExpression:
            case Syntax.RestElement:
            case Syntax.AssignmentPattern:
                break;
            case Syntax.SpreadElement:
                expr.type = Syntax.RestElement;
                this.reinterpretExpressionAsPattern(expr.argument);
                break;
            case Syntax.ArrayExpression:
                expr.type = Syntax.ArrayPattern;
                for (let i = 0; i < expr.elements.length; i++) {
                    if (expr.elements[i] !== null) {
                        this.reinterpretExpressionAsPattern(expr.elements[i]);
                    }
                }
                break;
            case Syntax.ObjectExpression:
                expr.type = Syntax.ObjectPattern;
                for (let i = 0; i < expr.properties.length; i++) {
                    this.reinterpretExpressionAsPattern(expr.properties[i].value);
                }
                break;
            case Syntax.AssignmentExpression:
                expr.type = Syntax.AssignmentPattern;
                this.reinterpretExpressionAsPattern(expr.left);
                break;
            default:
                // Allow other node type for tolerant parsing.
                break;
        }
    }

    parseGroupExpression(): ArrowParameterPlaceHolderNode | Node.Expression {
        let expr;

        this.expect('(');
        if (this.match(')')) {
            this.nextToken();
            if (!this.match('=>')) {
                this.expect('=>');
            }
            expr = {
                type: ArrowParameterPlaceHolder,
                params: []
            };
        } else {
            const startToken = this.lookahead;
            let params = [];
            if (this.match('...')) {
                expr = this.parseRestElement(params);
                this.expect(')');
                if (!this.match('=>')) {
                    this.expect('=>');
                }
                expr = {
                    type: ArrowParameterPlaceHolder,
                    params: [expr]
                };
            } else {
                let arrow = false;
                this.context.isBindingElement = true;
                expr = this.inheritCoverGrammar(this.parseAssignmentExpression);

                if (this.match(',')) {
                    const expressions = [];

                    this.context.isAssignmentTarget = false;
                    expressions.push(expr);
                    while (this.startMarker.index < this.scanner.length) {
                        if (!this.match(',')) {
                            break;
                        }
                        this.nextToken();

                        if (this.match('...')) {
                            if (!this.context.isBindingElement) {
                                this.throwUnexpectedToken(this.lookahead);
                            }
                            expressions.push(this.parseRestElement(params));
                            this.expect(')');
                            if (!this.match('=>')) {
                                this.expect('=>');
                            }
                            this.context.isBindingElement = false;
                            for (let i = 0; i < expressions.length; i++) {
                                this.reinterpretExpressionAsPattern(expressions[i]);
                            }
                            arrow = true;
                            expr = {
                                type: ArrowParameterPlaceHolder,
                                params: expressions
                            };
                        } else {
                            expressions.push(this.inheritCoverGrammar(this.parseAssignmentExpression));
                        }
                        if (arrow) {
                            break;
                        }
                    }
                    if (!arrow) {
                        expr = this.finalize(this.startNode(startToken), new Node.SequenceExpression(expressions));
                    }
                }

                if (!arrow) {
                    this.expect(')');
                    if (this.match('=>')) {
                        if (expr.type === Syntax.Identifier && expr.name === 'yield') {
                            arrow = true;
                            expr = {
                                type: ArrowParameterPlaceHolder,
                                params: [expr]
                            };
                        }
                        if (!arrow) {
                            if (!this.context.isBindingElement) {
                                this.throwUnexpectedToken(this.lookahead);
                            }

                            if (expr.type === Syntax.SequenceExpression) {
                                for (let i = 0; i < expr.expressions.length; i++) {
                                    this.reinterpretExpressionAsPattern(expr.expressions[i]);
                                }
                            } else {
                                this.reinterpretExpressionAsPattern(expr);
                            }

                            const params = (expr.type === Syntax.SequenceExpression ? expr.expressions : [expr]);
                            expr = {
                                type: ArrowParameterPlaceHolder,
                                params: params
                            };
                        }
                    }
                    this.context.isBindingElement = false;
                }
            }
        }

        return expr;
    }

    // ECMA-262 12.3 Left-Hand-Side Expressions

    parseArguments(): Node.ArgumentListElement[] {
        this.expect('(');
        const args = [];
        if (!this.match(')')) {
            while (true) {
                const expr = this.match('...') ? this.parseSpreadElement() :
                    this.isolateCoverGrammar(this.parseAssignmentExpression);
                args.push(expr);
                if (this.match(')')) {
                    break;
                }
                this.expectCommaSeparator();
            }
        }
        this.expect(')');

        return args;
    }

    isIdentifierName(token): boolean {
        return token.type === Token.Identifier ||
            token.type === Token.Keyword ||
            token.type === Token.BooleanLiteral ||
            token.type === Token.NullLiteral;
    }

    parseNonComputedProperty(): Node.Identifier {
        const node = this.createNode();
        const token = this.nextToken();
        if (!this.isIdentifierName(token)) {
            this.throwUnexpectedToken(token);
        }
        return this.finalize(node, new Node.Identifier(token.value));
    }

    parseNewExpression(): Node.MetaProperty | Node.NewExpression {
        const node = this.createNode();

        const id = this.parseNonComputedProperty();
        assert(id.name === 'new', 'New expression must start with `new`');

        let expr;
        if (this.match('.')) {
            this.nextToken();
            if (this.lookahead.type === Token.Identifier && this.context.inFunctionBody && this.lookahead.value === 'target') {
                const property = this.parseNonComputedProperty();
                expr = new Node.MetaProperty(id, property);
            } else {
                this.throwUnexpectedToken(this.lookahead);
            }
        } else {
            const callee = this.isolateCoverGrammar(this.parseLeftHandSideExpression);
            const args = this.match('(') ? this.parseArguments() : [];
            expr = new Node.NewExpression(callee, args);
            this.context.isAssignmentTarget = false;
            this.context.isBindingElement = false;
        }

        return this.finalize(node, expr);
    }

    parseLeftHandSideExpressionAllowCall(): Node.Expression {
        const startToken = this.lookahead;
        const previousAllowIn = this.context.allowIn;
        this.context.allowIn = true;

        let expr;
        if (this.matchKeyword('super') && this.context.inFunctionBody) {
            expr = this.createNode();
            this.nextToken();
            expr = this.finalize(expr, new Node.Super());
            if (!this.match('(') && !this.match('.') && !this.match('[')) {
                this.throwUnexpectedToken(this.lookahead);
            }
        } else {
            expr = this.inheritCoverGrammar(this.matchKeyword('new') ? this.parseNewExpression : this.parsePrimaryExpression);
        }

        while (true) {
            if (this.match('.')) {
                this.context.isBindingElement = false;
                this.context.isAssignmentTarget = true;
                this.expect('.');
                const property = this.parseNonComputedProperty();
                expr = this.finalize(this.startNode(startToken), new Node.StaticMemberExpression(expr, property));

            } else if (this.match('(')) {
                this.context.isBindingElement = false;
                this.context.isAssignmentTarget = false;
                const args = this.parseArguments();
                expr = this.finalize(this.startNode(startToken), new Node.CallExpression(expr, args));

            } else if (this.match('[')) {
                this.context.isBindingElement = false;
                this.context.isAssignmentTarget = true;
                this.expect('[');
                const property = this.isolateCoverGrammar(this.parseExpression);
                this.expect(']');
                expr = this.finalize(this.startNode(startToken), new Node.ComputedMemberExpression(expr, property));

            } else if (this.lookahead.type === Token.Template && this.lookahead.head) {
                const quasi = this.parseTemplateLiteral();
                expr = this.finalize(this.startNode(startToken), new Node.TaggedTemplateExpression(expr, quasi));

            } else {
                break;
            }
        }
        this.context.allowIn = previousAllowIn;

        return expr;
    }

    parseSuper(): Node.Super {
        const node = this.createNode();

        this.expectKeyword('super');
        if (!this.match('[') && !this.match('.')) {
            this.throwUnexpectedToken(this.lookahead);
        }

        return this.finalize(node, new Node.Super());
    }

    parseLeftHandSideExpression(): Node.Expression {
        assert(this.context.allowIn, 'callee of new expression always allow in keyword.');

        const node = this.startNode(this.lookahead);
        let expr = (this.matchKeyword('super') && this.context.inFunctionBody) ? this.parseSuper() :
            this.inheritCoverGrammar(this.matchKeyword('new') ? this.parseNewExpression : this.parsePrimaryExpression);

        while (true) {
            if (this.match('[')) {
                this.context.isBindingElement = false;
                this.context.isAssignmentTarget = true;
                this.expect('[');
                const property = this.isolateCoverGrammar(this.parseExpression);
                this.expect(']');
                expr = this.finalize(node, new Node.ComputedMemberExpression(expr, property));

            } else if (this.match('.')) {
                this.context.isBindingElement = false;
                this.context.isAssignmentTarget = true;
                this.expect('.');
                const property = this.parseNonComputedProperty();
                expr = this.finalize(node, new Node.StaticMemberExpression(expr, property));

            } else if (this.lookahead.type === Token.Template && this.lookahead.head) {
                const quasi = this.parseTemplateLiteral();
                expr = this.finalize(node, new Node.TaggedTemplateExpression(expr, quasi));

            } else {
                break;
            }
        }

        return expr;
    }

    // ECMA-262 12.4 Postfix Expressions

    parsePostfixExpression(): Node.Expression {
        const startToken = this.lookahead;
        let expr = this.inheritCoverGrammar(this.parseLeftHandSideExpressionAllowCall);

        if (!this.hasLineTerminator && this.lookahead.type === Token.Punctuator) {
            if (this.match('++') || this.match('--')) {
                if (this.context.strict && expr.type === Syntax.Identifier && this.scanner.isRestrictedWord(expr.name)) {
                    this.tolerateError(Messages.StrictLHSPostfix);
                }
                if (!this.context.isAssignmentTarget) {
                    this.tolerateError(Messages.InvalidLHSInAssignment);
                }
                this.context.isAssignmentTarget = false;
                this.context.isBindingElement = false;
                const operator = this.nextToken().value;
                const prefix = false;
                expr = this.finalize(this.startNode(startToken), new Node.UpdateExpression(operator, expr, prefix));
            }
        }

        return expr;
    }

    // ECMA-262 12.5 Unary Operators

    parseUnaryExpression(): Node.Expression {
        let expr;

        if (this.lookahead.type !== Token.Punctuator && this.lookahead.type !== Token.Keyword) {
            expr = this.parsePostfixExpression();

        } else if (this.match('++') || this.match('--')) {
            const node = this.startNode(this.lookahead);
            const token = this.nextToken();
            expr = this.inheritCoverGrammar(this.parseUnaryExpression);
            if (this.context.strict && expr.type === Syntax.Identifier && this.scanner.isRestrictedWord(expr.name)) {
                this.tolerateError(Messages.StrictLHSPrefix);
            }
            if (!this.context.isAssignmentTarget) {
                this.tolerateError(Messages.InvalidLHSInAssignment);
            }
            const prefix = true;
            expr = this.finalize(node, new Node.UpdateExpression(token.value, expr, prefix));
            this.context.isAssignmentTarget = false;
            this.context.isBindingElement = false;

        } else if (this.match('+') || this.match('-') || this.match('~') || this.match('!')) {
            const node = this.startNode(this.lookahead);
            const token = this.nextToken();
            expr = this.inheritCoverGrammar(this.parseUnaryExpression);
            expr = this.finalize(node, new Node.UnaryExpression(token.value, expr));
            this.context.isAssignmentTarget = false;
            this.context.isBindingElement = false;

        } else if (this.matchKeyword('delete') || this.matchKeyword('void') || this.matchKeyword('typeof')) {
            const node = this.startNode(this.lookahead);
            const token = this.nextToken();
            expr = this.inheritCoverGrammar(this.parseUnaryExpression);
            expr = this.finalize(node, new Node.UnaryExpression(token.value, expr));
            if (this.context.strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
                this.tolerateError(Messages.StrictDelete);
            }
            this.context.isAssignmentTarget = false;
            this.context.isBindingElement = false;

        } else {
            expr = this.parsePostfixExpression();
        }

        return expr;
    }
    // ECMA-262 12.6 Multiplicative Operators
    // ECMA-262 12.7 Additive Operators
    // ECMA-262 12.8 Bitwise Shift Operators
    // ECMA-262 12.9 Relational Operators
    // ECMA-262 12.10 Equality Operators
    // ECMA-262 12.11 Binary Bitwise Operators
    // ECMA-262 12.12 Binary Logical Operators

    binaryPrecedence(token): number {
        const op = token.value;
        let precedence;
        if (token.type === Token.Punctuator) {
            precedence = this.operatorPrecedence[op] || 0;
        } else if (token.type === Token.Keyword) {
            precedence = (op === 'instanceof' || (this.context.allowIn && op === 'in')) ? 7 : 0;
        } else {
            precedence = 0;
        }
        return precedence;
    }

    parseBinaryExpression(): Node.Expression {
        const startToken = this.lookahead;

        let expr = this.inheritCoverGrammar(this.parseUnaryExpression);

        let token = this.lookahead;
        let prec = this.binaryPrecedence(token);
        if (prec > 0) {
            this.nextToken();

            token.prec = prec;
            this.context.isAssignmentTarget = false;
            this.context.isBindingElement = false;

            const markers = [startToken, this.lookahead];
            let left = expr;
            let right = this.isolateCoverGrammar(this.parseUnaryExpression);

            const stack = [left, token, right];
            while (true) {
                prec = this.binaryPrecedence(this.lookahead);
                if (prec <= 0) {
                    break;
                }

                // Reduce: make a binary expression from the three topmost entries.
                while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
                    right = stack.pop();
                    const operator = stack.pop().value;
                    left = stack.pop();
                    markers.pop();
                    const node = this.startNode(markers[markers.length - 1]);
                    stack.push(this.finalize(node, new Node.BinaryExpression(operator, left, right)));
                }

                // Shift.
                token = this.nextToken();
                token.prec = prec;
                stack.push(token);
                markers.push(this.lookahead);
                stack.push(this.isolateCoverGrammar(this.parseUnaryExpression));
            }

            // Final reduce to clean-up the stack.
            let i = stack.length - 1;
            expr = stack[i];
            markers.pop();
            while (i > 1) {
                const node = this.startNode(markers.pop());
                expr = this.finalize(node, new Node.BinaryExpression(stack[i - 1].value, stack[i - 2], expr));
                i -= 2;
            }
        }

        return expr;
    }

    // ECMA-262 12.13 Conditional Operator

    parseConditionalExpression(): Node.Expression {
        const startToken = this.lookahead;

        let expr = this.inheritCoverGrammar(this.parseBinaryExpression);
        if (this.match('?')) {
            this.nextToken();

            const previousAllowIn = this.context.allowIn;
            this.context.allowIn = true;
            const consequent = this.isolateCoverGrammar(this.parseAssignmentExpression);
            this.context.allowIn = previousAllowIn;

            this.expect(':');
            const alternate = this.isolateCoverGrammar(this.parseAssignmentExpression);

            expr = this.finalize(this.startNode(startToken), new Node.ConditionalExpression(expr, consequent, alternate));
            this.context.isAssignmentTarget = false;
            this.context.isBindingElement = false;
        }

        return expr;
    }

    // ECMA-262 12.14 Assignment Operators

    checkPatternParam(options, param) {
        switch (param.type) {
            case Syntax.Identifier:
                this.validateParam(options, param, param.name);
                break;
            case Syntax.RestElement:
                this.checkPatternParam(options, param.argument);
                break;
            case Syntax.AssignmentPattern:
                this.checkPatternParam(options, param.left);
                break;
            case Syntax.ArrayPattern:
                for (let i = 0; i < param.elements.length; i++) {
                    if (param.elements[i] !== null) {
                        this.checkPatternParam(options, param.elements[i]);
                    }
                }
                break;
            case Syntax.YieldExpression:
                break;
            default:
                assert(param.type === Syntax.ObjectPattern, 'Invalid type');
                for (let i = 0; i < param.properties.length; i++) {
                    this.checkPatternParam(options, param.properties[i].value);
                }
                break;
        }
    }

    reinterpretAsCoverFormalsList(expr) {
        let params = [expr];
        let options;

        switch (expr.type) {
            case Syntax.Identifier:
                break;
            case ArrowParameterPlaceHolder:
                params = expr.params;
                break;
            default:
                return null;
        }

        options = {
            paramSet: {}
        };

        for (let i = 0; i < params.length; ++i) {
            const param = params[i];
            switch (param.type) {
                case Syntax.AssignmentPattern:
                    params[i] = param.left;
                    if (param.right.type === Syntax.YieldExpression) {
                        if (param.right.argument) {
                            this.throwUnexpectedToken(this.lookahead);
                        }
                        param.right.type = Syntax.Identifier;
                        param.right.name = 'yield';
                        delete param.right.argument;
                        delete param.right.delegate;
                    }
                    this.checkPatternParam(options, param.left);
                    break;
                default:
                    this.checkPatternParam(options, param);
                    params[i] = param;
                    break;
            }
        }

        if (this.context.strict || !this.context.allowYield) {
            for (let i = 0; i < params.length; ++i) {
                const param = params[i];
                if (param.type === Syntax.YieldExpression) {
                    this.throwUnexpectedToken(this.lookahead);
                }
            }
        }

        if (options.message === Messages.StrictParamDupe) {
            const token = this.context.strict ? options.stricted : options.firstRestricted;
            this.throwUnexpectedToken(token, options.message);
        }

        return {
            params: params,
            stricted: options.stricted,
            firstRestricted: options.firstRestricted,
            message: options.message
        };
    }

    parseAssignmentExpression(): Node.Expression {
        let expr;

        if (!this.context.allowYield && this.matchKeyword('yield')) {
            expr = this.parseYieldExpression();
        } else {
            const startToken = this.lookahead;
            let token = startToken;
            expr = this.parseConditionalExpression();

            if (expr.type === ArrowParameterPlaceHolder || this.match('=>')) {

                // ECMA-262 14.2 Arrow Function Definitions
                this.context.isAssignmentTarget = false;
                this.context.isBindingElement = false;
                const list = this.reinterpretAsCoverFormalsList(expr);

                if (list) {
                    if (this.hasLineTerminator) {
                        this.tolerateUnexpectedToken(this.lookahead);
                    }
                    this.context.firstCoverInitializedNameError = null;

                    const previousStrict = this.context.strict;
                    const previousAllowYield = this.context.allowYield;
                    this.context.allowYield = true;

                    const node = this.startNode(startToken);
                    this.expect('=>');
                    const body = this.match('{') ? this.parseFunctionSourceElements() :
                        this.isolateCoverGrammar(this.parseAssignmentExpression);
                    const expression = body.type !== Syntax.BlockStatement;

                    if (this.context.strict && list.firstRestricted) {
                        this.throwUnexpectedToken(list.firstRestricted, list.message);
                    }
                    if (this.context.strict && list.stricted) {
                        this.tolerateUnexpectedToken(list.stricted, list.message);
                    }
                    expr = this.finalize(node, new Node.ArrowFunctionExpression(list.params, body, expression));

                    this.context.strict = previousStrict;
                    this.context.allowYield = previousAllowYield;
                }
            } else {

                if (this.matchAssign()) {
                    if (!this.context.isAssignmentTarget) {
                        this.tolerateError(Messages.InvalidLHSInAssignment);
                    }

                    if (this.context.strict && expr.type === Syntax.Identifier) {
                        const id = <Node.Identifier>(expr);
                        if (this.scanner.isRestrictedWord(id.name)) {
                            this.tolerateUnexpectedToken(token, Messages.StrictLHSAssignment);
                        }
                        if (this.scanner.isStrictModeReservedWord(id.name)) {
                            this.tolerateUnexpectedToken(token, Messages.StrictReservedWord);
                        }
                    }

                    if (!this.match('=')) {
                        this.context.isAssignmentTarget = false;
                        this.context.isBindingElement = false;
                    } else {
                        this.reinterpretExpressionAsPattern(expr);
                    }

                    token = this.nextToken();
                    const right = this.isolateCoverGrammar(this.parseAssignmentExpression);
                    expr = this.finalize(this.startNode(startToken), new Node.AssignmentExpression(token.value, expr, right));
                    this.context.firstCoverInitializedNameError = null;
                }
            }
        }

        return expr;
    }

    // ECMA-262 12.15 Comma Operator

    parseExpression(): Node.Expression | Node.SequenceExpression {
        const startToken = this.lookahead;
        let expr = this.isolateCoverGrammar(this.parseAssignmentExpression);

        if (this.match(',')) {
            const expressions = [];
            expressions.push(expr);
            while (this.startMarker.index < this.scanner.length) {
                if (!this.match(',')) {
                    break;
                }
                this.nextToken();
                expressions.push(this.isolateCoverGrammar(this.parseAssignmentExpression));
            }

            expr = this.finalize(this.startNode(startToken), new Node.SequenceExpression(expressions));
        }

        return expr;
    }

    // ECMA-262 13.2 Block

    parseStatementListItem(): Node.StatementListItem {
        let statement = null;
        if (this.lookahead.type === Token.Keyword) {
            switch (this.lookahead.value) {
                case 'export':
                    if (this.sourceType !== 'module') {
                        this.tolerateUnexpectedToken(this.lookahead, Messages.IllegalExportDeclaration);
                    }
                    statement = this.parseExportDeclaration();
                    break;
                case 'import':
                    if (this.sourceType !== 'module') {
                        this.tolerateUnexpectedToken(this.lookahead, Messages.IllegalImportDeclaration);
                    }
                    statement = this.parseImportDeclaration();
                    break;
                case 'const':
                    statement = this.parseLexicalDeclaration({ inFor: false });
                    break;
                case 'function':
                    statement = this.parseFunctionDeclaration();
                    break;
                case 'class':
                    statement = this.parseClassDeclaration();
                    break;
                case 'let':
                    statement = this.isLexicalDeclaration() ? this.parseLexicalDeclaration({ inFor: false }) : this.parseStatement();
                    break;
                default:
                    statement = this.parseStatement();
                    break;
            }
        } else {
            statement = this.parseStatement();
        }

        return statement;
    }

    parseBlock(): Node.BlockStatement {
        const node = this.createNode();

        this.expect('{');
        const block: Node.Statement[] = [];
        while (true) {
            if (this.match('}')) {
                break;
            }
            block.push(this.parseStatementListItem());
        }
        this.expect('}');

        return this.finalize(node, new Node.BlockStatement(block));
    }

    // ECMA-262 13.3.1 Let and Const Declarations

    parseLexicalBinding(kind: string, options): Node.VariableDeclarator {
        const node = this.createNode();
        let params = [];
        const id = this.parsePattern(params, kind);

        // ECMA-262 12.2.1
        if (this.context.strict && id.type === Syntax.Identifier) {
            if (this.scanner.isRestrictedWord((<Node.Identifier>(id)).name)) {
                this.tolerateError(Messages.StrictVarName);
            }
        }

        let init = null;
        if (kind === 'const') {
            if (!this.matchKeyword('in') && !this.matchContextualKeyword('of')) {
                this.expect('=');
                init = this.isolateCoverGrammar(this.parseAssignmentExpression);
            }
        } else if ((!options.inFor && id.type !== Syntax.Identifier) || this.match('=')) {
            this.expect('=');
            init = this.isolateCoverGrammar(this.parseAssignmentExpression);
        }

        return this.finalize(node, new Node.VariableDeclarator(id, init));
    }

    parseBindingList(kind: string, options): Node.VariableDeclarator[] {
        let list = [this.parseLexicalBinding(kind, options)];

        while (this.match(',')) {
            this.nextToken();
            list.push(this.parseLexicalBinding(kind, options));
        }

        return list;
    }

    isLexicalDeclaration(): boolean {
        const previousIndex = this.scanner.index;
        const previousLineNumber = this.scanner.lineNumber;
        const previousLineStart = this.scanner.lineStart;
        this.collectComments();
        const next = <any>this.scanner.lex();
        this.scanner.index = previousIndex;
        this.scanner.lineNumber = previousLineNumber;
        this.scanner.lineStart = previousLineStart;

        return (next.type === Token.Identifier) ||
            (next.type === Token.Punctuator && next.value === '[') ||
            (next.type === Token.Punctuator && next.value === '{') ||
            (next.type === Token.Keyword && next.value === 'let') ||
            (next.type === Token.Keyword && next.value === 'yield');
    }

    parseLexicalDeclaration(options): Node.VariableDeclaration {
        const node = this.createNode();
        const kind = this.nextToken().value;
        assert(kind === 'let' || kind === 'const', 'Lexical declaration must be either let or const');

        const declarations = this.parseBindingList(kind, options);
        this.consumeSemicolon();

        return this.finalize(node, new Node.VariableDeclaration(declarations, kind));
    }

    // ECMA-262 13.3.3 Destructuring Binding Patterns

    parseBindingRestElement(params, kind: string): Node.RestElement {
        const node = this.createNode();
        this.expect('...');
        params.push(this.lookahead);
        const arg = this.parseVariableIdentifier(kind);
        return this.finalize(node, new Node.RestElement(arg));
    }

    parseArrayPattern(params, kind: string): Node.ArrayPattern {
        const node = this.createNode();

        this.expect('[');
        const elements: Node.ArrayPatternElement[] = [];
        while (!this.match(']')) {
            if (this.match(',')) {
                this.nextToken();
                elements.push(null);
            } else {
                if (this.match('...')) {
                    elements.push(this.parseBindingRestElement(params, kind));
                    break;
                } else {
                    elements.push(this.parsePatternWithDefault(params, kind));
                }
                if (!this.match(']')) {
                    this.expect(',');
                }
            }

        }
        this.expect(']');

        return this.finalize(node, new Node.ArrayPattern(elements));
    }

    parsePropertyPattern(params, kind: string): Node.Property {
        const node = this.createNode();

        let computed = false;
        let shorthand = false;
        const method = false;

        let key: Node.PropertyKey;
        let value: Node.PropertyValue;

        if (this.lookahead.type === Token.Identifier) {
            const keyToken = this.lookahead;
            const id = this.parseVariableIdentifier();
            if (this.match('=')) {
                params.push(keyToken);
                shorthand = true;
                this.nextToken();
                key = id;
                const expr = this.parseAssignmentExpression();
                value = this.finalize(this.startNode(keyToken), new Node.AssignmentPattern(id, expr));
            } else if (!this.match(':')) {
                params.push(keyToken);
                shorthand = true;
                key = value = id;
            } else {
                this.expect(':');
                key = id;
                value = this.parsePatternWithDefault(params, kind);
            }
        } else {
            computed = this.match('[');
            key = this.parseObjectPropertyKey();
            this.expect(':');
            value = this.parsePatternWithDefault(params, kind);
        }

        return this.finalize(node, new Node.Property('init', key, computed, value, method, shorthand));
    }

    parseObjectPattern(params, kind: string): Node.ObjectPattern {
        const node = this.createNode();
        const properties: Node.Property[] = [];

        this.expect('{');
        while (!this.match('}')) {
            properties.push(this.parsePropertyPattern(params, kind));
            if (!this.match('}')) {
                this.expect(',');
            }
        }
        this.expect('}');

        return this.finalize(node, new Node.ObjectPattern(properties));
    }

    parsePattern(params, kind?: string): Node.BindingIdentifier | Node.BindingPattern {
        let pattern;

        if (this.match('[')) {
            pattern = this.parseArrayPattern(params, kind);
        } else if (this.match('{')) {
            pattern = this.parseObjectPattern(params, kind);
        } else {
            if (this.matchKeyword('let') && (kind === 'const' || kind === 'let')) {
                this.tolerateUnexpectedToken(this.lookahead, Messages.UnexpectedToken);
            }
            params.push(this.lookahead);
            pattern = this.parseVariableIdentifier(kind);
        }

        return pattern;
    }

    parsePatternWithDefault(params, kind?: string): Node.AssignmentPattern | Node.BindingIdentifier | Node.BindingPattern {
        const startToken = this.lookahead;

        let pattern = this.parsePattern(params, kind);
        if (this.match('=')) {
            this.nextToken();
            const previousAllowYield = this.context.allowYield;
            this.context.allowYield = true;
            const right = this.isolateCoverGrammar(this.parseAssignmentExpression);
            this.context.allowYield = previousAllowYield;
            pattern = this.finalize(this.startNode(startToken), new Node.AssignmentPattern(pattern, right));
        }

        return pattern;
    }

    // ECMA-262 13.3.2 Variable Statement

    parseVariableIdentifier(kind?: string): Node.Identifier {
        const node = this.createNode();

        const token = this.nextToken();
        if (token.type === Token.Keyword && token.value === 'yield') {
            if (this.context.strict) {
                this.tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            } if (!this.context.allowYield) {
                this.throwUnexpectedToken(token);
            }
        } else if (token.type !== Token.Identifier) {
            if (this.context.strict && token.type === Token.Keyword && this.scanner.isStrictModeReservedWord(token.value)) {
                this.tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            } else {
                if (this.context.strict || token.value !== 'let' || kind !== 'var') {
                    this.throwUnexpectedToken(token);
                }
            }
        } else if (this.sourceType === 'module' && token.type === Token.Identifier && token.value === 'await') {
            this.tolerateUnexpectedToken(token);
        }

        return this.finalize(node, new Node.Identifier(token.value));
    }

    parseVariableDeclaration(options: DeclarationOptions): Node.VariableDeclarator {
        const node = this.createNode();

        let params = [];
        const id = this.parsePattern(params, 'var');

        // ECMA-262 12.2.1
        if (this.context.strict && id.type === Syntax.Identifier) {
            if (this.scanner.isRestrictedWord((<Node.Identifier>(id)).name)) {
                this.tolerateError(Messages.StrictVarName);
            }
        }

        let init = null;
        if (this.match('=')) {
            this.nextToken();
            init = this.isolateCoverGrammar(this.parseAssignmentExpression);
        } else if (id.type !== Syntax.Identifier && !options.inFor) {
            this.expect('=');
        }

        return this.finalize(node, new Node.VariableDeclarator(id, init));
    }

    parseVariableDeclarationList(options): Node.VariableDeclarator[] {
        const opt: DeclarationOptions = { inFor: options.inFor };

        const list: Node.VariableDeclarator[] = [];
        list.push(this.parseVariableDeclaration(opt));
        while (this.match(',')) {
            this.nextToken();
            list.push(this.parseVariableDeclaration(opt));
        }

        return list;
    }

    parseVariableStatement(): Node.VariableDeclaration {
        const node = this.createNode();
        this.expectKeyword('var');
        const declarations = this.parseVariableDeclarationList({ inFor: false });
        this.consumeSemicolon();

        return this.finalize(node, new Node.VariableDeclaration(declarations, 'var'));
    }

    // ECMA-262 13.4 Empty Statement

    parseEmptyStatement(): Node.EmptyStatement {
        const node = this.createNode();
        this.expect(';');
        return this.finalize(node, new Node.EmptyStatement());
    }

    // ECMA-262 13.5 Expression Statement

    parseExpressionStatement(): Node.ExpressionStatement {
        const node = this.createNode();
        const expr = this.parseExpression();
        this.consumeSemicolon();
        return this.finalize(node, new Node.ExpressionStatement(expr));
    }

    // ECMA-262 13.6 If statement

    parseIfStatement(): Node.IfStatement {
        const node = this.createNode();
        let consequent;
        let alternate = null;

        this.expectKeyword('if');
        this.expect('(');
        const test = this.parseExpression();

        if (!this.match(')') && this.config.tolerant) {
            this.tolerateUnexpectedToken(this.nextToken());
            consequent = this.finalize(this.createNode(), new Node.EmptyStatement());
        } else {
            this.expect(')');
            consequent = this.parseStatement();
            if (this.matchKeyword('else')) {
                this.nextToken();
                alternate = this.parseStatement();
            }
        }

        return this.finalize(node, new Node.IfStatement(test, consequent, alternate));
    }

    // ECMA-262 13.7.2 The do-while Statement

    parseDoWhileStatement(): Node.DoWhileStatement {
        const node = this.createNode();
        this.expectKeyword('do');

        const previousInIteration = this.context.inIteration;
        this.context.inIteration = true;
        const body = this.parseStatement();
        this.context.inIteration = previousInIteration;

        this.expectKeyword('while');
        this.expect('(');
        const test = this.parseExpression();
        this.expect(')');
        if (this.match(';')) {
            this.nextToken();
        }

        return this.finalize(node, new Node.DoWhileStatement(body, test));
    }

    // ECMA-262 13.7.3 The while Statement

    parseWhileStatement(): Node.WhileStatement {
        const node = this.createNode();
        let body;

        this.expectKeyword('while');
        this.expect('(');
        const test = this.parseExpression();

        if (!this.match(')') && this.config.tolerant) {
            this.tolerateUnexpectedToken(this.nextToken());
            body = this.finalize(this.createNode(), new Node.EmptyStatement());
        } else {
            this.expect(')');

            const previousInIteration = this.context.inIteration;
            this.context.inIteration = true;
            body = this.parseStatement();
            this.context.inIteration = previousInIteration;
        }

        return this.finalize(node, new Node.WhileStatement(test, body));
    }

    // ECMA-262 13.7.4 The for Statement
    // ECMA-262 13.7.5 The for-in and for-of Statements

    parseForStatement(): Node.ForStatement | Node.ForInStatement | Node.ForOfStatement {
        let init = null;
        let test = null;
        let update = null;
        let forIn = true;
        let left, right;

        const node = this.createNode();
        this.expectKeyword('for');
        this.expect('(');

        if (this.match(';')) {
            this.nextToken();
        } else {
            if (this.matchKeyword('var')) {
                init = this.createNode();
                this.nextToken();

                const previousAllowIn = this.context.allowIn;
                this.context.allowIn = false;
                let declarations = this.parseVariableDeclarationList({ inFor: true });
                this.context.allowIn = previousAllowIn;

                if (declarations.length === 1 && this.matchKeyword('in')) {
                    init = this.finalize(init, new Node.VariableDeclaration(declarations, 'var'));
                    this.nextToken();
                    left = init;
                    right = this.parseExpression();
                    init = null;
                } else if (declarations.length === 1 && declarations[0].init === null && this.matchContextualKeyword('of')) {
                    init = this.finalize(init, new Node.VariableDeclaration(declarations, 'var'));
                    this.nextToken();
                    left = init;
                    right = this.parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    init = this.finalize(init, new Node.VariableDeclaration(declarations, 'var'));
                    this.expect(';');
                }
            } else if (this.matchKeyword('const') || this.matchKeyword('let')) {
                init = this.createNode();
                const kind = this.nextToken().value;

                if (!this.context.strict && this.lookahead.value === 'in') {
                    init = this.finalize(init, new Node.Identifier(kind));
                    this.nextToken();
                    left = init;
                    right = this.parseExpression();
                    init = null;
                } else {
                    const previousAllowIn = this.context.allowIn;
                    this.context.allowIn = false;
                    const declarations = this.parseBindingList(kind, { inFor: true });
                    this.context.allowIn = previousAllowIn;

                    if (declarations.length === 1 && declarations[0].init === null && this.matchKeyword('in')) {
                        init = this.finalize(init, new Node.VariableDeclaration(declarations, kind));
                        this.nextToken();
                        left = init;
                        right = this.parseExpression();
                        init = null;
                    } else if (declarations.length === 1 && declarations[0].init === null && this.matchContextualKeyword('of')) {
                        init = this.finalize(init, new Node.VariableDeclaration(declarations, kind));
                        this.nextToken();
                        left = init;
                        right = this.parseAssignmentExpression();
                        init = null;
                        forIn = false;
                    } else {
                        this.consumeSemicolon();
                        init = this.finalize(init, new Node.VariableDeclaration(declarations, kind));
                    }
                }
            } else {
                const initStartToken = this.lookahead;
                const previousAllowIn = this.context.allowIn;
                this.context.allowIn = false;
                init = this.inheritCoverGrammar(this.parseAssignmentExpression);
                this.context.allowIn = previousAllowIn;

                if (this.matchKeyword('in')) {
                    if (!this.context.isAssignmentTarget) {
                        this.tolerateError(Messages.InvalidLHSInForIn);
                    }

                    this.nextToken();
                    this.reinterpretExpressionAsPattern(init);
                    left = init;
                    right = this.parseExpression();
                    init = null;
                } else if (this.matchContextualKeyword('of')) {
                    if (!this.context.isAssignmentTarget) {
                        this.tolerateError(Messages.InvalidLHSInForLoop);
                    }

                    this.nextToken();
                    this.reinterpretExpressionAsPattern(init);
                    left = init;
                    right = this.parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    if (this.match(',')) {
                        let initSeq = [init];
                        while (this.match(',')) {
                            this.nextToken();
                            initSeq.push(this.isolateCoverGrammar(this.parseAssignmentExpression));
                        }
                        init = this.finalize(this.startNode(initStartToken), new Node.SequenceExpression(initSeq));
                    }
                    this.expect(';');
                }
            }
        }

        if (typeof left === 'undefined') {
            if (!this.match(';')) {
                test = this.parseExpression();
            }
            this.expect(';');
            if (!this.match(')')) {
                update = this.parseExpression();
            }
        }

        let body;
        if (!this.match(')') && this.config.tolerant) {
            this.tolerateUnexpectedToken(this.nextToken());
            body = this.finalize(this.createNode(), new Node.EmptyStatement());
        } else {
            this.expect(')');

            const previousInIteration = this.context.inIteration;
            this.context.inIteration = true;
            body = this.isolateCoverGrammar(this.parseStatement);
            this.context.inIteration = previousInIteration;
        }

        return (typeof left === 'undefined') ?
            this.finalize(node, new Node.ForStatement(init, test, update, body)) :
            forIn ? this.finalize(node, new Node.ForInStatement(left, right, body)) :
                this.finalize(node, new Node.ForOfStatement(left, right, body));
    }

    // ECMA-262 13.8 The continue statement

    parseContinueStatement(): Node.ContinueStatement {
        const node = this.createNode();
        this.expectKeyword('continue');

        let label = null;
        if (this.lookahead.type === Token.Identifier && !this.hasLineTerminator) {
            label = this.parseVariableIdentifier();

            const key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(this.context.labelSet, key)) {
                this.throwError(Messages.UnknownLabel, label.name);
            }
        }

        this.consumeSemicolon();
        if (label === null && !this.context.inIteration) {
            this.throwError(Messages.IllegalContinue);
        }

        return this.finalize(node, new Node.ContinueStatement(label));
    }

    // ECMA-262 13.9 The break statement

    parseBreakStatement(): Node.BreakStatement {
        const node = this.createNode();
        this.expectKeyword('break');

        let label = null;
        if (this.lookahead.type === Token.Identifier && !this.hasLineTerminator) {
            label = this.parseVariableIdentifier();

            const key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(this.context.labelSet, key)) {
                this.throwError(Messages.UnknownLabel, label.name);
            }
        }

        this.consumeSemicolon();
        if (label === null && !this.context.inIteration && !this.context.inSwitch) {
            this.throwError(Messages.IllegalBreak);
        }

        return this.finalize(node, new Node.BreakStatement(label));
    }

    // ECMA-262 13.10 The return statement

    parseReturnStatement(): Node.ReturnStatement {
        if (!this.context.inFunctionBody) {
            this.tolerateError(Messages.IllegalReturn);
        }

        const node = this.createNode();
        this.expectKeyword('return');

        const hasArgument = !this.match(';') && !this.match('}') &&
            !this.hasLineTerminator && this.lookahead.type !== Token.EOF;
        const argument = hasArgument ? this.parseExpression() : null;
        this.consumeSemicolon();

        return this.finalize(node, new Node.ReturnStatement(argument));
    }

    // ECMA-262 13.11 The with statement

    parseWithStatement(): Node.WithStatement {
        if (this.context.strict) {
            this.tolerateError(Messages.StrictModeWith);
        }

        const node = this.createNode();
        this.expectKeyword('with');
        this.expect('(');
        const object = this.parseExpression();
        this.expect(')');
        const body = this.parseStatement();

        return this.finalize(node, new Node.WithStatement(object, body));
    }

    // ECMA-262 13.12 The switch statement

    parseSwitchCase(): Node.SwitchCase {
        const node = this.createNode();

        let test;
        if (this.matchKeyword('default')) {
            this.nextToken();
            test = null;
        } else {
            this.expectKeyword('case');
            test = this.parseExpression();
        }
        this.expect(':');

        const consequent = [];
        while (true) {
            if (this.match('}') || this.matchKeyword('default') || this.matchKeyword('case')) {
                break;
            }
            consequent.push(this.parseStatementListItem());
        }

        return this.finalize(node, new Node.SwitchCase(test, consequent));
    }

    parseSwitchStatement(): Node.SwitchStatement {
        const node = this.createNode();
        this.expectKeyword('switch');

        this.expect('(');
        const discriminant = this.parseExpression();
        this.expect(')');

        const previousInSwitch = this.context.inSwitch;
        this.context.inSwitch = true;

        const cases = [];
        let defaultFound = false;
        this.expect('{');
        while (true) {
            if (this.match('}')) {
                break;
            }
            const clause = this.parseSwitchCase();
            if (clause.test === null) {
                if (defaultFound) {
                    this.throwError(Messages.MultipleDefaultsInSwitch);
                }
                defaultFound = true;
            }
            cases.push(clause);
        }
        this.expect('}');

        this.context.inSwitch = previousInSwitch;

        return this.finalize(node, new Node.SwitchStatement(discriminant, cases));
    }

    // ECMA-262 13.13 Labelled Statements

    parseLabelledStatement(): Node.LabeledStatement | Node.ExpressionStatement {
        const node = this.createNode();
        const expr = this.parseExpression();

        let statement: Node.ExpressionStatement | Node.LabeledStatement;
        if ((expr.type === Syntax.Identifier) && this.match(':')) {
            this.nextToken();

            const id = <Node.Identifier>(expr);
            const key = '$' + id.name;
            if (Object.prototype.hasOwnProperty.call(this.context.labelSet, key)) {
                this.throwError(Messages.Redeclaration, 'Label', id.name);
            }

            this.context.labelSet[key] = true;
            const labeledBody = this.parseStatement();
            delete this.context.labelSet[key];

            statement = new Node.LabeledStatement(id, labeledBody);
        } else {
            this.consumeSemicolon();
            statement = new Node.ExpressionStatement(expr);
        }

        return this.finalize(node, statement);
    }

    // ECMA-262 13.14 The throw statement

    parseThrowStatement(): Node.ThrowStatement {
        const node = this.createNode();
        this.expectKeyword('throw');

        if (this.hasLineTerminator) {
            this.throwError(Messages.NewlineAfterThrow);
        }

        const argument = this.parseExpression();
        this.consumeSemicolon();

        return this.finalize(node, new Node.ThrowStatement(argument));
    }

    // ECMA-262 13.15 The try statement

    parseCatchClause(): Node.CatchClause {
        const node = this.createNode();

        this.expectKeyword('catch');

        this.expect('(');
        if (this.match(')')) {
            this.throwUnexpectedToken(this.lookahead);
        }

        let params = [];
        const param = this.parsePattern(params);
        let paramMap = {};
        for (let i = 0; i < params.length; i++) {
            const key = '$' + params[i].value;
            if (Object.prototype.hasOwnProperty.call(paramMap, key)) {
                this.tolerateError(Messages.DuplicateBinding, params[i].value);
            }
            paramMap[key] = true;
        }

        if (this.context.strict && param.type === Syntax.Identifier) {
            if (this.scanner.isRestrictedWord((<Node.Identifier>(param)).name)) {
                this.tolerateError(Messages.StrictCatchVariable);
            }
        }

        this.expect(')');
        const body = this.parseBlock();

        return this.finalize(node, new Node.CatchClause(param, body));
    }

    parseFinallyClause(): Node.BlockStatement {
        this.expectKeyword('finally');
        return this.parseBlock();
    }

    parseTryStatement(): Node.TryStatement {
        const node = this.createNode();
        this.expectKeyword('try');

        const block = this.parseBlock();
        const handler = this.matchKeyword('catch') ? this.parseCatchClause() : null;
        const finalizer = this.matchKeyword('finally') ? this.parseFinallyClause() : null;

        if (!handler && !finalizer) {
            this.throwError(Messages.NoCatchOrFinally);
        }

        return this.finalize(node, new Node.TryStatement(block, handler, finalizer));
    }

    // ECMA-262 13.16 The debugger statement

    parseDebuggerStatement(): Node.DebuggerStatement {
        const node = this.createNode();
        this.expectKeyword('debugger');
        this.consumeSemicolon();
        return this.finalize(node, new Node.DebuggerStatement());
    }

    // ECMA-262 13 Statements

    parseStatement(): Node.Statement {
        this.context.isAssignmentTarget = true;
        this.context.isBindingElement = true;

        let statement = null;
        switch (this.lookahead.type) {
            case Token.BooleanLiteral:
            case Token.NullLiteral:
            case Token.NumericLiteral:
            case Token.StringLiteral:
            case Token.Template:
            case Token.RegularExpression:
                statement = this.parseExpressionStatement();
                break;

            case Token.Punctuator:
                const value = this.lookahead.value;
                if (value === '{') {
                    statement = this.parseBlock();
                } else if (value === '(') {
                    statement = this.parseExpressionStatement();
                } else if (value === ';') {
                    statement = this.parseEmptyStatement();
                } else {
                    statement = this.parseExpressionStatement();
                }
                break;

            case Token.Identifier:
                statement = this.parseLabelledStatement();
                break;

            case Token.Keyword:
                switch (this.lookahead.value) {
                    case 'break':
                        statement = this.parseBreakStatement();
                        break;
                    case 'continue':
                        statement = this.parseContinueStatement();
                        break;
                    case 'debugger':
                        statement = this.parseDebuggerStatement();
                        break;
                    case 'do':
                        statement = this.parseDoWhileStatement();
                        break;
                    case 'for':
                        statement = this.parseForStatement();
                        break;
                    case 'function':
                        statement = this.parseFunctionDeclaration();
                        break;
                    case 'if':
                        statement = this.parseIfStatement();
                        break;
                    case 'return':
                        statement = this.parseReturnStatement();
                        break;
                    case 'switch':
                        statement = this.parseSwitchStatement();
                        break;
                    case 'throw':
                        statement = this.parseThrowStatement();
                        break;
                    case 'try':
                        statement = this.parseTryStatement();
                        break;
                    case 'var':
                        statement = this.parseVariableStatement();
                        break;
                    case 'while':
                        statement = this.parseWhileStatement();
                        break;
                    case 'with':
                        statement = this.parseWithStatement();
                        break;
                    default:
                        statement = this.parseExpressionStatement();
                        break;
                }
                break;

            default:
                this.throwUnexpectedToken(this.lookahead);
        }

        return statement;
    }

    // ECMA-262 14.1 Function Definition

    parseFunctionSourceElements(): Node.BlockStatement {
        const node = this.createNode();

        this.expect('{');
        const body = this.parseDirectivePrologues();

        const previousLabelSet = this.context.labelSet;
        const previousInIteration = this.context.inIteration;
        const previousInSwitch = this.context.inSwitch;
        const previousInFunctionBody = this.context.inFunctionBody;

        this.context.labelSet = {};
        this.context.inIteration = false;
        this.context.inSwitch = false;
        this.context.inFunctionBody = true;

        while (this.startMarker.index < this.scanner.length) {
            if (this.match('}')) {
                break;
            }
            body.push(this.parseStatementListItem());
        }

        this.expect('}');

        this.context.labelSet = previousLabelSet;
        this.context.inIteration = previousInIteration;
        this.context.inSwitch = previousInSwitch;
        this.context.inFunctionBody = previousInFunctionBody;

        return this.finalize(node, new Node.BlockStatement(body));
    }

    validateParam(options, param, name) {
        const key = '$' + name;
        if (this.context.strict) {
            if (this.scanner.isRestrictedWord(name)) {
                options.stricted = param;
                options.message = Messages.StrictParamName;
            }
            if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.stricted = param;
                options.message = Messages.StrictParamDupe;
            }
        } else if (!options.firstRestricted) {
            if (this.scanner.isRestrictedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictParamName;
            } else if (this.scanner.isStrictModeReservedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictReservedWord;
            } else if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.stricted = param;
                options.message = Messages.StrictParamDupe;
            }
        }
        options.paramSet[key] = true;
    }

    parseRestElement(params): Node.RestElement {
        const node = this.createNode();

        this.nextToken();
        if (this.match('{')) {
            this.throwError(Messages.ObjectPatternAsRestParameter);
        }
        params.push(this.lookahead);

        const param = this.parseVariableIdentifier();
        if (this.match('=')) {
            this.throwError(Messages.DefaultRestParameter);
        }
        if (!this.match(')')) {
            this.throwError(Messages.ParameterAfterRestParameter);
        }

        return this.finalize(node, new Node.RestElement(param));
    }

    parseFormalParameter(options) {
        let param;
        let params = [];

        const token = this.lookahead;
        if (token.value === '...') {
            param = this.parseRestElement(params);
            this.validateParam(options, param.argument, param.argument.name);
            options.params.push(param);
            return false;
        }

        param = this.parsePatternWithDefault(params);
        for (let i = 0; i < params.length; i++) {
            this.validateParam(options, params[i], params[i].value);
        }
        options.params.push(param);

        return !this.match(')');
    }

    parseFormalParameters(firstRestricted?) {
        let options;

        options = {
            params: [],
            firstRestricted: firstRestricted
        };

        this.expect('(');
        if (!this.match(')')) {
            options.paramSet = {};
            while (this.startMarker.index < this.scanner.length) {
                if (!this.parseFormalParameter(options)) {
                    break;
                }
                this.expect(',');
            }
        }
        this.expect(')');

        return {
            params: options.params,
            stricted: options.stricted,
            firstRestricted: options.firstRestricted,
            message: options.message
        };
    }

    parseFunctionDeclaration(identifierIsOptional?: boolean): Node.FunctionDeclaration {
        const node = this.createNode();
        this.expectKeyword('function');

        const isGenerator = this.match('*');
        if (isGenerator) {
            this.nextToken();
        }

        let message;
        let id = null;
        let firstRestricted = null;

        if (!identifierIsOptional || !this.match('(')) {
            const token = this.lookahead;
            id = this.parseVariableIdentifier();
            if (this.context.strict) {
                if (this.scanner.isRestrictedWord(token.value)) {
                    this.tolerateUnexpectedToken(token, Messages.StrictFunctionName);
                }
            } else {
                if (this.scanner.isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (this.scanner.isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        const previousAllowYield = this.context.allowYield;
        this.context.allowYield = !isGenerator;

        const formalParameters = this.parseFormalParameters(firstRestricted);
        const params = formalParameters.params;
        const stricted = formalParameters.stricted;
        firstRestricted = formalParameters.firstRestricted;
        if (formalParameters.message) {
            message = formalParameters.message;
        }

        const previousStrict = this.context.strict;
        const body = this.parseFunctionSourceElements();
        if (this.context.strict && firstRestricted) {
            this.throwUnexpectedToken(firstRestricted, message);
        }
        if (this.context.strict && stricted) {
            this.tolerateUnexpectedToken(stricted, message);
        }

        this.context.strict = previousStrict;
        this.context.allowYield = previousAllowYield;

        return this.finalize(node, new Node.FunctionDeclaration(id, params, body, isGenerator));
    }

    parseFunctionExpression(): Node.FunctionExpression {
        const node = this.createNode();
        this.expectKeyword('function');

        const isGenerator = this.match('*');
        if (isGenerator) {
            this.nextToken();
        }

        let message;
        let id = null;
        let firstRestricted;

        const previousAllowYield = this.context.allowYield;
        this.context.allowYield = !isGenerator;

        if (!this.match('(')) {
            const token = this.lookahead;
            id = (!this.context.strict && !isGenerator && this.matchKeyword('yield')) ? this.parseNonComputedProperty() : this.parseVariableIdentifier();
            if (this.context.strict) {
                if (this.scanner.isRestrictedWord(token.value)) {
                    this.tolerateUnexpectedToken(token, Messages.StrictFunctionName);
                }
            } else {
                if (this.scanner.isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (this.scanner.isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        const formalParameters = this.parseFormalParameters(firstRestricted);
        const params = formalParameters.params;
        const stricted = formalParameters.stricted;
        firstRestricted = formalParameters.firstRestricted;
        if (formalParameters.message) {
            message = formalParameters.message;
        }

        const previousStrict = this.context.strict;
        const body = this.parseFunctionSourceElements();
        if (this.context.strict && firstRestricted) {
            this.throwUnexpectedToken(firstRestricted, message);
        }
        if (this.context.strict && stricted) {
            this.tolerateUnexpectedToken(stricted, message);
        }
        this.context.strict = previousStrict;
        this.context.allowYield = previousAllowYield;

        return this.finalize(node, new Node.FunctionExpression(id, params, body, isGenerator));
    }

    // ECMA-262 14.1.1 Directive Prologues

    parseDirective(): Node.Directive | Node.ExpressionStatement {
        const token = this.lookahead;
        let directive = null;

        const node = this.createNode();
        const expr = this.parseExpression();
        if (expr.type === Syntax.Literal) {
            directive = this.getTokenRaw(token).slice(1, -1);
        }
        this.consumeSemicolon();

        return this.finalize(node, directive ? new Node.Directive(expr, directive) :
            new Node.ExpressionStatement(expr));
    }

    parseDirectivePrologues(): Node.Statement[] {
        let firstRestricted = null;

        const body = [];
        while (true) {
            const token = this.lookahead;
            if (token.type !== Token.StringLiteral) {
                break;
            }

            const statement = this.parseDirective();
            body.push(statement);
            const directive = (<Node.Directive>statement).directive;
            if (typeof directive !== 'string') {
                break;
            }

            if (directive === 'use strict') {
                this.context.strict = true;
                if (firstRestricted) {
                    this.tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        return body;
    }

    // ECMA-262 14.3 Method Definitions

    qualifiedPropertyName(token): boolean {
        switch (token.type) {
            case Token.Identifier:
            case Token.StringLiteral:
            case Token.BooleanLiteral:
            case Token.NullLiteral:
            case Token.NumericLiteral:
            case Token.Keyword:
                return true;
            case Token.Punctuator:
                return token.value === '[';
        }
        return false;
    }

    parseGetterMethod(): Node.FunctionExpression {
        const node = this.createNode();
        this.expect('(');
        this.expect(')');

        const isGenerator = false;
        const params = {
            params: [],
            stricted: null,
            firstRestricted: null,
            message: null
        };
        const previousAllowYield = this.context.allowYield;
        this.context.allowYield = false;
        const method = this.parsePropertyMethod(params);
        this.context.allowYield = previousAllowYield;

        return this.finalize(node, new Node.FunctionExpression(null, params.params, method, isGenerator));
    }

    parseSetterMethod(): Node.FunctionExpression {
        const node = this.createNode();

        let options = {
            params: [],
            firstRestricted: null,
            paramSet: {}
        };

        const isGenerator = false;
        const previousAllowYield = this.context.allowYield;
        this.context.allowYield = false;

        this.expect('(');
        if (this.match(')')) {
            this.tolerateUnexpectedToken(this.lookahead);
        } else {
            this.parseFormalParameter(options);
        }
        this.expect(')');

        const method = this.parsePropertyMethod(options);
        this.context.allowYield = previousAllowYield;

        return this.finalize(node, new Node.FunctionExpression(null, options.params, method, isGenerator));
    }

    parseGeneratorMethod(): Node.FunctionExpression {
        const node = this.createNode();

        const isGenerator = true;
        const previousAllowYield = this.context.allowYield;

        this.context.allowYield = true;
        const params = this.parseFormalParameters();
        this.context.allowYield = false;
        const method = this.parsePropertyMethod(params);
        this.context.allowYield = previousAllowYield;

        return this.finalize(node, new Node.FunctionExpression(null, params.params, method, isGenerator));
    }

    // ECMA-262 14.4 Yield expression

    parseYieldExpression(): Node.YieldExpression {
        const node = this.createNode();
        this.expectKeyword('yield');

        let argument = null;
        let delegate = false;
        if (!this.hasLineTerminator) {
            const previousAllowYield = this.context.allowYield;
            this.context.allowYield = false;
            delegate = this.match('*');
            if (delegate) {
                this.nextToken();
                argument = this.parseAssignmentExpression();
            } else {
                if (!this.match(';') && !this.match('}') && !this.match(')') && this.lookahead.type !== Token.EOF) {
                    argument = this.parseAssignmentExpression();
                }
            }
            this.context.allowYield = previousAllowYield;
        }

        return this.finalize(node, new Node.YieldExpression(argument, delegate));
    }

    // ECMA-262 14.5 Class Definitions

    parseClassElement(hasConstructor): Node.Property {
        let token = this.lookahead;
        let node = this.createNode();

        let kind: string;
        let key: Node.PropertyKey;
        let value: Node.FunctionExpression;
        let computed = false;
        let method = false;
        let isStatic = false;

        if (this.match('*')) {
            this.nextToken();
        } else {
            computed = this.match('[');
            key = this.parseObjectPropertyKey();
            const id = <Node.Identifier>key;
            if (id.name === 'static' && (this.qualifiedPropertyName(this.lookahead) || this.match('*'))) {
                token = this.lookahead;
                isStatic = true;
                computed = this.match('[');
                if (this.match('*')) {
                    this.nextToken();
                } else {
                    key = this.parseObjectPropertyKey();
                }
            }
        }

        const lookaheadPropertyKey = this.qualifiedPropertyName(this.lookahead);
        if (token.type === Token.Identifier) {
            if (token.value === 'get' && lookaheadPropertyKey) {
                kind = 'get';
                computed = this.match('[');
                key = this.parseObjectPropertyKey();
                this.context.allowYield = false;
                value = this.parseGetterMethod();
            } else if (token.value === 'set' && lookaheadPropertyKey) {
                kind = 'set';
                computed = this.match('[');
                key = this.parseObjectPropertyKey();
                value = this.parseSetterMethod();
            }
        } else if (token.type === Token.Punctuator && token.value === '*' && lookaheadPropertyKey) {
            kind = 'init';
            computed = this.match('[');
            key = this.parseObjectPropertyKey();
            value = this.parseGeneratorMethod();
            method = true;
        }

        if (!kind && key && this.match('(')) {
            kind = 'init';
            value = this.parsePropertyMethodFunction();
            method = true;
        }

        if (!kind) {
            this.throwUnexpectedToken(this.lookahead);
        }

        if (kind === 'init') {
            kind = 'method';
        }

        if (!computed) {
            if (isStatic && this.isPropertyKey(key, 'prototype')) {
                this.throwUnexpectedToken(token, Messages.StaticPrototype);
            }
            if (!isStatic && this.isPropertyKey(key, 'constructor')) {
                if (kind !== 'method' || !method || value.generator) {
                    this.throwUnexpectedToken(token, Messages.ConstructorSpecialMethod);
                }
                if (hasConstructor.value) {
                    this.throwUnexpectedToken(token, Messages.DuplicateConstructor);
                } else {
                    hasConstructor.value = true;
                }
                kind = 'constructor';
            }
        }


        return this.finalize(node, new Node.MethodDefinition(key, computed, value, kind, isStatic));
    }

    parseClassElementList(): Node.Property[] {
        const body = [];
        let hasConstructor = { value: false };

        this.expect('{');
        while (!this.match('}')) {
            if (this.match(';')) {
                this.nextToken();
            } else {
                body.push(this.parseClassElement(hasConstructor));
            }
        }
        this.expect('}');

        return body;
    }

    parseClassBody(): Node.ClassBody {
        const node = this.createNode();
        const elementList = this.parseClassElementList();

        return this.finalize(node, new Node.ClassBody(elementList));
    }

    parseClassDeclaration(): Node.ClassDeclaration {
        const node = this.createNode();

        const previousStrict = this.context.strict;
        this.context.strict = true;
        this.expectKeyword('class');

        let id = this.parseVariableIdentifier();
        let superClass = null;
        if (this.matchKeyword('extends')) {
            this.nextToken();
            superClass = this.isolateCoverGrammar(this.parseLeftHandSideExpressionAllowCall);
        }
        const classBody = this.parseClassBody();
        this.context.strict = previousStrict;

        return this.finalize(node, new Node.ClassDeclaration(id, superClass, classBody));
    }

    parseClassExpression(): Node.ClassExpression {
        const node = this.createNode();

        const previousStrict = this.context.strict;
        this.context.strict = true;
        this.expectKeyword('class');
        const id = (this.lookahead.type === Token.Identifier) ? this.parseVariableIdentifier() : null;
        let superClass = null;
        if (this.matchKeyword('extends')) {
            this.nextToken();
            superClass = this.isolateCoverGrammar(this.parseLeftHandSideExpressionAllowCall);
        }
        const classBody = this.parseClassBody();
        this.context.strict = previousStrict;

        return this.finalize(node, new Node.ClassExpression(id, superClass, classBody));
    }

    // ECMA-262 15.1 Scripts
    // ECMA-262 15.2 Modules

    parseProgram(): Node.Program {
        const node = this.createNode();
        const body = this.parseDirectivePrologues();
        while (this.startMarker.index < this.scanner.length) {
            body.push(this.parseStatementListItem());
        }
        return this.finalize(node, new Node.Program(body, this.sourceType));
    }

    // ECMA-262 15.2.2 Imports

    parseModuleSpecifier(): Node.Literal {
        const node = this.createNode();

        if (this.lookahead.type !== Token.StringLiteral) {
            this.throwError(Messages.InvalidModuleSpecifier);
        }

        const token = this.nextToken();
        const raw = this.getTokenRaw(token);
        return this.finalize(node, new Node.Literal(token.value, raw));
    }

    // import {<foo as bar>} ...;
    parseImportSpecifier(): Node.ImportSpecifier {
        const node = this.createNode();

        let local;
        const imported = this.parseNonComputedProperty();
        if (this.matchContextualKeyword('as')) {
            this.nextToken();
            local = this.parseVariableIdentifier();
        } else {
            local = imported;
        }

        return this.finalize(node, new Node.ImportSpecifier(local, imported));
    }

    // {foo, bar as bas}
    parseNamedImports(): Node.ImportSpecifier[] {
        this.expect('{');
        const specifiers: Node.ImportSpecifier[] = [];
        while (!this.match('}')) {
            specifiers.push(this.parseImportSpecifier());
            if (!this.match('}')) {
                this.expect(',');
            }
        }
        this.expect('}');

        return specifiers;
    }

    // import <foo> ...;
    parseImportDefaultSpecifier(): Node.ImportDefaultSpecifier {
        const node = this.createNode();
        const local = this.parseNonComputedProperty();
        return this.finalize(node, new Node.ImportDefaultSpecifier(local));
    }

    // import <* as foo> ...;
    parseImportNamespaceSpecifier(): Node.ImportNamespaceSpecifier {
        const node = this.createNode();

        this.expect('*');
        if (!this.matchContextualKeyword('as')) {
            this.throwError(Messages.NoAsAfterImportNamespace);
        }
        this.nextToken();
        const local = this.parseNonComputedProperty();

        return this.finalize(node, new Node.ImportNamespaceSpecifier(local));
    }

    parseImportDeclaration(): Node.ImportDeclaration {
        if (this.context.inFunctionBody) {
            this.throwError(Messages.IllegalImportDeclaration);
        }

        const node = this.createNode();
        this.expectKeyword('import');

        let src: Node.Literal;
        let specifiers: Node.ImportDeclarationSpecifier[] = [];
        if (this.lookahead.type === Token.StringLiteral) {
            // import 'foo';
            src = this.parseModuleSpecifier();
        } else {
            if (this.match('{')) {
                // import {bar}
                specifiers = specifiers.concat(this.parseNamedImports());
            } else if (this.match('*')) {
                // import * as foo
                specifiers.push(this.parseImportNamespaceSpecifier());
            } else if (this.isIdentifierName(this.lookahead) && !this.matchKeyword('default')) {
                // import foo
                specifiers.push(this.parseImportDefaultSpecifier());
                if (this.match(',')) {
                    this.nextToken();
                    if (this.match('*')) {
                        // import foo, * as foo
                        specifiers.push(this.parseImportNamespaceSpecifier());
                    } else if (this.match('{')) {
                        // import foo, {bar}
                        specifiers = specifiers.concat(this.parseNamedImports());
                    } else {
                        this.throwUnexpectedToken(this.lookahead);
                    }
                }
            } else {
                this.throwUnexpectedToken(this.nextToken());
            }

            if (!this.matchContextualKeyword('from')) {
                const message = this.lookahead.value ? Messages.UnexpectedToken : Messages.MissingFromClause;
                this.throwError(message, this.lookahead.value);
            }
            this.nextToken();
            src = this.parseModuleSpecifier();
        }
        this.consumeSemicolon();

        return this.finalize(node, new Node.ImportDeclaration(specifiers, src));
    }

    // ECMA-262 15.2.3 Exports

    parseExportSpecifier(): Node.ExportSpecifier {
        const node = this.createNode();

        const local = this.matchKeyword('default') ? this.parseNonComputedProperty() : this.parseVariableIdentifier();
        let exported = local;
        if (this.matchContextualKeyword('as')) {
            this.nextToken();
            exported = this.parseNonComputedProperty();
        }

        return this.finalize(node, new Node.ExportSpecifier(local, exported));
    }

    parseExportDeclaration(): Node.ExportDeclaration {
        if (this.context.inFunctionBody) {
            this.throwError(Messages.IllegalExportDeclaration);
        }

        const node = this.createNode();
        this.expectKeyword('export');

        let exportDeclaration;
        if (this.matchKeyword('default')) {
            // export default ...
            this.nextToken();
            if (this.matchKeyword('function')) {
                // export default function foo () {}
                // export default function () {}
                const declaration = this.parseFunctionDeclaration(true);
                exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
            } else if (this.matchKeyword('class')) {
                // export default class foo {}
                let declaration = this.parseClassExpression();
                declaration.type = Syntax.ClassDeclaration;
                exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
            } else {
                if (this.matchContextualKeyword('from')) {
                    this.throwError(Messages.UnexpectedToken, this.lookahead.value);
                }
                // export default {};
                // export default [];
                // export default (1 + 2);
                const declaration = this.match('{') ? this.parseObjectInitializer() :
                    this.match('[') ? this.parseArrayInitializer() : this.parseAssignmentExpression();
                this.consumeSemicolon();
                exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
            }

        } else if (this.match('*')) {
            // export * from 'foo';
            this.nextToken();
            if (!this.matchContextualKeyword('from')) {
                const message = this.lookahead.value ? Messages.UnexpectedToken : Messages.MissingFromClause;
                this.throwError(message, this.lookahead.value);
            }
            this.nextToken();
            const src = this.parseModuleSpecifier();
            this.consumeSemicolon();
            exportDeclaration = this.finalize(node, new Node.ExportAllDeclaration(src));

        } else if (this.lookahead.type === Token.Keyword) {
            // export var f = 1;
            let declaration;
            switch (this.lookahead.value) {
                case 'let':
                case 'const':
                    declaration = this.parseLexicalDeclaration({ inFor: false });
                    break;
                case 'var':
                case 'class':
                case 'function':
                    declaration = this.parseStatementListItem();
                    break;
                default:
                    this.throwUnexpectedToken(this.lookahead);
            }
            exportDeclaration = this.finalize(node, new Node.ExportNamedDeclaration(declaration, [], null));

        } else {
            const specifiers = [];
            let source = null;
            let isExportFromIdentifier = false;

            this.expect('{');
            while (!this.match('}')) {
                isExportFromIdentifier = isExportFromIdentifier || this.matchKeyword('default');
                specifiers.push(this.parseExportSpecifier());
                if (!this.match('}')) {
                    this.expect(',');
                }
            }
            this.expect('}');

            if (this.matchContextualKeyword('from')) {
                // export {default} from 'foo';
                // export {foo} from 'foo';
                this.nextToken();
                source = this.parseModuleSpecifier();
                this.consumeSemicolon();
            } else if (isExportFromIdentifier) {
                // export {default}; // missing fromClause
                const message = this.lookahead.value ? Messages.UnexpectedToken : Messages.MissingFromClause;
                this.throwError(message, this.lookahead.value);
            } else {
                // export {foo};
                this.consumeSemicolon();
            }
            exportDeclaration = this.finalize(node, new Node.ExportNamedDeclaration(null, specifiers, source));
        }

        return exportDeclaration;
    }

}
