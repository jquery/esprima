import { JSXSyntax } from './jsx-syntax';
import * as Node from './nodes';

export type JSXAttributeName = JSXIdentifier | JSXNamespacedName;
export type JSXAttributeValue = Node.Literal | JSXElement | JSXSpreadAttribute | JSXExpressionContainer;
export type JSXChild = JSXElement | JSXExpressionContainer | JSXText;
export type JSXElementAttribute = JSXAttribute | JSXSpreadAttribute;
export type JSXElementName = JSXIdentifier | JSXNamespacedName | JSXMemberExpression;

export class JSXClosingElement {
    type: string;
    name: JSXElementName;
    constructor(name: JSXElementName) {
        this.type = JSXSyntax.JSXClosingElement;
        this.name = name;
    }
}

export class JSXElement {
    type: string;
    openingElement: JSXOpeningElement;
    children: JSXChild[];
    closingElement: JSXClosingElement;
    constructor(openingElement: JSXOpeningElement, children: JSXChild[], closingElement: JSXClosingElement) {
        this.type = JSXSyntax.JSXElement;
        this.openingElement = openingElement;
        this.children = children;
        this.closingElement = closingElement;
    }
}

export class JSXEmptyExpression {
    type: string;
    constructor() {
        this.type = JSXSyntax.JSXEmptyExpression;
    }
}

export class JSXExpressionContainer {
    type: string;
    expression: Node.Expression | JSXEmptyExpression;
    constructor(expression: Node.Expression | JSXEmptyExpression) {
        this.type = JSXSyntax.JSXExpressionContainer;
        this.expression = expression;
    }
}

export class JSXIdentifier {
    type: string;
    name: string;
    constructor(name: string) {
        this.type = JSXSyntax.JSXIdentifier;
        this.name = name;
    }
}

export class JSXMemberExpression {
    type: string;
    object: JSXMemberExpression | JSXIdentifier;
    property: JSXIdentifier;
    constructor(object: JSXMemberExpression | JSXIdentifier, property: JSXIdentifier) {
        this.type = JSXSyntax.JSXMemberExpression;
        this.object = object;
        this.property = property;
    }
}

export class JSXAttribute {
    type: string;
    name: JSXAttributeName;
    value: JSXAttributeValue;
    constructor(name: JSXAttributeName, value: JSXAttributeValue) {
        this.type = JSXSyntax.JSXAttribute;
        this.name = name;
        this.value = value;
    }
}

export class JSXNamespacedName {
    type: string;
    namespace: JSXIdentifier;
    name: JSXIdentifier;
    constructor(namespace: JSXIdentifier, name: JSXIdentifier) {
        this.type = JSXSyntax.JSXNamespacedName;
        this.namespace = namespace;
        this.name = name;
    }
}

export class JSXOpeningElement {
    type: string;
    name: JSXElementName;
    selfClosing: boolean;
    attributes: JSXElementAttribute[];
    constructor(name: JSXElementName, selfClosing: boolean, attributes: JSXElementAttribute[]) {
        this.type = JSXSyntax.JSXOpeningElement;
        this.name = name;
        this.selfClosing = selfClosing;
        this.attributes = attributes;
    }
}

export class JSXSpreadAttribute {
    type: string;
    argument: Node.Expression;
    constructor(argument: Node.Expression) {
        this.type = JSXSyntax.JSXSpreadAttribute;
        this.argument = argument;
    }
}

export class JSXText {
    type: string;
    value: string;
    raw: string;
    constructor(value: string, raw: string) {
        this.type = JSXSyntax.JSXText;
        this.value = value;
        this.raw = raw;
    }
}
