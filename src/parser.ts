import { assert } from './assert';
import { Messages} from './messages';

import { ErrorHandler } from './error-handler';
import { Token, TokenName } from './token';
import { Comment, Scanner } from './scanner';

import { Syntax } from './syntax';
import * as Node from './nodes';

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

function createNode() {
    return {
        index: state.startIndex,
        line: state.startLineNumber,
        column: state.startIndex - state.startLineStart
    };
}

function startNode(token) {
    return {
        index: token.start,
        line: token.lineNumber,
        column: token.start - token.lineStart
    };
}

function finalize(meta, node) {
    if (options.range) {
        node.range = [meta.index, state.lastIndex];
    }

    if (options.loc) {
        node.loc = {
            start: {
                line: meta.line,
                column: meta.column
            },
            end: {
                line: state.lastLineNumber,
                column: state.lastIndex - state.lastLineStart
            }
        };
        if (options.source) {
            node.loc.source = options.source;
        }
    }

    if (options.attachComment) {
        node = handleComment(node);
    }

    return node;
}

function handleComment(node) {
    if (node.type === Syntax.Program && node.body.length > 0) {
        return node;
    }

    /**
     * patch innnerComments for properties empty block
     * `function a() {/** comments **\/}`
     */

    if (node.type === Syntax.BlockStatement && node.body.length === 0) {
        let innerComments = [];
        for (let i = state.leadingComments.length - 1; i >= 0; --i) {
            let comment = state.leadingComments[i];
            if (node.range[1] >= comment.range[1]) {
                innerComments.unshift(comment);
                state.leadingComments.splice(i, 1);
                state.trailingComments.splice(i, 1);
            }
        }
        if (innerComments.length) {
            node.innerComments = innerComments;
            return node;
        }
    }

    let bottomRight = state.bottomRightStack;
    let last = bottomRight[bottomRight.length - 1];

    let trailingComments = [];
    if (state.trailingComments.length > 0) {
        for (let i = state.trailingComments.length - 1; i >= 0; --i) {
            let comment = state.trailingComments[i];
            if (comment.range[0] >= node.range[1]) {
                trailingComments.unshift(comment);
                state.trailingComments.splice(i, 1);
            }
        }
        state.trailingComments = [];
    } else {
        if (last && last.trailingComments && last.trailingComments[0].range[0] >= node.range[1]) {
            trailingComments = last.trailingComments;
            delete last.trailingComments;
        }
    }

    // Eating the stack.
    let lastChild;
    while (last && last.range[0] >= node.range[0]) {
        lastChild = bottomRight.pop();
        last = bottomRight[bottomRight.length - 1];
    }

    let leadingComments = [];
    if (lastChild) {
        if (lastChild.leadingComments) {
            for (let i = lastChild.leadingComments.length - 1; i >= 0; --i) {
                let comment = lastChild.leadingComments[i];
                if (comment.range[1] <= node.range[0]) {
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
            if (comment.range[1] <= node.range[0]) {
                leadingComments.unshift(comment);
                state.leadingComments.splice(i, 1);
            }
        }
    }


    if (leadingComments && leadingComments.length > 0) {
        node.leadingComments = leadingComments;
    }
    if (trailingComments && trailingComments.length > 0) {
        node.trailingComments = trailingComments;
    }

    bottomRight.push(node);
    return node;
}

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
    const node = createNode();

    expect('[');
    let elements = [];
    while (!match(']')) {
        if (match(',')) {
            nextToken();
            elements.push(null);
        } else {
            if (match('...')) {
                const restNode = createNode();
                nextToken();
                params.push(state.lookahead);
                const rest = parseVariableIdentifier(kind);
                elements.push(finalize(restNode, new Node.RestElement(rest)));
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

    return finalize(node, new Node.ArrayPattern(elements));
}

function parsePropertyPattern(params, kind) {
    const node = createNode();
    const computed = match('[');

    let init, key;
    if (state.lookahead.type === Token.Identifier) {
        const keyToken = state.lookahead;
        key = parseVariableIdentifier();
        if (match('=')) {
            params.push(keyToken);
            nextToken();
            init = parseAssignmentExpression();
            const value = finalize(startNode(keyToken), new Node.AssignmentPattern(key, init));
            return finalize(node, new Node.Property('init', key, false, value, false, false));
        } else if (!match(':')) {
            params.push(keyToken);
            return finalize(node, new Node.Property('init', key, false, key, false, true));
        }
    } else {
        key = parseObjectPropertyKey();
    }

    expect(':');
    init = parsePatternWithDefault(params, kind);
    return finalize(node, new Node.Property('init', key, computed, init, false, false));
}

function parseObjectPattern(params, kind) {
    const node = createNode();
    let properties = [];

    expect('{');
    while (!match('}')) {
        properties.push(parsePropertyPattern(params, kind));
        if (!match('}')) {
            expect(',');
        }
    }
    expect('}');

    return finalize(node, new Node.ObjectPattern(properties));
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
    const startToken = state.lookahead;
    let pattern = parsePattern(params, kind);

    if (match('=')) {
        nextToken();
        const previousAllowYield = state.allowYield;
        state.allowYield = true;
        const right = isolateCoverGrammar(parseAssignmentExpression);
        state.allowYield = previousAllowYield;
        pattern = finalize(startNode(startToken), new Node.AssignmentPattern(pattern, right));
    }

    return pattern;
}

// ECMA-262 12.2.5 Array Initializer

function parseArrayInitializer() {
    const node = createNode();
    let elements = [];

    expect('[');
    while (!match(']')) {
        if (match(',')) {
            nextToken();
            elements.push(null);
        } else if (match('...')) {
            let element = createNode();
            nextToken();
            const arg = inheritCoverGrammar(parseAssignmentExpression);
            element = finalize(element, new Node.SpreadElement(arg));

            if (!match(']')) {
                state.isAssignmentTarget = state.isBindingElement = false;
                expect(',');
            }
            elements.push(element);
        } else {
            elements.push(inheritCoverGrammar(parseAssignmentExpression));

            if (!match(']')) {
                expect(',');
            }
        }
    }
    expect(']');

    return finalize(node, new Node.ArrayExpression(elements));
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
    return finalize(node, new Node.FunctionExpression(null, paramInfo.params, paramInfo.defaults, body, isGenerator));
}

function parsePropertyMethodFunction() {
    const node = createNode();

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
    const node = createNode();
    const token = nextToken();

    // Note: This function is called only from parseObjectProperty(), where
    // EOF and Punctuator tokens are already filtered out.

    switch (token.type) {
        case Token.StringLiteral:
        case Token.NumericLiteral:
            if (state.strict && token.octal) {
                tolerateUnexpectedToken(token, Messages.StrictOctalLiteral);
            }
            const raw = scanner.source.slice(token.start, token.end);
            return finalize(node, new Node.Literal(token.value, raw));
        case Token.Identifier:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.Keyword:
            return finalize(node, new Node.Identifier(token.value));
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
            let methodNode = createNode();
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

            return finalize(node, new Node.Property('get', key, computed, value, false, false));
        } else if (token.value === 'set' && lookaheadPropertyName()) {
            computed = match('[');
            key = parseObjectPropertyKey();
            let methodNode = createNode();
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

            return finalize(node, new Node.Property('set', key, computed, value, false, false));
        }
    } else if (token.type === Token.Punctuator && token.value === '*' && lookaheadPropertyName()) {
        computed = match('[');
        key = parseObjectPropertyKey();
        let methodNode = createNode();

        state.allowYield = true;
        const params = parseParams();
        state.allowYield = previousAllowYield;

        state.allowYield = false;
        const value = parsePropertyFunction(methodNode, params, true);
        state.allowYield = previousAllowYield;

        return finalize(node, new Node.Property('init', key, computed, value, true, false));
    }

    if (key && match('(')) {
        const value = parsePropertyMethodFunction();
        return finalize(node, new Node.Property('init', key, computed, value, true, false));
    }

    // Not a MethodDefinition.
    return null;
}

function parseObjectProperty(hasProto) {
    const node = createNode();

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
        return finalize(node, new Node.Property('init', key, computed, value, false, false));
    }

    if (token.type === Token.Identifier) {
        if (match('=')) {
            state.firstCoverInitializedNameError = state.lookahead;
            nextToken();
            const init = isolateCoverGrammar(parseAssignmentExpression);
            const value = finalize(startNode(token), new Node.AssignmentPattern(key, init));
            return finalize(node, new Node.Property('init', key, computed, value, false, true));
        }
        return finalize(node, new Node.Property('init', key, computed, key, false, true));
    }

    throwUnexpectedToken(state.lookahead);
}

function parseObjectInitializer() {
    const node = createNode();
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

    return finalize(node, new Node.ObjectExpression(properties));
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

    const node = createNode();
    const token = nextToken();
    const value = {
        raw: token.value.raw,
        cooked: token.value.cooked
    };

    return finalize(node, new Node.TemplateElement(value, token.tail));
}

function parseTemplateLiteral() {
    const node = createNode();
    let quasi = parseTemplateElement({ head: true });
    let quasis = [quasi];
    let expressions = [];
    while (!quasi.tail) {
        expressions.push(parseExpression());
        quasi = parseTemplateElement({ head: false });
        quasis.push(quasi);
    }

    return finalize(node, new Node.TemplateLiteral(quasis, expressions));
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

        expr = finalize(startNode(startToken), new Node.SequenceExpression(expressions));
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
    const node = createNode();
    let expr;

    if (type === Token.Identifier) {
        if (state.sourceType === 'module' && state.lookahead.value === 'await') {
            tolerateUnexpectedToken(state.lookahead);
        }
        expr = finalize(node, new Node.Identifier(nextToken().value));
    } else if (type === Token.StringLiteral || type === Token.NumericLiteral) {
        state.isAssignmentTarget = state.isBindingElement = false;
        if (state.strict && state.lookahead.octal) {
            tolerateUnexpectedToken(state.lookahead, Messages.StrictOctalLiteral);
        }
        const token = nextToken();
        const raw = scanner.source.slice(token.start, token.end);
        expr = finalize(node, new Node.Literal(token.value, raw));
    } else if (type === Token.Keyword) {
        if (!state.strict && state.allowYield && matchKeyword('yield')) {
            return parseNonComputedProperty();
        }
        if (!state.strict && matchKeyword('let')) {
            return finalize(node, new Node.Identifier(nextToken().value));
        }
        state.isAssignmentTarget = state.isBindingElement = false;
        if (matchKeyword('function')) {
            return parseFunctionExpression();
        }
        if (matchKeyword('this')) {
            nextToken();
            return finalize(node, new Node.ThisExpression());
        }
        if (matchKeyword('class')) {
            return parseClassExpression();
        }
        throwUnexpectedToken(nextToken());
    } else if (type === Token.BooleanLiteral) {
        state.isAssignmentTarget = state.isBindingElement = false;
        let token = nextToken();
        token.value = (token.value === 'true');
        const raw = scanner.source.slice(token.start, token.end);
        expr = finalize(node, new Node.Literal(token.value, raw));
    } else if (type === Token.NullLiteral) {
        state.isAssignmentTarget = state.isBindingElement = false;
        let token = nextToken();
        token.value = null;
        const raw = scanner.source.slice(token.start, token.end);
        expr = finalize(node, new Node.Literal(token.value, raw));
    } else if (match('/') || match('/=')) {
        state.isAssignmentTarget = state.isBindingElement = false;
        scanner.index = state.startIndex;
        let token = nextRegexToken();
        const raw = scanner.source.slice(token.start, token.end);
        expr = finalize(node, new Node.RegexLiteral(token.value, raw, token.regex));
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
                expr = createNode();
                nextToken();
                const arg = isolateCoverGrammar(parseAssignmentExpression);
                expr = finalize(expr, new Node.SpreadElement(arg));
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
    const node = createNode();
    const token = nextToken();
    if (!isIdentifierName(token)) {
        throwUnexpectedToken(token);
    }

    return finalize(node, new Node.Identifier(token.value));
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
    const node = createNode();

    const newNode = createNode();
    const newToken = nextToken();
    assert(newToken.value === 'new', 'New expression must start with `new`');
    const newId = finalize(newNode, new Node.Identifier(newToken.value));

    if (match('.')) {
        nextToken();
        if (state.lookahead.type === Token.Identifier && state.lookahead.value === 'target') {
            if (state.inFunctionBody) {
                const targetNode = createNode();
                const targetId = finalize(targetNode, new Node.Identifier(nextToken().value));
                return finalize(node, new Node.MetaProperty(newId, targetId));
            }
        }
        throwUnexpectedToken(state.lookahead);
    }

    const callee = isolateCoverGrammar(parseLeftHandSideExpression);
    const args = match('(') ? parseArguments() : [];

    state.isAssignmentTarget = state.isBindingElement = false;
    return finalize(node, new Node.NewExpression(callee, args));
}

// ECMA-262 12.3.4 Function Calls

function parseLeftHandSideExpressionAllowCall() {
    const startToken = state.lookahead;
    const previousAllowIn = state.allowIn;
    state.allowIn = true;

    let expr;
    if (matchKeyword('super') && state.inFunctionBody) {
        expr = createNode();
        nextToken();
        expr = finalize(expr, new Node.Super());
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
            expr = finalize(startNode(startToken), new Node.StaticMemberExpression(expr, property));
        } else if (match('(')) {
            state.isBindingElement = false;
            state.isAssignmentTarget = false;
            const args = parseArguments();
            expr = finalize(startNode(startToken), new Node.CallExpression(expr, args));
        } else if (match('[')) {
            state.isBindingElement = false;
            state.isAssignmentTarget = true;
            const property = parseComputedMember();
            expr = finalize(startNode(startToken), new Node.ComputedMemberExpression(expr, property));
        } else if (state.lookahead.type === Token.Template && state.lookahead.head) {
            const quasi = parseTemplateLiteral();
            expr = finalize(startNode(startToken), new Node.TaggedTemplateExpression(expr, quasi));
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

    const node = startNode(state.lookahead);
    let expr;
    if (matchKeyword('super') && state.inFunctionBody) {
        expr = createNode();
        nextToken();
        expr = finalize(expr, new Node.Super());
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
            expr = finalize(node, new Node.ComputedMemberExpression(expr, property));
        } else if (match('.')) {
            state.isBindingElement = false;
            state.isAssignmentTarget = true;
            const property = parseNonComputedMember();
            expr = finalize(node, new Node.StaticMemberExpression(expr, property));
        } else if (state.lookahead.type === Token.Template && state.lookahead.head) {
            const quasi = parseTemplateLiteral();
            expr = finalize(node, new Node.TaggedTemplateExpression(expr, quasi));
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
            expr = finalize(startNode(startToken), new Node.PostfixExpression(token.value, expr));
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
        const node = startNode(state.lookahead);
        const token = nextToken();
        expr = inheritCoverGrammar(parseUnaryExpression);
        // ECMA-262 11.4.4, 11.4.5
        if (state.strict && expr.type === Syntax.Identifier && scanner.isRestrictedWord(expr.name)) {
            tolerateError(Messages.StrictLHSPrefix);
        }

        if (!state.isAssignmentTarget) {
            tolerateError(Messages.InvalidLHSInAssignment);
        }
        expr = finalize(node, new Node.UnaryExpression(token.value, expr));
        state.isAssignmentTarget = state.isBindingElement = false;
    } else if (match('+') || match('-') || match('~') || match('!')) {
        const node = startNode(state.lookahead);
        const token = nextToken();
        expr = inheritCoverGrammar(parseUnaryExpression);
        expr = finalize(node, new Node.UnaryExpression(token.value, expr));
        state.isAssignmentTarget = state.isBindingElement = false;
    } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
        const node = startNode(state.lookahead);
        const token = nextToken();
        expr = inheritCoverGrammar(parseUnaryExpression);
        expr = finalize(node, new Node.UnaryExpression(token.value, expr));
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

        // Reduce: make a binary expression from the three topmost entries.
        while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
            right = stack.pop();
            const operator = stack.pop().value;
            left = stack.pop();
            markers.pop();
            const node = startNode(markers[markers.length - 1]);
            stack.push(finalize(node, new Node.BinaryExpression(operator, left, right)));
        }

        // Shift.
        token = nextToken();
        token.prec = prec;
        stack.push(token);
        markers.push(state.lookahead);
        stack.push(isolateCoverGrammar(parseUnaryExpression));
    }

    // Final reduce to clean-up the stack.
    let i = stack.length - 1;
    let expr = stack[i];
    markers.pop();
    while (i > 1) {
        const node = startNode(markers.pop());
        expr = finalize(node, new Node.BinaryExpression(stack[i - 1].value, stack[i - 2], expr));
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

        expr = finalize(startNode(startToken), new Node.ConditionalExpression(expr, consequent, alternate));
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

    return finalize(node, new Node.ArrowFunctionExpression(options.params, options.defaults, body, body.type !== Syntax.BlockStatement));
}

// ECMA-262 14.4 Yield expression

function parseYieldExpression() {
    let expr = createNode();
    expectKeyword('yield');

    let argument = null;
    let delegate = false;
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

    return finalize(expr, new Node.YieldExpression(argument, delegate));
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
            return parseArrowFunctionExpression(list, startNode(startToken));
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
        expr = finalize(startNode(startToken), new Node.AssignmentExpression(token.value, expr, right));
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

        expr = finalize(startNode(startToken), new Node.SequenceExpression(expressions));
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
                return parseFunctionDeclaration(createNode());
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
    const node = createNode();

    expect('{');
    const block = parseStatementList();
    expect('}');

    return finalize(node, new Node.BlockStatement(block));
}

// ECMA-262 13.3.2 Variable Statement

function parseVariableIdentifier(kind?) {
    const node = createNode();
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

    return finalize(node, new Node.Identifier(token.value));
}

function parseVariableDeclaration(options) {
    const node = createNode();

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

    return finalize(node, new Node.VariableDeclarator(id, init));
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

    return finalize(node, new Node.VariableDeclaration(declarations, 'var'));
}

// ECMA-262 13.3.1 Let and Const Declarations

function parseLexicalBinding(kind, options) {
    const node = createNode();
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

    return finalize(node, new Node.VariableDeclarator(id, init));
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
    const node = createNode();
    const kind = nextToken().value;
    assert(kind === 'let' || kind === 'const', 'Lexical declaration must be either let or const');

    const declarations = parseBindingList(kind, options);
    consumeSemicolon();

    return finalize(node, new Node.VariableDeclaration(declarations, kind));
}

function parseRestElement(params) {
    const node = createNode();

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

    return finalize(node, new Node.RestElement(param));
}

// ECMA-262 13.4 Empty Statement

function parseEmptyStatement(node) {
    expect(';');
    return finalize(node, new Node.EmptyStatement());
}

// ECMA-262 12.4 Expression Statement

function parseExpressionStatement(node) {
    const expr = parseExpression();
    consumeSemicolon();
    return finalize(node, new Node.ExpressionStatement(expr));
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

    return finalize(node, new Node.IfStatement(test, consequent, alternate));
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

    return finalize(node, new Node.DoWhileStatement(body, test));
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

    return finalize(node, new Node.WhileStatement(test, body));
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
            init = createNode();
            nextToken();

            const previousAllowIn = state.allowIn;
            state.allowIn = false;
            let declarations = parseVariableDeclarationList({ inFor: true });
            state.allowIn = previousAllowIn;

            if (declarations.length === 1 && matchKeyword('in')) {
                init = finalize(init, new Node.VariableDeclaration(declarations, 'var'));
                nextToken();
                left = init;
                right = parseExpression();
                init = null;
            } else if (declarations.length === 1 && declarations[0].init === null && matchContextualKeyword('of')) {
                init = finalize(init, new Node.VariableDeclaration(declarations, 'var'));
                nextToken();
                left = init;
                right = parseAssignmentExpression();
                init = null;
                forIn = false;
            } else {
                init = finalize(init, new Node.VariableDeclaration(declarations, 'var'));
                expect(';');
            }
        } else if (matchKeyword('const') || matchKeyword('let')) {
            init = createNode();
            const kind = nextToken().value;

            if (!state.strict && state.lookahead.value === 'in') {
                init = finalize(init, new Node.Identifier(kind));
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
                    init = finalize(init, new Node.VariableDeclaration(declarations, kind));
                    nextToken();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (declarations.length === 1 && declarations[0].init === null && matchContextualKeyword('of')) {
                    init = finalize(init, new Node.VariableDeclaration(declarations, kind));
                    nextToken();
                    left = init;
                    right = parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    consumeSemicolon();
                    init = finalize(init, new Node.VariableDeclaration(declarations, kind));
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
                    init = finalize(startNode(initStartToken), new Node.SequenceExpression(initSeq));
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
        finalize(node, new Node.ForStatement(init, test, update, body)) :
        forIn ? finalize(node, new Node.ForInStatement(left, right, body)) :
            finalize(node, new Node.ForOfStatement(left, right, body));
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

        return finalize(node, new Node.ContinueStatement(null));
    }

    if (state.hasLineTerminator) {
        if (!state.inIteration) {
            throwError(Messages.IllegalContinue);
        }

        return finalize(node, new Node.ContinueStatement(null));
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

    return finalize(node, new Node.ContinueStatement(label));
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

        return finalize(node, new Node.BreakStatement(null));
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

    return finalize(node, new Node.BreakStatement(label));
}

// ECMA-262 13.10 The return statement

function parseReturnStatement(node) {
    expectKeyword('return');

    if (!state.inFunctionBody) {
        tolerateError(Messages.IllegalReturn);
    }

    let argument = null;
    if (!state.hasLineTerminator && !match(';')) {
        if (!match('}') && state.lookahead.type !== Token.EOF) {
            argument = parseExpression();
        }
    }

    consumeSemicolon();
    return finalize(node, new Node.ReturnStatement(argument));
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
    return finalize(node, new Node.WithStatement(object, body));
}

// ECMA-262 13.12 The switch statement

function parseSwitchCase() {
    const node = createNode();

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

    return finalize(node, new Node.SwitchCase(test, consequent));
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
        return finalize(node, new Node.SwitchStatement(discriminant, cases));
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

    return finalize(node, new Node.SwitchStatement(discriminant, cases));
}

// ECMA-262 13.14 The throw statement

function parseThrowStatement(node) {
    expectKeyword('throw');

    if (state.hasLineTerminator) {
        throwError(Messages.NewlineAfterThrow);
    }

    const argument = parseExpression();
    consumeSemicolon();

    return finalize(node, new Node.ThrowStatement(argument));
}

// ECMA-262 13.15 The try statement

function parseCatchClause() {
    const node = createNode();

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
    return finalize(node, new Node.CatchClause(param, body));
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

    return finalize(node, new Node.TryStatement(block, handler, finalizer));
}

// ECMA-262 13.16 The debugger statement

function parseDebuggerStatement(node) {
    expectKeyword('debugger');
    consumeSemicolon();
    return finalize(node, new Node.DebuggerStatement());
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
    const node = createNode();

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
        return finalize(node, new Node.LabeledStatement(expr, labeledBody));
    }

    consumeSemicolon();

    return finalize(node, new Node.ExpressionStatement(expr));
}

// ECMA-262 14.1.1 Directive Prologues

function parseDirectivePrologues() {
    let firstRestricted = null;

    const body = [];
    while (!scanner.eof()) {
        if (state.lookahead.type !== Token.StringLiteral) {
            break;
        }

        const token = state.lookahead;
        const node = createNode();
        const statement = parseExpressionStatement(node);
        body.push(statement);

        if (statement.expression.type !== Syntax.Literal) {
            // this is not directive
            break;
        }

        // Trim the initial and trailing quotes.
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

    return body;
}

// ECMA-262 14.1 Function Definition

function parseFunctionSourceElements() {
    const node = createNode();

    expect('{');
    const body = parseDirectivePrologues();

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

    return finalize(node, new Node.BlockStatement(body));
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

    return finalize(node, new Node.FunctionDeclaration(id, params, defaults, body, isGenerator));
}

function parseFunctionExpression() {
    const node = createNode();

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

    return finalize(node, new Node.FunctionExpression(id, params, defaults, body, isGenerator));
}

// ECMA-262 14.5 Class Definitions

function parseClassBody() {
    const node = createNode();
    let hasConstructor = false;
    let body = [];

    expect('{');
    while (!match('}')) {
        if (match(';')) {
            nextToken();
        } else {
            let node = createNode();
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
            let method = tryParseMethodDefinition(token, key, computed, node);
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

    return finalize(node, new Node.ClassBody(body));
}

function parseClassDeclaration(identifierIsOptional?) {
    const node = createNode();

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

    return finalize(node, new Node.ClassDeclaration(id, superClass, classBody));
}

function parseClassExpression() {
    const node = createNode();

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

    return finalize(node, new Node.ClassExpression(id, superClass, classBody));
}

// ECMA-262 15.2 Modules

function parseModuleSpecifier() {
    const node = createNode();

    if (state.lookahead.type !== Token.StringLiteral) {
        throwError(Messages.InvalidModuleSpecifier);
    }

    const token = nextToken();
    const raw = scanner.source.slice(token.start, token.end);
    return finalize(node, new Node.Literal(token.value, raw));
}

// ECMA-262 15.2.3 Exports

function parseExportSpecifier() {
    const node = createNode();
    let local, exported;
    if (matchKeyword('default')) {
        // export {default} from 'something';
        let def = createNode();
        nextToken();
        local = finalize(def, new Node.Identifier('default'));
    } else {
        local = parseVariableIdentifier();
    }
    if (matchContextualKeyword('as')) {
        nextToken();
        exported = parseNonComputedProperty();
    }
    return finalize(node, new Node.ExportSpecifier(local, exported));
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
                return finalize(node, new Node.ExportNamedDeclaration(declaration, specifiers, null));
            case 'var':
            case 'class':
            case 'function':
                declaration = parseStatementListItem();
                return finalize(node, new Node.ExportNamedDeclaration(declaration, specifiers, null));
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
    return finalize(node, new Node.ExportNamedDeclaration(null, specifiers, src));
}

function parseExportDefaultDeclaration(node) {
    // covers:
    // export default ...
    expectKeyword('default');

    if (matchKeyword('function')) {
        // covers:
        // export default function foo () {}
        // export default function () {}
        let declaration = parseFunctionDeclaration(createNode(), true);
        return finalize(node, new Node.ExportDefaultDeclaration(declaration));
    }
    if (matchKeyword('class')) {
        let declaration = parseClassDeclaration(true);
        return finalize(node, new Node.ExportDefaultDeclaration(declaration));
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
    return finalize(node, new Node.ExportDefaultDeclaration(expression));
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

    return finalize(node, new Node.ExportAllDeclaration(src));
}

function parseExportDeclaration() {
    const node = createNode();
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
    const node = createNode();

    let local;
    const imported = parseNonComputedProperty();
    if (matchContextualKeyword('as')) {
        nextToken();
        local = parseVariableIdentifier();
    }

    return finalize(node, new Node.ImportSpecifier(local, imported));
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
    const node = createNode();
    const local = parseNonComputedProperty();
    return finalize(node, new Node.ImportDefaultSpecifier(local));
}

function parseImportNamespaceSpecifier() {
    // import <* as foo> ...;
    const node = createNode();

    expect('*');
    if (!matchContextualKeyword('as')) {
        throwError(Messages.NoAsAfterImportNamespace);
    }
    nextToken();
    const local = parseNonComputedProperty();

    return finalize(node, new Node.ImportNamespaceSpecifier(local));
}

function parseImportDeclaration() {
    if (state.inFunctionBody) {
        throwError(Messages.IllegalImportDeclaration);
    }

    const node = createNode();
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
    return finalize(node, new Node.ImportDeclaration(specifiers, src));
}

// ECMA-262 15.1 Scripts

function parseScriptBody() {
    const body = parseDirectivePrologues();
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
    const node = createNode();
    const body = parseScriptBody();
    return finalize(node, new Node.Program(body, state.sourceType));
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
