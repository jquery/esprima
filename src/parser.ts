import { assert } from './assert';
import { ErrorHandler } from './error-handler';
import { Messages } from './messages';
import * as Node from './nodes';
import { Comment, RawToken, Scanner, SourceLocation } from './scanner';
import { Syntax } from './syntax';
import { Token, TokenName } from './token';

interface Config {
    range: boolean;
    loc: boolean;
    source: string | null;
    tokens: boolean;
    comment: boolean;
    tolerant: boolean;
}

interface Context {
    isModule: boolean;
    allowIn: boolean;
    allowStrictDirective: boolean;
    allowYield: boolean;
    await: boolean;
    firstCoverInitializedNameError: RawToken | null;
    isAssignmentTarget: boolean;
    isBindingElement: boolean;
    inFunctionBody: boolean;
    inIteration: boolean;
    inSwitch: boolean;
    labelSet: any;
    strict: boolean;
}

export interface Marker {
    index: number;
    line: number;
    column: number;
}

const ArrowParameterPlaceHolder = 'ArrowParameterPlaceHolder';

interface ArrowParameterPlaceHolderNode {
    type: string;
    params: Node.Expression[];
    async: boolean;
}

interface DeclarationOptions {
    inFor: boolean;
}

interface TokenEntry {
    type: string;
    value: string;
    regex?: {
        pattern: string;
        flags: string;
    };
    range?: [number, number];
    loc?: SourceLocation;
}

export class Parser {
    readonly config: Config;
    readonly delegate: any;
    readonly errorHandler: ErrorHandler;
    readonly scanner: Scanner;
    readonly operatorPrecedence: any;

    lookahead: RawToken;
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

        this.lookahead = {
            type: Token.EOF,
            value: '',
            lineNumber: this.scanner.lineNumber,
            lineStart: 0,
            start: 0,
            end: 0
        };
        this.hasLineTerminator = false;

        this.context = {
            isModule: false,
            await: false,
            allowIn: true,
            allowStrictDirective: true,
            allowYield: true,
            firstCoverInitializedNameError: null,
            isAssignmentTarget: false,
            isBindingElement: false,
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            labelSet: {},
            strict: false
        };
        this.tokens = [];

        this.startMarker = {
            index: 0,
            line: this.scanner.lineNumber,
            column: 0
        };
        this.lastMarker = {
            index: 0,
            line: this.scanner.lineNumber,
            column: 0
        };
        this.nextToken();
        this.lastMarker = {
            index: this.scanner.index,
            line: this.scanner.lineNumber,
            column: this.scanner.index - this.scanner.lineStart
        };
    }

    throwError(messageFormat: string, ...values): void {
        const args = Array.prototype.slice.call(arguments, 1);
        const msg = messageFormat.replace(/%(\d)/g, (whole, idx) => {
            assert(idx < args.length, 'Message reference must be in range');
            return args[idx];
        }
        );

        const index = this.lastMarker.index;
        const line = this.lastMarker.line;
        const column = this.lastMarker.column + 1;
        throw this.errorHandler.createError(index, line, column, msg);
    }

    tolerateError(messageFormat, ...values) {
        const args = Array.prototype.slice.call(arguments, 1);
        const msg = messageFormat.replace(/%(\d)/g, (whole, idx) => {
            assert(idx < args.length, 'Message reference must be in range');
            return args[idx];
        }
        );

        const index = this.lastMarker.index;
        const line = this.scanner.lineNumber;
        const column = this.lastMarker.column + 1;
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

            value = token.value;
        } else {
            value = 'ILLEGAL';
        }

        msg = msg.replace('%0', value);

        if (token && typeof token.lineNumber === 'number') {
            const index = token.start;
            const line = token.lineNumber;
            const lastMarkerLineStart = this.lastMarker.index - this.lastMarker.column;
            const column = token.start - lastMarkerLineStart + 1;
            return this.errorHandler.createError(index, line, column, msg);
        } else {
            const index = this.lastMarker.index;
            const line = this.lastMarker.line;
            const column = this.lastMarker.column + 1;
            return this.errorHandler.createError(index, line, column, msg);
        }
    }

    throwUnexpectedToken(token?, message?): never {
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

    convertToken(token: RawToken): TokenEntry {
        let t: TokenEntry = {
            type: TokenName[token.type],
            value: this.getTokenRaw(token)
        };
        if (this.config.range) {
            t.range = [token.start, token.end];
        }
        if (this.config.loc) {
            t.loc = {
                start: {
                    line: this.startMarker.line,
                    column: this.startMarker.column
                },
                end: {
                    line: this.scanner.lineNumber,
                    column: this.scanner.index - this.scanner.lineStart
                }
            };
        }
        if (token.type === Token.RegularExpression) {
            const pattern = token.pattern as string;
            const flags = token.flags as string;
            t.regex = { pattern, flags };
        }

        return t;
    }

    nextToken(): RawToken {
        const token = this.lookahead;

        this.lastMarker.index = this.scanner.index;
        this.lastMarker.line = this.scanner.lineNumber;
        this.lastMarker.column = this.scanner.index - this.scanner.lineStart;

        this.collectComments();

        if (this.scanner.index !== this.startMarker.index) {
            this.startMarker.index = this.scanner.index;
            this.startMarker.line = this.scanner.lineNumber;
            this.startMarker.column = this.scanner.index - this.scanner.lineStart;
        }

        const next = this.scanner.lex();
        this.hasLineTerminator = (token.lineNumber !== next.lineNumber);

        if (next && this.context.strict && next.type === Token.Identifier) {
            if (this.scanner.isStrictModeReservedWord(next.value as string)) {
                next.type = Token.Keyword;
            }
        }
        this.lookahead = next;

        if (this.config.tokens && next.type !== Token.EOF) {
            this.tokens.push(this.convertToken(next));
        }

        return token;
    }

    nextRegexToken(): RawToken {
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

    createNode(): Marker {
        return {
            index: this.startMarker.index,
            line: this.startMarker.line,
            column: this.startMarker.column
        };
    }

    startNode(token): Marker {
        return {
            index: token.start,
            line: token.lineNumber,
            column: token.start - token.lineStart
        };
    }

    finalize(marker: Marker, node) {
        if (this.config.range) {
            node.range = [marker.index, this.lastMarker.index];
        }

        if (this.config.loc) {
            node.loc = {
                start: {
                    line: marker.line,
                    column: marker.column,
                },
                end: {
                    line: this.lastMarker.line,
                    column: this.lastMarker.column
                }
            };
            if (this.config.source) {
                node.loc.source = this.config.source;
            }
        }

        if (this.delegate) {
            const metadata = {
                start: {
                    line: marker.line,
                    column: marker.column,
                    offset: marker.index
                },
                end: {
                    line: this.lastMarker.line,
                    column: this.lastMarker.column,
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
            const token = this.lookahead;
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
            op === '**=' ||
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
            this.lastMarker.line = this.startMarker.line;
            this.lastMarker.column = this.startMarker.column;
        }
    }

    // https://tc39.github.io/ecma262/#sec-primary-expression

    parsePrimaryExpression(): Node.Expression {
        const node = this.createNode();

        let expr: Node.Expression;
        let token, raw;

        switch (this.lookahead.type) {
            case Token.Identifier:
                if ((this.context.isModule || this.context.await) && this.lookahead.value === 'await') {
                    this.tolerateUnexpectedToken(this.lookahead);
                }
                expr = this.matchAsyncFunction() ? this.parseFunctionExpression() : this.finalize(node, new Node.Identifier(this.nextToken().value));
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
                raw = this.getTokenRaw(token);
                expr = this.finalize(node, new Node.Literal(token.value === 'true', raw));
                break;

            case Token.NullLiteral:
                this.context.isAssignmentTarget = false;
                this.context.isBindingElement = false;
                token = this.nextToken();
                raw = this.getTokenRaw(token);
                expr = this.finalize(node, new Node.Literal(null, raw));
                break;

            case Token.Template:
                expr = this.parseTemplateLiteral();
                break;

            case Token.Punctuator:
                switch (this.lookahead.value) {
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
                        expr = this.finalize(node, new Node.RegexLiteral(token.regex as RegExp, raw, token.pattern, token.flags));
                        break;
                    default:
                        expr = this.throwUnexpectedToken(this.nextToken());
                }
                break;

            case Token.Keyword:
                if (!this.context.strict && this.context.allowYield && this.matchKeyword('yield')) {
                    expr = this.parseIdentifierName();
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
                    } else if (this.matchImportCall()) {
                        expr = this.parseImportCall();
                    } else {
                        expr = this.throwUnexpectedToken(this.nextToken());
                    }
                }
                break;

            default:
                expr = this.throwUnexpectedToken(this.nextToken());
        }

        return expr;
    }

    // https://tc39.github.io/ecma262/#sec-array-initializer

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

    // https://tc39.github.io/ecma262/#sec-object-initializer

    parsePropertyMethod(params): Node.BlockStatement {
        this.context.isAssignmentTarget = false;
        this.context.isBindingElement = false;

        const previousStrict = this.context.strict;
        const previousAllowStrictDirective = this.context.allowStrictDirective;
        this.context.allowStrictDirective = params.simple;
        const body = this.isolateCoverGrammar(this.parseFunctionSourceElements);
        if (this.context.strict && params.firstRestricted) {
            this.tolerateUnexpectedToken(params.firstRestricted, params.message);
        }
        if (this.context.strict && params.stricted) {
            this.tolerateUnexpectedToken(params.stricted, params.message);
        }
        this.context.strict = previousStrict;
        this.context.allowStrictDirective = previousAllowStrictDirective;

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

    parsePropertyMethodAsyncFunction(): Node.FunctionExpression {
        const node = this.createNode();

        const previousAllowYield = this.context.allowYield;
        const previousAwait = this.context.await;
        this.context.allowYield = false;
        this.context.await = true;
        const params = this.parseFormalParameters();
        const method = this.parsePropertyMethod(params);
        this.context.allowYield = previousAllowYield;
        this.context.await = previousAwait;

        return this.finalize(node, new Node.AsyncFunctionExpression(null, params.params, method));
    }

    parseObjectPropertyKey(): Node.PropertyKey {
        const node = this.createNode();
        const token = this.nextToken();

        let key: Node.PropertyKey;
        switch (token.type) {
            case Token.StringLiteral:
            case Token.NumericLiteral:
                if (this.context.strict && token.octal) {
                    this.tolerateUnexpectedToken(token, Messages.StrictOctalLiteral);
                }
                const raw = this.getTokenRaw(token);
                key = this.finalize(node, new Node.Literal(token.value as string, raw));
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
                    key = this.throwUnexpectedToken(token);
                }
                break;

            default:
                key = this.throwUnexpectedToken(token);
        }

        return key;
    }

    isPropertyKey(key, value) {
        return (key.type === Syntax.Identifier && key.name === value) ||
            (key.type === Syntax.Literal && key.value === value);
    }

    parseObjectProperty(hasProto): Node.Property {
        const node = this.createNode();
        let token = this.lookahead;

        let kind: string;
        let key: Node.PropertyKey | null = null;
        let value: Node.PropertyValue | null = null;

        let computed = false;
        let method = false;
        let shorthand = false;
        let isAsync = false;

        if (token.type === Token.Identifier) {
            const id = token.value;
            this.nextToken();
            computed = this.match('[');
            isAsync = !this.hasLineTerminator && (id === 'async') &&
                !this.match(':') && !this.match('(') && !this.match('*');
            key = isAsync ? this.parseObjectPropertyKey() : this.finalize(node, new Node.Identifier(id));
        } else if (this.match('*')) {
            this.nextToken();
        } else {
            computed = this.match('[');
            key = this.parseObjectPropertyKey();
        }

        const lookaheadPropertyKey = this.qualifiedPropertyName(this.lookahead);
        if (token.type === Token.Identifier && !isAsync && token.value === 'get' && lookaheadPropertyKey) {
            kind = 'get';
            computed = this.match('[');
            key = this.parseObjectPropertyKey();
            this.context.allowYield = false;
            value = this.parseGetterMethod();

        } else if (token.type === Token.Identifier && !isAsync && token.value === 'set' && lookaheadPropertyKey) {
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
            if (this.match(':') && !isAsync) {
                if (!computed && this.isPropertyKey(key, '__proto__')) {
                    if (hasProto.value) {
                        this.tolerateError(Messages.DuplicateProtoProperty);
                    }
                    hasProto.value = true;
                }
                this.nextToken();
                value = this.inheritCoverGrammar(this.parseAssignmentExpression);

            } else if (this.match('(')) {
                value = isAsync ? this.parsePropertyMethodAsyncFunction() : this.parsePropertyMethodFunction();
                method = true;

            } else if (token.type === Token.Identifier) {
                const id = this.finalize(node, new Node.Identifier(token.value));
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

        return this.finalize(node, new Node.Property(kind, key as Node.PropertyKey, computed, value, method, shorthand));
    }

    parseObjectInitializer(): Node.ObjectExpression {
        const node = this.createNode();

        this.expect('{');
        const properties: Node.ObjectExpressionProperty[] = [];
        let hasProto = { value: false };
        while (!this.match('}')) {
            properties.push(this.match('...') ? this.parseSpreadElement() : this.parseObjectProperty(hasProto));
            if (!this.match('}')) {
                this.expectCommaSeparator();
            }
        }
        this.expect('}');

        return this.finalize(node, new Node.ObjectExpression(properties));
    }

    // https://tc39.github.io/ecma262/#sec-template-literals

    parseTemplateHead(): Node.TemplateElement {
        assert(this.lookahead.head as boolean, 'Template literal must start with a template head');

        const node = this.createNode();
        const token = this.nextToken();
        const raw = token.value as string;
        const cooked = token.cooked as string;

        return this.finalize(node, new Node.TemplateElement({ raw, cooked }, token.tail as boolean));
    }

    parseTemplateElement(): Node.TemplateElement {
        if (this.lookahead.type !== Token.Template) {
            this.throwUnexpectedToken();
        }

        const node = this.createNode();
        const token = this.nextToken();
        const raw = token.value as string;
        const cooked = token.cooked as string;

        return this.finalize(node, new Node.TemplateElement({ raw, cooked }, token.tail as boolean));
    }

    parseTemplateLiteral(): Node.TemplateLiteral {
        const node = this.createNode();

        const expressions: Node.Expression[] = [];
        const quasis: Node.TemplateElement[] = [];

        let quasi = this.parseTemplateHead();
        quasis.push(quasi);
        while (!quasi.tail) {
            expressions.push(this.parseExpression());
            quasi = this.parseTemplateElement();
            quasis.push(quasi);
        }

        return this.finalize(node, new Node.TemplateLiteral(quasis, expressions));
    }

    // https://tc39.github.io/ecma262/#sec-grouping-operator

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
                    const property = expr.properties[i];
                    this.reinterpretExpressionAsPattern(property.type === Syntax.SpreadElement ? property : property.value);
                }
                break;
            case Syntax.AssignmentExpression:
                expr.type = Syntax.AssignmentPattern;
                delete expr.operator;
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
                params: [],
                async: false
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
                    params: [expr],
                    async: false
                };
            } else {
                let arrow = false;
                this.context.isBindingElement = true;
                expr = this.inheritCoverGrammar(this.parseAssignmentExpression);

                if (this.match(',')) {
                    const expressions: Node.Expression[] = [];

                    this.context.isAssignmentTarget = false;
                    expressions.push(expr);
                    while (this.lookahead.type !== Token.EOF) {
                        if (!this.match(',')) {
                            break;
                        }
                        this.nextToken();
                        if (this.match(')')) {
                            this.nextToken();
                            for (let i = 0; i < expressions.length; i++) {
                                this.reinterpretExpressionAsPattern(expressions[i]);
                            }
                            arrow = true;
                            expr = {
                                type: ArrowParameterPlaceHolder,
                                params: expressions,
                                async: false
                            };
                        } else if (this.match('...')) {
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
                                params: expressions,
                                async: false
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
                                params: [expr],
                                async: false
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

                            const parameters = (expr.type === Syntax.SequenceExpression ? expr.expressions : [expr]);
                            expr = {
                                type: ArrowParameterPlaceHolder,
                                params: parameters,
                                async: false
                            };
                        }
                    }
                    this.context.isBindingElement = false;
                }
            }
        }

        return expr;
    }

    // https://tc39.github.io/ecma262/#sec-left-hand-side-expressions

    parseArguments(): Node.ArgumentListElement[] {
        this.expect('(');
        const args: Node.ArgumentListElement[] = [];
        if (!this.match(')')) {
            while (true) {
                const expr = this.match('...') ? this.parseSpreadElement() :
                    this.isolateCoverGrammar(this.parseAssignmentExpression);
                args.push(expr);
                if (this.match(')')) {
                    break;
                }
                this.expectCommaSeparator();
                if (this.match(')')) {
                    break;
                }
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

    parseIdentifierName(): Node.Identifier {
        const node = this.createNode();
        const token = this.nextToken();
        if (!this.isIdentifierName(token)) {
            this.throwUnexpectedToken(token);
        }
        return this.finalize(node, new Node.Identifier(token.value));
    }

    parseNewExpression(): Node.MetaProperty | Node.NewExpression {
        const node = this.createNode();

        const id = this.parseIdentifierName();
        assert(id.name === 'new', 'New expression must start with `new`');

        let expr;
        if (this.match('.')) {
            this.nextToken();
            if (this.lookahead.type === Token.Identifier && this.context.inFunctionBody && this.lookahead.value === 'target') {
                const property = this.parseIdentifierName();
                expr = new Node.MetaProperty(id, property);
            } else {
                this.throwUnexpectedToken(this.lookahead);
            }
        } else if (this.matchKeyword('import')) {
            this.throwUnexpectedToken(this.lookahead);
        } else {
            const callee = this.isolateCoverGrammar(this.parseLeftHandSideExpression);
            const args = this.match('(') ? this.parseArguments() : [];
            expr = new Node.NewExpression(callee, args);
            this.context.isAssignmentTarget = false;
            this.context.isBindingElement = false;
        }

        return this.finalize(node, expr);
    }

    parseAsyncArgument() {
        const arg = this.parseAssignmentExpression();
        this.context.firstCoverInitializedNameError = null;
        return arg;
    }

    parseAsyncArguments(): Node.ArgumentListElement[] {
        this.expect('(');
        const args: Node.ArgumentListElement[] = [];
        if (!this.match(')')) {
            while (true) {
                const expr = this.match('...') ? this.parseSpreadElement() :
                    this.isolateCoverGrammar(this.parseAsyncArgument);
                args.push(expr);
                if (this.match(')')) {
                    break;
                }
                this.expectCommaSeparator();
                if (this.match(')')) {
                    break;
                }
            }
        }
        this.expect(')');

        return args;
    }

    matchImportCall(): boolean {
        let match = this.matchKeyword('import');
        if (match) {
            const state = this.scanner.saveState();
            this.scanner.scanComments();
            const next = this.scanner.lex();
            this.scanner.restoreState(state);
            match = (next.type === Token.Punctuator) && (next.value === '(');
        }

        return match;
    }

    parseImportCall(): Node.Import {
        const node = this.createNode();
        this.expectKeyword('import');
        return this.finalize(node, new Node.Import());
    }

    parseLeftHandSideExpressionAllowCall(): Node.Expression {
        const startToken = this.lookahead;
        const maybeAsync = this.matchContextualKeyword('async');

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
                const property = this.parseIdentifierName();
                expr = this.finalize(this.startNode(startToken), new Node.StaticMemberExpression(expr, property));

            } else if (this.match('(')) {
                const asyncArrow = maybeAsync && (startToken.lineNumber === this.lookahead.lineNumber);
                this.context.isBindingElement = false;
                this.context.isAssignmentTarget = false;
                const args = asyncArrow ? this.parseAsyncArguments() : this.parseArguments();
                if (expr.type === Syntax.Import && args.length !== 1) {
                    this.tolerateError(Messages.BadImportCallArity);
                }
                expr = this.finalize(this.startNode(startToken), new Node.CallExpression(expr, args));
                if (asyncArrow && this.match('=>')) {
                    for (let i = 0; i < args.length; ++i) {
                        this.reinterpretExpressionAsPattern(args[i]);
                    }
                    expr = {
                        type: ArrowParameterPlaceHolder,
                        params: args,
                        async: true
                    };
                }
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
                const property = this.parseIdentifierName();
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

    // https://tc39.github.io/ecma262/#sec-update-expressions

    parseUpdateExpression(): Node.Expression {
        let expr;
        const startToken = this.lookahead;

        if (this.match('++') || this.match('--')) {
            const node = this.startNode(startToken);
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
        } else {
            expr = this.inheritCoverGrammar(this.parseLeftHandSideExpressionAllowCall);
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
        }

        return expr;
    }

    // https://tc39.github.io/ecma262/#sec-unary-operators

    parseAwaitExpression(): Node.AwaitExpression {
        const node = this.createNode();
        this.nextToken();
        const argument = this.parseUnaryExpression();
        return this.finalize(node, new Node.AwaitExpression(argument));
    }

    parseUnaryExpression(): Node.Expression {
        let expr;

        if (this.match('+') || this.match('-') || this.match('~') || this.match('!') ||
            this.matchKeyword('delete') || this.matchKeyword('void') || this.matchKeyword('typeof')) {
            const node = this.startNode(this.lookahead);
            const token = this.nextToken();
            expr = this.inheritCoverGrammar(this.parseUnaryExpression);
            expr = this.finalize(node, new Node.UnaryExpression(token.value, expr));
            if (this.context.strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
                this.tolerateError(Messages.StrictDelete);
            }
            this.context.isAssignmentTarget = false;
            this.context.isBindingElement = false;
        } else if (this.context.await && this.matchContextualKeyword('await')) {
            expr = this.parseAwaitExpression();
        } else {
            expr = this.parseUpdateExpression();
        }

        return expr;
    }

    parseExponentiationExpression(): Node.Expression {
        const startToken = this.lookahead;

        let expr = this.inheritCoverGrammar(this.parseUnaryExpression);
        if (expr.type !== Syntax.UnaryExpression && this.match('**')) {
            this.nextToken();
            this.context.isAssignmentTarget = false;
            this.context.isBindingElement = false;
            const left = expr;
            const right = this.isolateCoverGrammar(this.parseExponentiationExpression);
            expr = this.finalize(this.startNode(startToken), new Node.BinaryExpression('**', left, right));
        }

        return expr;
    }

    // https://tc39.github.io/ecma262/#sec-exp-operator
    // https://tc39.github.io/ecma262/#sec-multiplicative-operators
    // https://tc39.github.io/ecma262/#sec-additive-operators
    // https://tc39.github.io/ecma262/#sec-bitwise-shift-operators
    // https://tc39.github.io/ecma262/#sec-relational-operators
    // https://tc39.github.io/ecma262/#sec-equality-operators
    // https://tc39.github.io/ecma262/#sec-binary-bitwise-operators
    // https://tc39.github.io/ecma262/#sec-binary-logical-operators

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

        let expr = this.inheritCoverGrammar(this.parseExponentiationExpression);

        const token = this.lookahead;
        let prec = this.binaryPrecedence(token);
        if (prec > 0) {
            this.nextToken();

            this.context.isAssignmentTarget = false;
            this.context.isBindingElement = false;

            const markers = [startToken, this.lookahead];
            let left = expr;
            let right = this.isolateCoverGrammar(this.parseExponentiationExpression);

            const stack = [left, token.value, right];
            const precedences: number[] = [prec];
            while (true) {
                prec = this.binaryPrecedence(this.lookahead);
                if (prec <= 0) {
                    break;
                }

                // Reduce: make a binary expression from the three topmost entries.
                while ((stack.length > 2) && (prec <= precedences[precedences.length - 1])) {
                    right = stack.pop();
                    const operator = stack.pop();
                    precedences.pop();
                    left = stack.pop();
                    markers.pop();
                    const node = this.startNode(markers[markers.length - 1]);
                    stack.push(this.finalize(node, new Node.BinaryExpression(operator, left, right)));
                }

                // Shift.
                stack.push(this.nextToken().value);
                precedences.push(prec);
                markers.push(this.lookahead);
                stack.push(this.isolateCoverGrammar(this.parseExponentiationExpression));
            }

            // Final reduce to clean-up the stack.
            let i = stack.length - 1;
            expr = stack[i];
            markers.pop();
            while (i > 1) {
                const node = this.startNode(markers.pop());
                const operator = stack[i - 1];
                expr = this.finalize(node, new Node.BinaryExpression(operator, stack[i - 2], expr));
                i -= 2;
            }
        }

        return expr;
    }

    // https://tc39.github.io/ecma262/#sec-conditional-operator

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

    // https://tc39.github.io/ecma262/#sec-assignment-operators

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
            case Syntax.ObjectPattern:
                for (let i = 0; i < param.properties.length; i++) {
                    const property = param.properties[i];
                    this.checkPatternParam(options, (property.type === Syntax.RestElement) ? property : property.value);
                }
                break;
            default:
                break;
        }
        options.simple = options.simple && (param instanceof Node.Identifier);
    }

    reinterpretAsCoverFormalsList(expr) {
        let params = [expr];
        let options;

        let asyncArrow = false;
        switch (expr.type) {
            case Syntax.Identifier:
                break;
            case ArrowParameterPlaceHolder:
                params = expr.params;
                asyncArrow = expr.async;
                break;
            default:
                return null;
        }

        options = {
            simple: true,
            paramSet: {}
        };

        for (let i = 0; i < params.length; ++i) {
            const param = params[i];
            if (param.type === Syntax.AssignmentPattern) {
                if (param.right.type === Syntax.YieldExpression) {
                    if (param.right.argument) {
                        this.throwUnexpectedToken(this.lookahead);
                    }
                    param.right.type = Syntax.Identifier;
                    param.right.name = 'yield';
                    delete param.right.argument;
                    delete param.right.delegate;
                }
            } else if (asyncArrow && param.type === Syntax.Identifier && param.name === 'await') {
                this.throwUnexpectedToken(this.lookahead);
            }
            this.checkPatternParam(options, param);
            params[i] = param;
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
            simple: options.simple,
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

            if (token.type === Token.Identifier && (token.lineNumber === this.lookahead.lineNumber) && token.value === 'async') {
                if (this.lookahead.type === Token.Identifier || this.matchKeyword('yield')) {
                    const arg = this.parsePrimaryExpression();
                    this.reinterpretExpressionAsPattern(arg);
                    expr = {
                        type: ArrowParameterPlaceHolder,
                        params: [arg],
                        async: true
                    };
                }
            }

            if (expr.type === ArrowParameterPlaceHolder || this.match('=>')) {

                // https://tc39.github.io/ecma262/#sec-arrow-function-definitions
                this.context.isAssignmentTarget = false;
                this.context.isBindingElement = false;
                const isAsync = expr.async;
                const list = this.reinterpretAsCoverFormalsList(expr);

                if (list) {
                    if (this.hasLineTerminator) {
                        this.tolerateUnexpectedToken(this.lookahead);
                    }
                    this.context.firstCoverInitializedNameError = null;

                    const previousStrict = this.context.strict;
                    const previousAllowStrictDirective = this.context.allowStrictDirective;
                    this.context.allowStrictDirective = list.simple;

                    const previousAllowYield = this.context.allowYield;
                    const previousAwait = this.context.await;
                    this.context.allowYield = true;
                    this.context.await = isAsync;

                    const node = this.startNode(startToken);
                    this.expect('=>');
                    let body: Node.BlockStatement | Node.Expression;
                    if (this.match('{')) {
                        const previousAllowIn = this.context.allowIn;
                        this.context.allowIn = true;
                        body = this.parseFunctionSourceElements();
                        this.context.allowIn = previousAllowIn;
                    } else {
                        body = this.isolateCoverGrammar(this.parseAssignmentExpression);
                    }
                    const expression = body.type !== Syntax.BlockStatement;

                    if (this.context.strict && list.firstRestricted) {
                        this.throwUnexpectedToken(list.firstRestricted, list.message);
                    }
                    if (this.context.strict && list.stricted) {
                        this.tolerateUnexpectedToken(list.stricted, list.message);
                    }
                    expr = isAsync ? this.finalize(node, new Node.AsyncArrowFunctionExpression(list.params, body, expression)) :
                        this.finalize(node, new Node.ArrowFunctionExpression(list.params, body, expression));

                    this.context.strict = previousStrict;
                    this.context.allowStrictDirective = previousAllowStrictDirective;
                    this.context.allowYield = previousAllowYield;
                    this.context.await = previousAwait;
                }
            } else {

                if (this.matchAssign()) {
                    if (!this.context.isAssignmentTarget) {
                        this.tolerateError(Messages.InvalidLHSInAssignment);
                    }

                    if (this.context.strict && expr.type === Syntax.Identifier) {
                        const id = expr as Node.Identifier;
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
                    const operator = token.value as string;
                    const right = this.isolateCoverGrammar(this.parseAssignmentExpression);
                    expr = this.finalize(this.startNode(startToken), new Node.AssignmentExpression(operator, expr, right));
                    this.context.firstCoverInitializedNameError = null;
                }
            }
        }

        return expr;
    }

    // https://tc39.github.io/ecma262/#sec-comma-operator

    parseExpression(): Node.Expression | Node.SequenceExpression {
        const startToken = this.lookahead;
        let expr = this.isolateCoverGrammar(this.parseAssignmentExpression);

        if (this.match(',')) {
            const expressions: Node.Expression[] = [];
            expressions.push(expr);
            while (this.lookahead.type !== Token.EOF) {
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

    // https://tc39.github.io/ecma262/#sec-block

    parseStatementListItem(): Node.StatementListItem {
        let statement: Node.StatementListItem;
        this.context.isAssignmentTarget = true;
        this.context.isBindingElement = true;
        if (this.lookahead.type === Token.Keyword) {
            switch (this.lookahead.value) {
                case 'export':
                    if (!this.context.isModule) {
                        this.tolerateUnexpectedToken(this.lookahead, Messages.IllegalExportDeclaration);
                    }
                    statement = this.parseExportDeclaration();
                    break;
                case 'import':
                    if (this.matchImportCall()) {
                        statement = this.parseExpressionStatement();
                    } else {
                        if (!this.context.isModule) {
                            this.tolerateUnexpectedToken(this.lookahead, Messages.IllegalImportDeclaration);
                        }
                        statement = this.parseImportDeclaration();
                    }
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
        const block: Node.StatementListItem[] = [];
        while (true) {
            if (this.match('}')) {
                break;
            }
            block.push(this.parseStatementListItem());
        }
        this.expect('}');

        return this.finalize(node, new Node.BlockStatement(block));
    }

    // https://tc39.github.io/ecma262/#sec-let-and-const-declarations

    parseLexicalBinding(kind: string, options): Node.VariableDeclarator {
        const node = this.createNode();
        let params = [];
        const id = this.parsePattern(params, kind);

        if (this.context.strict && id.type === Syntax.Identifier) {
            if (this.scanner.isRestrictedWord((id as Node.Identifier).name)) {
                this.tolerateError(Messages.StrictVarName);
            }
        }

        let init: Node.Expression | null = null;
        if (kind === 'const') {
            if (!this.matchKeyword('in') && !this.matchContextualKeyword('of')) {
                if (this.match('=')) {
                    this.nextToken();
                    init = this.isolateCoverGrammar(this.parseAssignmentExpression);
                } else {
                    this.throwError(Messages.DeclarationMissingInitializer, 'const');
                }
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
        const state = this.scanner.saveState();
        this.scanner.scanComments();
        const next = this.scanner.lex();
        this.scanner.restoreState(state);

        return (next.type === Token.Identifier) ||
            (next.type === Token.Punctuator && next.value === '[') ||
            (next.type === Token.Punctuator && next.value === '{') ||
            (next.type === Token.Keyword && next.value === 'let') ||
            (next.type === Token.Keyword && next.value === 'yield');
    }

    parseLexicalDeclaration(options): Node.VariableDeclaration {
        const node = this.createNode();
        const kind = this.nextToken().value as string;
        assert(kind === 'let' || kind === 'const', 'Lexical declaration must be either let or const');

        const declarations = this.parseBindingList(kind, options);
        this.consumeSemicolon();

        return this.finalize(node, new Node.VariableDeclaration(declarations, kind));
    }

    // https://tc39.github.io/ecma262/#sec-destructuring-binding-patterns

    parseBindingRestElement(params, kind?: string): Node.RestElement {
        const node = this.createNode();

        this.expect('...');
        const arg = this.parsePattern(params, kind);

        return this.finalize(node, new Node.RestElement(arg));
    }

    parseArrayPattern(params, kind?: string): Node.ArrayPattern {
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

    parsePropertyPattern(params, kind?: string): Node.Property {
        const node = this.createNode();

        let computed = false;
        let shorthand = false;
        const method = false;

        let key: Node.PropertyKey | null;
        let value: Node.PropertyValue;

        if (this.lookahead.type === Token.Identifier) {
            const keyToken = this.lookahead;
            key = this.parseVariableIdentifier();
            const init = this.finalize(node, new Node.Identifier(keyToken.value));
            if (this.match('=')) {
                params.push(keyToken);
                shorthand = true;
                this.nextToken();
                const expr = this.parseAssignmentExpression();
                value = this.finalize(this.startNode(keyToken), new Node.AssignmentPattern(init, expr));
            } else if (!this.match(':')) {
                params.push(keyToken);
                shorthand = true;
                value = init;
            } else {
                this.expect(':');
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

    parseRestProperty(params, kind): Node.RestElement {
        const node = this.createNode();
        this.expect('...');
        const arg = this.parsePattern(params);
        if (this.match('=')) {
            this.throwError(Messages.DefaultRestProperty);
        }
        if (!this.match('}')) {
            this.throwError(Messages.PropertyAfterRestProperty);
        }
        return this.finalize(node, new Node.RestElement(arg));
    }

    parseObjectPattern(params, kind?: string): Node.ObjectPattern {
        const node = this.createNode();
        const properties: Node.ObjectPatternProperty[] = [];

        this.expect('{');
        while (!this.match('}')) {
            properties.push(this.match('...') ? this.parseRestProperty(params, kind) : this.parsePropertyPattern(params, kind));
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
                this.tolerateUnexpectedToken(this.lookahead, Messages.LetInLexicalBinding);
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

    // https://tc39.github.io/ecma262/#sec-variable-statement

    parseVariableIdentifier(kind?: string): Node.Identifier {
        const node = this.createNode();

        const token = this.nextToken();
        if (token.type === Token.Keyword && token.value === 'yield') {
            if (this.context.strict) {
                this.tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            } else if (!this.context.allowYield) {
                this.throwUnexpectedToken(token);
            }
        } else if (token.type !== Token.Identifier) {
            if (this.context.strict && token.type === Token.Keyword && this.scanner.isStrictModeReservedWord(token.value as string)) {
                this.tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            } else {
                if (this.context.strict || token.value !== 'let' || kind !== 'var') {
                    this.throwUnexpectedToken(token);
                }
            }
        } else if ((this.context.isModule || this.context.await) && token.type === Token.Identifier && token.value === 'await') {
            this.tolerateUnexpectedToken(token);
        }

        return this.finalize(node, new Node.Identifier(token.value));
    }

    parseVariableDeclaration(options: DeclarationOptions): Node.VariableDeclarator {
        const node = this.createNode();

        let params = [];
        const id = this.parsePattern(params, 'var');

        if (this.context.strict && id.type === Syntax.Identifier) {
            if (this.scanner.isRestrictedWord((id as Node.Identifier).name)) {
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

    // https://tc39.github.io/ecma262/#sec-empty-statement

    parseEmptyStatement(): Node.EmptyStatement {
        const node = this.createNode();
        this.expect(';');
        return this.finalize(node, new Node.EmptyStatement());
    }

    // https://tc39.github.io/ecma262/#sec-expression-statement

    parseExpressionStatement(): Node.ExpressionStatement {
        const node = this.createNode();
        const expr = this.parseExpression();
        this.consumeSemicolon();
        return this.finalize(node, new Node.ExpressionStatement(expr));
    }

    // https://tc39.github.io/ecma262/#sec-if-statement

    parseIfClause(): Node.Statement {
        if (this.context.strict && this.matchKeyword('function')) {
            this.tolerateError(Messages.StrictFunction);
        }
        return this.parseStatement();
    }

    parseIfStatement(): Node.IfStatement {
        const node = this.createNode();
        let consequent: Node.Statement;
        let alternate: Node.Statement | null = null;

        this.expectKeyword('if');
        this.expect('(');
        const test = this.parseExpression();

        if (!this.match(')') && this.config.tolerant) {
            this.tolerateUnexpectedToken(this.nextToken());
            consequent = this.finalize(this.createNode(), new Node.EmptyStatement());
        } else {
            this.expect(')');
            consequent = this.parseIfClause();
            if (this.matchKeyword('else')) {
                this.nextToken();
                alternate = this.parseIfClause();
            }
        }

        return this.finalize(node, new Node.IfStatement(test, consequent, alternate));
    }

    // https://tc39.github.io/ecma262/#sec-do-while-statement

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

        if (!this.match(')') && this.config.tolerant) {
            this.tolerateUnexpectedToken(this.nextToken());
        } else {
            this.expect(')');
            if (this.match(';')) {
                this.nextToken();
            }
        }

        return this.finalize(node, new Node.DoWhileStatement(body, test));
    }

    // https://tc39.github.io/ecma262/#sec-while-statement

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

    // https://tc39.github.io/ecma262/#sec-for-statement
    // https://tc39.github.io/ecma262/#sec-for-in-and-for-of-statements

    parseForStatement(): Node.ForStatement | Node.ForInStatement | Node.ForOfStatement {
        let init: any = null;
        let test: Node.Expression | null = null;
        let update: Node.Expression | null = null;
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
                    const decl = declarations[0];
                    if (decl.init && (decl.id.type === Syntax.ArrayPattern || decl.id.type === Syntax.ObjectPattern || this.context.strict)) {
                        this.tolerateError(Messages.ForInOfLoopInitializer, 'for-in');
                    }
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
                const kind = this.nextToken().value as string;

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
                    if (!this.context.isAssignmentTarget || init.type === Syntax.AssignmentExpression) {
                        this.tolerateError(Messages.InvalidLHSInForIn);
                    }

                    this.nextToken();
                    this.reinterpretExpressionAsPattern(init);
                    left = init;
                    right = this.parseExpression();
                    init = null;
                } else if (this.matchContextualKeyword('of')) {
                    if (!this.context.isAssignmentTarget || init.type === Syntax.AssignmentExpression) {
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

    // https://tc39.github.io/ecma262/#sec-continue-statement

    parseContinueStatement(): Node.ContinueStatement {
        const node = this.createNode();
        this.expectKeyword('continue');

        let label: Node.Identifier | null = null;
        if (this.lookahead.type === Token.Identifier && !this.hasLineTerminator) {
            const id = this.parseVariableIdentifier();
            label = id;

            const key = '$' + id.name;
            if (!Object.prototype.hasOwnProperty.call(this.context.labelSet, key)) {
                this.throwError(Messages.UnknownLabel, id.name);
            }
        }

        this.consumeSemicolon();
        if (label === null && !this.context.inIteration) {
            this.throwError(Messages.IllegalContinue);
        }

        return this.finalize(node, new Node.ContinueStatement(label));
    }

    // https://tc39.github.io/ecma262/#sec-break-statement

    parseBreakStatement(): Node.BreakStatement {
        const node = this.createNode();
        this.expectKeyword('break');

        let label: Node.Identifier | null = null;
        if (this.lookahead.type === Token.Identifier && !this.hasLineTerminator) {
            const id = this.parseVariableIdentifier();

            const key = '$' + id.name;
            if (!Object.prototype.hasOwnProperty.call(this.context.labelSet, key)) {
                this.throwError(Messages.UnknownLabel, id.name);
            }
            label = id;
        }

        this.consumeSemicolon();
        if (label === null && !this.context.inIteration && !this.context.inSwitch) {
            this.throwError(Messages.IllegalBreak);
        }

        return this.finalize(node, new Node.BreakStatement(label));
    }

    // https://tc39.github.io/ecma262/#sec-return-statement

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

    // https://tc39.github.io/ecma262/#sec-with-statement

    parseWithStatement(): Node.WithStatement {
        if (this.context.strict) {
            this.tolerateError(Messages.StrictModeWith);
        }

        const node = this.createNode();
        let body;

        this.expectKeyword('with');
        this.expect('(');
        const object = this.parseExpression();

        if (!this.match(')') && this.config.tolerant) {
            this.tolerateUnexpectedToken(this.nextToken());
            body = this.finalize(this.createNode(), new Node.EmptyStatement());
        } else {
            this.expect(')');
            body = this.parseStatement();
        }

        return this.finalize(node, new Node.WithStatement(object, body));
    }

    // https://tc39.github.io/ecma262/#sec-switch-statement

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

        const consequent: Node.StatementListItem[] = [];
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

        const cases: Node.SwitchCase[] = [];
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

    // https://tc39.github.io/ecma262/#sec-labelled-statements

    parseLabelledStatement(): Node.LabeledStatement | Node.ExpressionStatement {
        const node = this.createNode();
        const expr = this.parseExpression();

        let statement: Node.ExpressionStatement | Node.LabeledStatement;
        if ((expr.type === Syntax.Identifier) && this.match(':')) {
            this.nextToken();

            const id = expr as Node.Identifier;
            const key = '$' + id.name;
            if (Object.prototype.hasOwnProperty.call(this.context.labelSet, key)) {
                this.throwError(Messages.Redeclaration, 'Label', id.name);
            }

            this.context.labelSet[key] = true;
            let body: Node.Statement;
            if (this.matchKeyword('class')) {
                this.tolerateUnexpectedToken(this.lookahead);
                body = this.parseClassDeclaration();
            } else if (this.matchKeyword('function')) {
                const token = this.lookahead;
                const declaration = this.parseFunctionDeclaration();
                if (this.context.strict) {
                    this.tolerateUnexpectedToken(token, Messages.StrictFunction);
                } else if (declaration.generator) {
                    this.tolerateUnexpectedToken(token, Messages.GeneratorInLegacyContext);
                }
                body = declaration;
            } else {
                body = this.parseStatement();
            }
            delete this.context.labelSet[key];

            statement = new Node.LabeledStatement(id, body);
        } else {
            this.consumeSemicolon();
            statement = new Node.ExpressionStatement(expr);
        }

        return this.finalize(node, statement);
    }

    // https://tc39.github.io/ecma262/#sec-throw-statement

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

    // https://tc39.github.io/ecma262/#sec-try-statement

    parseCatchClause(): Node.CatchClause {
        const node = this.createNode();

        this.expectKeyword('catch');

        this.expect('(');
        if (this.match(')')) {
            this.throwUnexpectedToken(this.lookahead);
        }

        let params: any[] = [];
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
            if (this.scanner.isRestrictedWord((param as Node.Identifier).name)) {
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

    // https://tc39.github.io/ecma262/#sec-debugger-statement

    parseDebuggerStatement(): Node.DebuggerStatement {
        const node = this.createNode();
        this.expectKeyword('debugger');
        this.consumeSemicolon();
        return this.finalize(node, new Node.DebuggerStatement());
    }

    // https://tc39.github.io/ecma262/#sec-ecmascript-language-statements-and-declarations

    parseStatement(): Node.Statement {
        let statement: Node.Statement;
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
                statement = this.matchAsyncFunction() ? this.parseFunctionDeclaration() : this.parseLabelledStatement();
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
                statement = this.throwUnexpectedToken(this.lookahead);
        }

        return statement;
    }

    // https://tc39.github.io/ecma262/#sec-function-definitions

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

        while (this.lookahead.type !== Token.EOF) {
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

        /* istanbul ignore next */
        if (typeof Object.defineProperty === 'function') {
            Object.defineProperty(options.paramSet, key, { value: true, enumerable: true, writable: true, configurable: true });
        } else {
            options.paramSet[key] = true;
        }
    }

    parseRestElement(params): Node.RestElement {
        const node = this.createNode();

        this.expect('...');
        const arg = this.parsePattern(params);
        if (this.match('=')) {
            this.throwError(Messages.DefaultRestParameter);
        }
        if (!this.match(')')) {
            this.throwError(Messages.ParameterAfterRestParameter);
        }

        return this.finalize(node, new Node.RestElement(arg));
    }

    parseFormalParameter(options) {
        let params: any[] = [];
        const param = this.match('...') ? this.parseRestElement(params) : this.parsePatternWithDefault(params);
        for (let i = 0; i < params.length; i++) {
            this.validateParam(options, params[i], params[i].value);
        }
        options.simple = options.simple && (param instanceof Node.Identifier);
        options.params.push(param);
    }

    parseFormalParameters(firstRestricted?) {
        let options;

        options = {
            simple: true,
            params: [],
            firstRestricted: firstRestricted
        };

        this.expect('(');
        if (!this.match(')')) {
            options.paramSet = {};
            while (this.lookahead.type !== Token.EOF) {
                this.parseFormalParameter(options);
                if (this.match(')')) {
                    break;
                }
                this.expect(',');
                if (this.match(')')) {
                    break;
                }
            }
        }
        this.expect(')');

        return {
            simple: options.simple,
            params: options.params,
            stricted: options.stricted,
            firstRestricted: options.firstRestricted,
            message: options.message
        };
    }

    matchAsyncFunction(): boolean {
        let match = this.matchContextualKeyword('async');
        if (match) {
            const state = this.scanner.saveState();
            this.scanner.scanComments();
            const next = this.scanner.lex();
            this.scanner.restoreState(state);

            match = (state.lineNumber === next.lineNumber) && (next.type === Token.Keyword) && (next.value === 'function');
        }

        return match;
    }

    parseFunctionDeclaration(identifierIsOptional?: boolean): Node.AsyncFunctionDeclaration | Node.FunctionDeclaration {
        const node = this.createNode();

        const isAsync = this.matchContextualKeyword('async');
        if (isAsync) {
            this.nextToken();
        }

        this.expectKeyword('function');

        const isGenerator = isAsync ? false : this.match('*');
        if (isGenerator) {
            this.nextToken();
        }

        let message;
        let id: Node.Identifier | null = null;
        let firstRestricted: RawToken | null = null;

        if (!identifierIsOptional || !this.match('(')) {
            const token = this.lookahead;
            id = this.parseVariableIdentifier();
            if (this.context.strict) {
                if (this.scanner.isRestrictedWord(token.value as string)) {
                    this.tolerateUnexpectedToken(token, Messages.StrictFunctionName);
                }
            } else {
                if (this.scanner.isRestrictedWord(token.value as string)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (this.scanner.isStrictModeReservedWord(token.value as string)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        const previousAllowAwait = this.context.await;
        const previousAllowYield = this.context.allowYield;
        this.context.await = isAsync;
        this.context.allowYield = !isGenerator;

        const formalParameters = this.parseFormalParameters(firstRestricted);
        const params = formalParameters.params;
        const stricted = formalParameters.stricted;
        firstRestricted = formalParameters.firstRestricted;
        if (formalParameters.message) {
            message = formalParameters.message;
        }

        const previousStrict = this.context.strict;
        const previousAllowStrictDirective = this.context.allowStrictDirective;
        this.context.allowStrictDirective = formalParameters.simple;
        const body = this.parseFunctionSourceElements();
        if (this.context.strict && firstRestricted) {
            this.throwUnexpectedToken(firstRestricted, message);
        }
        if (this.context.strict && stricted) {
            this.tolerateUnexpectedToken(stricted, message);
        }

        this.context.strict = previousStrict;
        this.context.allowStrictDirective = previousAllowStrictDirective;
        this.context.await = previousAllowAwait;
        this.context.allowYield = previousAllowYield;

        return isAsync ? this.finalize(node, new Node.AsyncFunctionDeclaration(id, params, body)) :
            this.finalize(node, new Node.FunctionDeclaration(id, params, body, isGenerator));
    }

    parseFunctionExpression(): Node.AsyncFunctionExpression | Node.FunctionExpression {
        const node = this.createNode();

        const isAsync = this.matchContextualKeyword('async');
        if (isAsync) {
            this.nextToken();
        }

        this.expectKeyword('function');

        const isGenerator = isAsync ? false : this.match('*');
        if (isGenerator) {
            this.nextToken();
        }

        let message;
        let id: Node.Identifier | null = null;
        let firstRestricted;

        const previousAllowAwait = this.context.await;
        const previousAllowYield = this.context.allowYield;
        this.context.await = isAsync;
        this.context.allowYield = !isGenerator;

        if (!this.match('(')) {
            const token = this.lookahead;
            id = (!this.context.strict && !isGenerator && this.matchKeyword('yield')) ? this.parseIdentifierName() : this.parseVariableIdentifier();
            if (this.context.strict) {
                if (this.scanner.isRestrictedWord(token.value as string)) {
                    this.tolerateUnexpectedToken(token, Messages.StrictFunctionName);
                }
            } else {
                if (this.scanner.isRestrictedWord(token.value as string)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (this.scanner.isStrictModeReservedWord(token.value as string)) {
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
        const previousAllowStrictDirective = this.context.allowStrictDirective;
        this.context.allowStrictDirective = formalParameters.simple;
        const body = this.parseFunctionSourceElements();
        if (this.context.strict && firstRestricted) {
            this.throwUnexpectedToken(firstRestricted, message);
        }
        if (this.context.strict && stricted) {
            this.tolerateUnexpectedToken(stricted, message);
        }
        this.context.strict = previousStrict;
        this.context.allowStrictDirective = previousAllowStrictDirective;
        this.context.await = previousAllowAwait;
        this.context.allowYield = previousAllowYield;

        return isAsync ? this.finalize(node, new Node.AsyncFunctionExpression(id, params, body)) :
            this.finalize(node, new Node.FunctionExpression(id, params, body, isGenerator));
    }

    // https://tc39.github.io/ecma262/#sec-directive-prologues-and-the-use-strict-directive

    parseDirective(): Node.Directive | Node.ExpressionStatement {
        const token = this.lookahead;

        const node = this.createNode();
        const expr = this.parseExpression();
        const directive = (expr.type === Syntax.Literal) ? this.getTokenRaw(token).slice(1, -1) : null;
        this.consumeSemicolon();

        return this.finalize(node, directive ? new Node.Directive(expr, directive) : new Node.ExpressionStatement(expr));
    }

    parseDirectivePrologues(): Node.Statement[] {
        let firstRestricted: RawToken | null = null;

        const body: Node.Statement[] = [];
        while (true) {
            const token = this.lookahead;
            if (token.type !== Token.StringLiteral) {
                break;
            }

            const statement = this.parseDirective();
            body.push(statement);
            const directive = (statement as Node.Directive).directive;
            if (typeof directive !== 'string') {
                break;
            }

            if (directive === 'use strict') {
                this.context.strict = true;
                if (firstRestricted) {
                    this.tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
                }
                if (!this.context.allowStrictDirective) {
                    this.tolerateUnexpectedToken(token, Messages.IllegalLanguageModeDirective);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        return body;
    }

    // https://tc39.github.io/ecma262/#sec-method-definitions

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
            default:
                break;
        }
        return false;
    }

    parseGetterMethod(): Node.FunctionExpression {
        const node = this.createNode();

        const isGenerator = false;
        const previousAllowYield = this.context.allowYield;
        this.context.allowYield = false;
        const formalParameters = this.parseFormalParameters();
        if (formalParameters.params.length > 0) {
            this.tolerateError(Messages.BadGetterArity);
        }
        const method = this.parsePropertyMethod(formalParameters);
        this.context.allowYield = previousAllowYield;

        return this.finalize(node, new Node.FunctionExpression(null, formalParameters.params, method, isGenerator));
    }

    parseSetterMethod(): Node.FunctionExpression {
        const node = this.createNode();

        const isGenerator = false;
        const previousAllowYield = this.context.allowYield;
        this.context.allowYield = false;
        const formalParameters = this.parseFormalParameters();
        if (formalParameters.params.length !== 1) {
            this.tolerateError(Messages.BadSetterArity);
        } else if (formalParameters.params[0] instanceof Node.RestElement) {
            this.tolerateError(Messages.BadSetterRestParameter);
        }
        const method = this.parsePropertyMethod(formalParameters);
        this.context.allowYield = previousAllowYield;

        return this.finalize(node, new Node.FunctionExpression(null, formalParameters.params, method, isGenerator));
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

    // https://tc39.github.io/ecma262/#sec-generator-function-definitions

    isStartOfExpression(): boolean {
        let start = true;

        const value = this.lookahead.value;
        switch (this.lookahead.type) {
            case Token.Punctuator:
                start = (value === '[') || (value === '(') || (value === '{') ||
                    (value === '+') || (value === '-') ||
                    (value === '!') || (value === '~') ||
                    (value === '++') || (value === '--') ||
                    (value === '/') || (value === '/=');  // regular expression literal
                break;

            case Token.Keyword:
                start = (value === 'class') || (value === 'delete') ||
                    (value === 'function') || (value === 'let') || (value === 'new') ||
                    (value === 'super') || (value === 'this') || (value === 'typeof') ||
                    (value === 'void') || (value === 'yield');
                break;

            default:
                break;
        }

        return start;
    }

    parseYieldExpression(): Node.YieldExpression {
        const node = this.createNode();
        this.expectKeyword('yield');

        let argument: Node.Expression | null = null;
        let delegate = false;
        if (!this.hasLineTerminator) {
            const previousAllowYield = this.context.allowYield;
            this.context.allowYield = false;
            delegate = this.match('*');
            if (delegate) {
                this.nextToken();
                argument = this.parseAssignmentExpression();
            } else if (this.isStartOfExpression()) {
                argument = this.parseAssignmentExpression();
            }
            this.context.allowYield = previousAllowYield;
        }

        return this.finalize(node, new Node.YieldExpression(argument, delegate));
    }

    // https://tc39.github.io/ecma262/#sec-class-definitions

    parseClassElement(hasConstructor): Node.Property {
        let token = this.lookahead;
        let node = this.createNode();

        let kind: string = '';
        let key: Node.PropertyKey | null = null;
        let value: Node.FunctionExpression | null = null;
        let computed = false;
        let method = false;
        let isStatic = false;
        let isAsync = false;

        if (this.match('*')) {
            this.nextToken();
        } else {
            computed = this.match('[');
            key = this.parseObjectPropertyKey();
            const id = key as Node.Identifier;
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
            if ((token.type === Token.Identifier) && !this.hasLineTerminator && (token.value === 'async')) {
                const punctuator = this.lookahead.value;
                if (punctuator !== ':' && punctuator !== '(' && punctuator !== '*') {
                    isAsync = true;
                    token = this.lookahead;
                    key = this.parseObjectPropertyKey();
                    if (token.type === Token.Identifier) {
                        if (token.value === 'get' || token.value === 'set') {
                            this.tolerateUnexpectedToken(token);
                        } else if (token.value === 'constructor') {
                            this.tolerateUnexpectedToken(token, Messages.ConstructorIsAsync);
                        }
                    }
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
            value = isAsync ? this.parsePropertyMethodAsyncFunction() : this.parsePropertyMethodFunction();
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
                if (kind !== 'method' || !method || (value && value.generator)) {
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
        const body: Node.Property[] = [];
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

    parseClassDeclaration(identifierIsOptional?: boolean): Node.ClassDeclaration {
        const node = this.createNode();

        const previousStrict = this.context.strict;
        this.context.strict = true;
        this.expectKeyword('class');

        const id = (identifierIsOptional && (this.lookahead.type !== Token.Identifier)) ? null : this.parseVariableIdentifier();
        let superClass: Node.Identifier | null = null;
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
        let superClass: Node.Identifier | null = null;
        if (this.matchKeyword('extends')) {
            this.nextToken();
            superClass = this.isolateCoverGrammar(this.parseLeftHandSideExpressionAllowCall);
        }
        const classBody = this.parseClassBody();
        this.context.strict = previousStrict;

        return this.finalize(node, new Node.ClassExpression(id, superClass, classBody));
    }

    // https://tc39.github.io/ecma262/#sec-scripts
    // https://tc39.github.io/ecma262/#sec-modules

    parseModule(): Node.Module {
        this.context.strict = true;
        this.context.isModule = true;
        const node = this.createNode();
        const body = this.parseDirectivePrologues();
        while (this.lookahead.type !== Token.EOF) {
            body.push(this.parseStatementListItem());
        }
        return this.finalize(node, new Node.Module(body));
    }

    parseScript(): Node.Script {
        const node = this.createNode();
        const body = this.parseDirectivePrologues();
        while (this.lookahead.type !== Token.EOF) {
            body.push(this.parseStatementListItem());
        }
        return this.finalize(node, new Node.Script(body));
    }

    // https://tc39.github.io/ecma262/#sec-imports

    parseModuleSpecifier(): Node.Literal {
        const node = this.createNode();

        if (this.lookahead.type !== Token.StringLiteral) {
            this.throwError(Messages.InvalidModuleSpecifier);
        }

        const token = this.nextToken();
        const raw = this.getTokenRaw(token);
        return this.finalize(node, new Node.Literal(token.value as string, raw));
    }

    // import {<foo as bar>} ...;
    parseImportSpecifier(): Node.ImportSpecifier {
        const node = this.createNode();

        let imported: Node.Identifier;
        let local: Node.Identifier;
        if (this.lookahead.type === Token.Identifier) {
            imported = this.parseVariableIdentifier();
            local = imported;
            if (this.matchContextualKeyword('as')) {
                this.nextToken();
                local = this.parseVariableIdentifier();
            }
        } else {
            imported = this.parseIdentifierName();
            local = imported;
            if (this.matchContextualKeyword('as')) {
                this.nextToken();
                local = this.parseVariableIdentifier();
            } else {
                this.throwUnexpectedToken(this.nextToken());
            }
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
        const local = this.parseIdentifierName();
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
        const local = this.parseIdentifierName();

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

    // https://tc39.github.io/ecma262/#sec-exports

    parseExportSpecifier(): Node.ExportSpecifier {
        const node = this.createNode();

        const local = this.parseIdentifierName();
        let exported = local;
        if (this.matchContextualKeyword('as')) {
            this.nextToken();
            exported = this.parseIdentifierName();
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
                const declaration = this.parseClassDeclaration(true);
                exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
            } else if (this.matchContextualKeyword('async')) {
                // export default async function f () {}
                // export default async function () {}
                // export default async x => x
                const declaration = this.matchAsyncFunction() ? this.parseFunctionDeclaration(true) : this.parseAssignmentExpression();
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

        } else if (this.matchAsyncFunction()) {
            const declaration = this.parseFunctionDeclaration();
            exportDeclaration = this.finalize(node, new Node.ExportNamedDeclaration(declaration, [], null));

        } else {
            const specifiers: Node.ExportSpecifier[] = [];
            let source: Node.Literal | null = null;
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
