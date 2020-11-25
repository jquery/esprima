import { JSXSyntax } from './jsx-syntax';
import * as Node from './nodes';

export type JSXAttributeName = JSXIdentifier | JSXNamespacedName;
export type JSXAttributeValue = Node.Literal | JSXElement | JSXSpreadAttribute | JSXExpressionContainer;
export type JSXChild = JSXElement | JSXExpressionContainer | JSXText;
export type JSXElementAttribute = JSXAttribute | JSXSpreadAttribute;
export type JSXElementName = JSXIdentifier | JSXNamespacedName | JSXMemberExpression;

export class JSXClosingElement {
    readonly type: string;
    readonly name: JSXElementName;
    constructor(name: JSXElementName) {
        this.type = JSXSyntax.JSXClosingElement;
        this.name = name;
    }
}

export class JSXClosingFragment {
    readonly type: string;
    constructor() {
        this.type = JSXSyntax.JSXClosingFragment;
    }
}

export class JSXElement {
    readonly type: string;
    readonly openingElement: JSXOpeningElement | JSXOpeningFragment;
    readonly children: JSXChild[];
    readonly closingElement: JSXClosingElement | JSXClosingFragment | null;
    constructor(
        openingElement: JSXOpeningElement | JSXOpeningFragment,
        children: JSXChild[],
        closingElement: JSXClosingElement | JSXClosingFragment | null
    ) {
        this.type = JSXSyntax.JSXElement;
        this.openingElement = openingElement;
        this.children = children;
        this.closingElement = closingElement;
    }
}

export class JSXEmptyExpression {
    readonly type: string;
    constructor() {
        this.type = JSXSyntax.JSXEmptyExpression;
    }
}

export class JSXExpressionContainer {
    readonly type: string;
    readonly expression: Node.Expression | JSXEmptyExpression;
    constructor(expression: Node.Expression | JSXEmptyExpression) {
        this.type = JSXSyntax.JSXExpressionContainer;
        this.expression = expression;
    }
}

export class JSXIdentifier {
    readonly type: string;
    readonly name: string;
    constructor(name: string) {
        this.type = JSXSyntax.JSXIdentifier;
        this.name = name;
    }
}

export class JSXMemberExpression {
    readonly type: string;
    readonly object: JSXMemberExpression | JSXIdentifier;
    readonly property: JSXIdentifier;
    constructor(object: JSXMemberExpression | JSXIdentifier, property: JSXIdentifier) {
        this.type = JSXSyntax.JSXMemberExpression;
        this.object = object;
        this.property = property;
    }
}

export class JSXAttribute {
    readonly type: string;
    readonly name: JSXAttributeName;
    readonly value: JSXAttributeValue | null;
    constructor(name: JSXAttributeName, value: JSXAttributeValue | null) {
        this.type = JSXSyntax.JSXAttribute;
        this.name = name;
        this.value = value;
    }
}

export class JSXNamespacedName {
    readonly type: string;
    readonly namespace: JSXIdentifier;
    readonly name: JSXIdentifier;
    constructor(namespace: JSXIdentifier, name: JSXIdentifier) {
        this.type = JSXSyntax.JSXNamespacedName;
        this.namespace = namespace;
        this.name = name;
    }
}

export class JSXOpeningElement {
    readonly type: string;
    readonly name: JSXElementName;
    readonly selfClosing: boolean;
    readonly attributes: JSXElementAttribute[];
    constructor(name: JSXElementName, selfClosing: boolean, attributes: JSXElementAttribute[]) {
        this.type = JSXSyntax.JSXOpeningElement;
        this.name = name;
        this.selfClosing = selfClosing;
        this.attributes = attributes;
    }
}

export class JSXOpeningFragment {
    readonly type: string;
    readonly selfClosing: boolean;
    constructor(selfClosing: boolean) {
        this.type = JSXSyntax.JSXOpeningFragment;
        this.selfClosing = selfClosing;
    }
}

export class JSXSpreadAttribute {
    readonly type: string;
    readonly argument: Node.Expression;
    constructor(argument: Node.Expression) {
        this.type = JSXSyntax.JSXSpreadAttribute;
        this.argument = argument;
    }
}

export class JSXText {
    readonly type: string;
    readonly value: string;
    readonly raw: string;
    constructor(value: string, raw: string) {
        this.type = JSXSyntax.JSXText;
        this.value = value;
        this.raw = raw;
    }
}
