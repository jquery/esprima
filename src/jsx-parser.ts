import { Character} from './character';
import { Token, TokenName } from './token';

import { Parser } from './parser';

import { XHTMLEntities } from './xhtml-entities';
import { JSXSyntax } from './jsx-syntax';
import * as Node from './nodes';
import * as JSXNode from './jsx-nodes';

interface MetaJSXNode {
    index: number;
    line: number;
    column: number;
}

interface MetaJSXElement {
    node: MetaJSXNode;
    opening: JSXNode.JSXOpeningElement;
    closing: JSXNode.JSXClosingElement;
    children: JSXNode.JSXChild[];
}

enum JSXToken {
    Identifier = 100,
    Text
}

TokenName[JSXToken.Identifier] = 'JSXIdentifier';
TokenName[JSXToken.Text] = 'JSXText';

// Fully qualified element name, e.g. <svg:path> returns "svg:path"
function getQualifiedElementName(elementName: JSXNode.JSXElementName): string {
    let qualifiedName;

    switch (elementName.type) {
        case JSXSyntax.JSXIdentifier:
            const id = <JSXNode.JSXIdentifier>(elementName);
            qualifiedName = id.name;
            break;
        case JSXSyntax.JSXNamespacedName:
            const ns = <JSXNode.JSXNamespacedName>(elementName);
            qualifiedName = getQualifiedElementName(ns.namespace) + ':' +
                getQualifiedElementName(ns.name);
            break;
        case JSXSyntax.JSXMemberExpression:
            const expr = <JSXNode.JSXMemberExpression>(elementName);
            qualifiedName = getQualifiedElementName(expr.object) + '.' +
                getQualifiedElementName(expr.property);
            break;
    }

    return qualifiedName;
}

export class JSXParser extends Parser {

    constructor(code: string, options, delegate) {
        super(code, options, delegate);
    }

    parsePrimaryExpression(): Node.Expression | JSXNode.JSXElement {
        return this.match('<') ? this.parseJSXRoot() : super.parsePrimaryExpression();
    }

    startJSX() {
        // Unwind the scanner before the lookahead token.
        this.scanner.index = this.startMarker.index;
        this.scanner.lineNumber = this.startMarker.lineNumber;
        this.scanner.lineStart = this.startMarker.lineStart;
    }

    finishJSX() {
        // Prime the next lookahead.
        this.nextToken();
    }

    createJSXNode(): MetaJSXNode {
        this.collectComments();
        return {
            index: this.scanner.index,
            line: this.scanner.lineNumber,
            column: this.scanner.index - this.scanner.lineStart
        };
    }

    createJSXChildNode(): MetaJSXNode {
        return {
            index: this.scanner.index,
            line: this.scanner.lineNumber,
            column: this.scanner.index - this.scanner.lineStart
        };
    }

    scanXHTMLEntity() {
        let result = '&';

        let str = '';
        while (!this.scanner.eof()) {
            const ch = this.scanner.source[this.scanner.index++];
            if (ch === ';') {
                if (str[0] === '#') {
                    str = str.substr(1);
                    const hex = (str[0] === 'x');
                    const cp = hex ? parseInt('0' + str, 16) : parseInt(str, 10);
                    result = String.fromCharCode(cp);
                } else if (XHTMLEntities[str]) {
                    result = XHTMLEntities[str];
                } else {
                    result += ch;
                }
                break;
            }
            str += ch;
            result += ch;
        }

        return result;
    }

    // Scan the next JSX token. This replaces Scanner#lex when in JSX mode.

    lexJSX(): any {
        const cp = this.scanner.source.charCodeAt(this.scanner.index);

        // < > / : = { }
        if (cp === 60 || cp === 62 || cp === 47 || cp === 58 || cp === 61 || cp === 123 || cp === 125) {
            const value = this.scanner.source[this.scanner.index++];
            return {
                type: Token.Punctuator,
                value: value,
                lineNumber: this.scanner.lineNumber,
                lineStart: this.scanner.lineStart,
                start: this.scanner.index - 1,
                end: this.scanner.index
            };
        }

        // " '
        if (cp === 34 || cp === 39) {
            const start = this.scanner.index;
            const quote = this.scanner.source[this.scanner.index++];
            let str = '';
            while (!this.scanner.eof()) {
                const ch = this.scanner.source[this.scanner.index++];
                if (ch === quote) {
                    break;
                } else if (ch === '&') {
                    str += this.scanXHTMLEntity();
                } else {
                    str += ch;
                }
            }

            return {
                type: Token.StringLiteral,
                value: str,
                lineNumber: this.scanner.lineNumber,
                lineStart: this.scanner.lineStart,
                start: start,
                end: this.scanner.index
            };
        }

        // ... or .
        if (cp === 46) {
            const n1 = this.scanner.source.charCodeAt(this.scanner.index + 1);
            const n2 = this.scanner.source.charCodeAt(this.scanner.index + 2);
            const value = (n1 === 46 && n2 === 46) ? '...' : '.';
            const start = this.scanner.index;
            this.scanner.index += value.length;
            return {
                type: Token.Punctuator,
                value: value,
                lineNumber: this.scanner.lineNumber,
                lineStart: this.scanner.lineStart,
                start: start,
                end: this.scanner.index
            };
        }

        // Identifer can not contain backslash (char code 92).
        if (Character.isIdentifierStart(cp) && (cp !== 92)) {
            const start = this.scanner.index;
            ++this.scanner.index;
            while (!this.scanner.eof()) {
                const ch = this.scanner.source.charCodeAt(this.scanner.index);
                if (Character.isIdentifierPart(ch) && (ch !== 92)) {
                    ++this.scanner.index;
                } else if (ch === 45) {
                    // Hyphen (char code 45) can be part of an identifier.
                    ++this.scanner.index;
                } else {
                    break;
                }
            }
            const id = this.scanner.source.slice(start, this.scanner.index);
            return {
                type: JSXToken.Identifier,
                value: id,
                lineNumber: this.scanner.lineNumber,
                lineStart: this.scanner.lineStart,
                start: start,
                end: this.scanner.index
            };
        }

        this.scanner.throwUnexpectedToken();
    }

    nextJSXToken() {
        this.collectComments();

        this.startMarker.index = this.scanner.index;
        this.startMarker.lineNumber = this.scanner.lineNumber;
        this.startMarker.lineStart = this.scanner.lineStart;
        const token = this.lexJSX();
        this.lastMarker.index = this.scanner.index;
        this.lastMarker.lineNumber = this.scanner.lineNumber;
        this.lastMarker.lineStart = this.scanner.lineStart;

        if (this.config.tokens) {
            this.tokens.push(this.convertToken(token));
        }

        return token;
    }

    nextJSXText() {
        this.startMarker.index = this.scanner.index;
        this.startMarker.lineNumber = this.scanner.lineNumber;
        this.startMarker.lineStart = this.scanner.lineStart;

        const start = this.scanner.index;

        let text = '';
        while (!this.scanner.eof()) {
            const ch = this.scanner.source[this.scanner.index];
            if (ch === '{' || ch === '<') {
                break;
            }
            ++this.scanner.index;
            text += ch;
            if (Character.isLineTerminator(ch.charCodeAt(0))) {
                ++this.scanner.lineNumber;
                if (ch === '\r' && this.scanner.source[this.scanner.index] === '\n') {
                    ++this.scanner.index;
                }
                this.scanner.lineStart = this.scanner.index;
            }
        }

        this.lastMarker.index = this.scanner.index;
        this.lastMarker.lineNumber = this.scanner.lineNumber;
        this.lastMarker.lineStart = this.scanner.lineStart;

        const token = {
            type: JSXToken.Text,
            value: text,
            lineNumber: this.scanner.lineNumber,
            lineStart: this.scanner.lineStart,
            start: start,
            end: this.scanner.index
        };

        if ((text.length > 0) && this.config.tokens) {
            this.tokens.push(this.convertToken(token));
        }

        return token;
    }

    peekJSXToken() {
        const previousIndex = this.scanner.index;
        const previousLineNumber = this.scanner.lineNumber;
        const previousLineStart = this.scanner.lineStart;

        this.scanner.scanComments();
        const next = this.lexJSX();
        this.scanner.index = previousIndex;
        this.scanner.lineNumber = previousLineNumber;
        this.scanner.lineStart = previousLineStart;

        return next;
    }

    // Expect the next JSX token to match the specified punctuator.
    // If not, an exception will be thrown.

    expectJSX(value) {
        const token = this.nextJSXToken();
        if (token.type !== Token.Punctuator || token.value !== value) {
            this.throwUnexpectedToken(token);
        }
    }

    // Return true if the next JSX token matches the specified punctuator.

    matchJSX(value) {
        const next = this.peekJSXToken();
        return next.type === Token.Punctuator && next.value === value;
    }

    parseJSXIdentifier(): JSXNode.JSXIdentifier {
        const node = this.createJSXNode();
        const token = this.nextJSXToken();
        if (token.type !== JSXToken.Identifier) {
            this.throwUnexpectedToken(token);
        }
        return this.finalize(node, new JSXNode.JSXIdentifier(token.value));
    }

    parseJSXElementName(): JSXNode.JSXElementName {
        const node = this.createJSXNode();
        let elementName = this.parseJSXIdentifier();

        if (this.matchJSX(':')) {
            const namespace = elementName;
            this.expectJSX(':');
            const name = this.parseJSXIdentifier();
            elementName = this.finalize(node, new JSXNode.JSXNamespacedName(namespace, name));
        } else if (this.matchJSX('.')) {
            while (this.matchJSX('.')) {
                const object = elementName;
                this.expectJSX('.');
                const property = this.parseJSXIdentifier();
                elementName = this.finalize(node, new JSXNode.JSXMemberExpression(object, property));
            }
        }

        return elementName;
    }

    parseJSXAttributeName(): JSXNode.JSXAttributeName {
        const node = this.createJSXNode();
        let attributeName: JSXNode.JSXAttributeName;

        const identifier = this.parseJSXIdentifier();
        if (this.matchJSX(':')) {
            const namespace = identifier;
            this.expectJSX(':');
            const name = this.parseJSXIdentifier();
            attributeName = this.finalize(node, new JSXNode.JSXNamespacedName(namespace, name));
        } else {
            attributeName = identifier;
        }

        return attributeName;
    }

    parseJSXStringLiteralAttribute(): Node.Literal {
        const node = this.createJSXNode();
        const token = this.nextJSXToken();
        if (token.type !== Token.StringLiteral) {
            this.throwUnexpectedToken(token);
        }
        const raw = this.getTokenRaw(token);
        return this.finalize(node, new Node.Literal(token.value, raw));
    }

    parseJSXExpressionAttribute(): JSXNode.JSXExpressionContainer {
        const node = this.createJSXNode();

        this.expectJSX('{');
        let expression = null;
        if (this.matchJSX('}')) {
            this.tolerateError('JSX attributes must only be assigned a non-empty expression');
        } else {
            this.finishJSX();
            expression = this.parseAssignmentExpression();
            this.startJSX();
        }
        this.expectJSX('}');

        return this.finalize(node, new JSXNode.JSXExpressionContainer(expression));
    }

    parseJSXAttributeValue(): JSXNode.JSXAttributeValue {
        return this.matchJSX('{') ? this.parseJSXExpressionAttribute() :
            this.matchJSX('<') ? this.parseJSXElement() : this.parseJSXStringLiteralAttribute();
    }

    parseJSXNameValueAttribute(): JSXNode.JSXAttribute {
        const node = this.createJSXNode();
        const name = this.parseJSXAttributeName();
        let value = null;
        if (this.matchJSX('=')) {
            this.expectJSX('=');
            value = this.parseJSXAttributeValue();
        }
        return this.finalize(node, new JSXNode.JSXAttribute(name, value));
    }

    parseJSXSpreadAttribute(): JSXNode.JSXSpreadAttribute {
        const node = this.createJSXNode();
        this.expectJSX('{');
        this.expectJSX('...');

        this.finishJSX();
        const argument = this.parseAssignmentExpression();
        this.startJSX();

        this.expectJSX('}');
        return this.finalize(node, new JSXNode.JSXSpreadAttribute(argument));
    }

    parseJSXAttributes(): JSXNode.JSXElementAttribute[] {
        const attributes = [];

        while (!this.matchJSX('/') && !this.matchJSX('>')) {
            const attribute = this.matchJSX('{') ? this.parseJSXSpreadAttribute() :
                this.parseJSXNameValueAttribute();
            attributes.push(attribute);
        }

        return attributes;
    }

    parseJSXOpeningElement(): JSXNode.JSXOpeningElement {
        const node = this.createJSXNode();

        this.expectJSX('<');
        const name = this.parseJSXElementName();
        const attributes = this.parseJSXAttributes();
        const selfClosing = this.matchJSX('/');
        if (selfClosing) {
            this.expectJSX('/');
        }
        this.expectJSX('>');

        return this.finalize(node, new JSXNode.JSXOpeningElement(name, selfClosing, attributes));
    }

    parseJSXBoundaryElement(): JSXNode.JSXOpeningElement | JSXNode.JSXClosingElement {
        const node = this.createJSXNode();

        this.expectJSX('<');
        if (this.matchJSX('/')) {
            this.expectJSX('/');
            const name = this.parseJSXElementName();
            this.expectJSX('>');
            return this.finalize(node, new JSXNode.JSXClosingElement(name));
        }

        const name = this.parseJSXElementName();
        const attributes = this.parseJSXAttributes();
        const selfClosing = this.matchJSX('/');
        if (selfClosing) {
            this.expectJSX('/');
        }
        this.expectJSX('>');

        return this.finalize(node, new JSXNode.JSXOpeningElement(name, selfClosing, attributes));
    }

    parseJSXEmptyExpression(): JSXNode.JSXEmptyExpression {
        const node = this.createJSXChildNode();
        this.collectComments();
        this.lastMarker.index = this.scanner.index;
        this.lastMarker.lineNumber = this.scanner.lineNumber;
        this.lastMarker.lineStart = this.scanner.lineStart;
        return this.finalize(node, new JSXNode.JSXEmptyExpression());
    }

    parseJSXExpression(): Node.Expression | JSXNode.JSXEmptyExpression {
        let expression;

        if (this.matchJSX('}')) {
            expression = this.parseJSXEmptyExpression();
        } else {
            this.finishJSX();
            expression = this.parseAssignmentExpression();
            this.startJSX();
        }

        return expression;
    }

    parseJSXExpressionContainer(): JSXNode.JSXExpressionContainer {
        const node = this.createJSXNode();
        this.expectJSX('{');
        const expression = this.parseJSXExpression();
        this.expectJSX('}');
        return this.finalize(node, new JSXNode.JSXExpressionContainer(expression));
    }

    parseJSXChildren(): JSXNode.JSXChild[] {
        const children = [];

        while (!this.scanner.eof()) {
            const node = this.createJSXChildNode();
            const token = this.nextJSXText();
            if (token.start < token.end) {
                const raw = this.getTokenRaw(token);
                const child = this.finalize(node, new JSXNode.JSXText(token.value, raw));
                children.push(child);
            }
            if (this.scanner.source[this.scanner.index] === '{') {
                const container = this.parseJSXExpressionContainer();
                children.push(container);
            } else {
                break;
            }
        }

        return children;
    }

    parseComplexJSXElement(el: MetaJSXElement): MetaJSXElement {
        const stack: MetaJSXElement[] = [];

        while (!this.scanner.eof()) {
            el.children = el.children.concat(this.parseJSXChildren());
            const node = this.createJSXChildNode();
            const element = this.parseJSXBoundaryElement();
            if (element.type === JSXSyntax.JSXOpeningElement) {
                const opening = <JSXNode.JSXOpeningElement>(element);
                if (opening.selfClosing) {
                    const child = this.finalize(node, new JSXNode.JSXElement(opening, [], null));
                    el.children.push(child);
                } else {
                    stack.push(el);
                    el = { node, opening, closing: null, children: [] };
                }
            }
            if (element.type === JSXSyntax.JSXClosingElement) {
                el.closing = <JSXNode.JSXClosingElement>(element);
                const open = getQualifiedElementName(el.opening.name);
                const close = getQualifiedElementName(el.closing.name);
                if (open !== close) {
                    this.tolerateError('Expected corresponding JSX closing tag for %0', open);
                }
                if (stack.length > 0) {
                    const child = this.finalize(el.node, new JSXNode.JSXElement(el.opening, el.children, el.closing));
                    el = stack.pop();
                    el.children.push(child);
                } else {
                    break;
                }
            }
        }

        return el;
    }

    parseJSXElement(): JSXNode.JSXElement {
        const node = this.createJSXNode();

        const opening = this.parseJSXOpeningElement();
        let children = [];
        let closing = null;

        if (!opening.selfClosing) {
            const el = this.parseComplexJSXElement({ node, opening, closing, children });
            children = el.children;
            closing = el.closing;
        }

        return this.finalize(node, new JSXNode.JSXElement(opening, children, closing));
    }

    parseJSXRoot(): JSXNode.JSXElement {
        // Pop the opening '<' added from the lookahead.
        if (this.config.tokens) {
            this.tokens.pop();
        }

        this.startJSX();
        const element = this.parseJSXElement();
        this.finishJSX();

        return element;
    }

}
