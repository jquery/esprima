import { Syntax } from './syntax';

export class ArrayExpression {
    type: string;
    elements: any[];
    constructor(elements) {
        this.type = Syntax.ArrayExpression;
        this.elements = elements;
    }
}

export class ArrayPattern {
    type: string;
    elements: any[];
    constructor(elements) {
        this.type = Syntax.ArrayPattern;
        this.elements = elements;
    }
}

export class ArrowFunctionExpression {
    type: string;
    id: any;
    params: any;
    defaults: any;
    body: any;
    generator: boolean;
    expression: boolean;
    constructor(params, defaults, body, expression) {
        this.type = Syntax.ArrowFunctionExpression;
        this.id = null;
        this.params = params;
        this.defaults = defaults;
        this.body = body;
        this.generator = false;
        this.expression = expression;
    }
}

export class AssignmentExpression {
    type: string;
    operator: string;
    left: any;
    right: any;
    constructor(operator, left, right) {
        this.type = Syntax.AssignmentExpression;
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
}

export class AssignmentPattern {
    type: string;
    left: any;
    right: any;
    constructor(left, right) {
        this.type = Syntax.AssignmentPattern;
        this.left = left;
        this.right = right;
    }
}

export class BinaryExpression {
    type: string;
    operator: string;
    left: any;
    right: any;
    constructor(operator, left, right) {
        const logical = (operator === '||' || operator === '&&');
        this.type = logical ? Syntax.LogicalExpression : Syntax.BinaryExpression;
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
}

export class BlockStatement {
    type: string;
    body: any[];
    constructor(body) {
        this.type = Syntax.BlockStatement;
        this.body = body;
    }
}

export class BreakStatement {
    type: string;
    label: Identifier;
    constructor(label) {
        this.type = Syntax.BreakStatement;
        this.label = label;
    }
}

export class CallExpression {
    type: string;
    callee: any;
    arguments: any;
    constructor(callee, args) {
        this.type = Syntax.CallExpression;
        this.callee = callee;
        this.arguments = args;
    }
}

export class CatchClause {
    type: string;
    param: any;
    body: any;
    constructor(param, body) {
        this.type = Syntax.CatchClause;
        this.param = param;
        this.body = body;
    }
}

export class ClassBody {
    type: string;
    body: any[];
    constructor(body) {
        this.type = Syntax.ClassBody;
        this.body = body;
    }
}

export class ClassDeclaration {
    type: string;
    id: Identifier;
    superClass: any;
    body: ClassBody;
    constructor(id, superClass, body) {
        this.type = Syntax.ClassDeclaration;
        this.id = id;
        this.superClass = superClass;
        this.body = body;
    }
}

export class ClassExpression {
    type: string;
    id: Identifier;
    superClass: any;
    body: ClassBody;
    constructor(id, superClass, body) {
        this.type = Syntax.ClassExpression;
        this.id = id;
        this.superClass = superClass;
        this.body = body;
    }
}

export class ComputedMemberExpression {
    type: string;
    computed: boolean;
    object: any;
    property: any;
    constructor(object, property) {
        this.type = Syntax.MemberExpression;
        this.computed = true;
        this.object = object;
        this.property = property;
    }
}

export class ConditionalExpression {
    type: string;
    test: any;
    consequent: any;
    alternate: any;
    constructor(test, consequent, alternate) {
        this.type = Syntax.ConditionalExpression;
        this.test = test;
        this.consequent = consequent;
        this.alternate = alternate;
    }

}

export class ContinueStatement {
    type: string;
    label: Identifier;
    constructor(label) {
        this.type = Syntax.ContinueStatement;
        this.label = label;
    }
}

export class DebuggerStatement {
    type: string;
    constructor() {
        this.type = Syntax.DebuggerStatement;
    }
}

export class DoWhileStatement {
    type: string;
    body: any;
    test: any;
    constructor(body, test) {
        this.type = Syntax.DoWhileStatement;
        this.body = body;
        this.test = test;
    }
}

export class EmptyStatement {
    type: string;
    constructor() {
        this.type = Syntax.EmptyStatement;
    }
}

export class ExportAllDeclaration {
    type: string;
    source: any;
    constructor(source) {
        this.type = Syntax.ExportAllDeclaration;
        this.source = source;
    }
}

export class ExportDefaultDeclaration {
    type: string;
    declaration: any;
    constructor(declaration) {
        this.type = Syntax.ExportDefaultDeclaration;
        this.declaration = declaration;
    }
}

export class ExportNamedDeclaration {
    type: string;
    declaration: any;
    specifiers: ExportSpecifier[];
    source: any;
    constructor(declaration, specifiers, source) {
        this.type = Syntax.ExportNamedDeclaration;
        this.declaration = declaration;
        this.specifiers = specifiers;
        this.source = source;
    }
}

export class ExportSpecifier {
    type: string;
    exported: any;
    local: any;
    constructor(local, exported) {
        this.type = Syntax.ExportSpecifier;
        this.exported = exported || local;
        this.local = local;
    }
}

export class ExpressionStatement {
    type: string;
    expression: any;
    constructor(expression) {
        this.type = Syntax.ExpressionStatement;
        this.expression = expression;
    }
}

export class ForInStatement {
    type: string;
    left: any;
    right: any;
    body: any;
    each: boolean;
    constructor(left, right, body) {
        this.type = Syntax.ForInStatement;
        this.left = left;
        this.right = right;
        this.body = body;
        this.each = false;
    }
}

export class ForOfStatement {
    type: string;
    left: any;
    right: any;
    body: any;
    constructor(left, right, body) {
        this.type = Syntax.ForOfStatement;
        this.left = left;
        this.right = right;
        this.body = body;
    }
}

export class ForStatement {
    type: string;
    init: any;
    test: any;
    update: any;
    body: any;
    constructor(init, test, update, body) {
        this.type = Syntax.ForStatement;
        this.init = init;
        this.test = test;
        this.update = update;
        this.body = body;
    }
}

export class FunctionDeclaration {
    type: string;
    id: any;
    params: any[];
    defaults: any[];
    body: any;
    generator: boolean;
    expression: boolean;
    constructor(id, params, defaults, body, generator) {
        this.type = Syntax.FunctionDeclaration;
        this.id = id;
        this.params = params;
        this.defaults = defaults;
        this.body = body;
        this.generator = generator;
        this.expression = false;
    }
}

export class FunctionExpression {
    type: string;
    id: any;
    params: any[];
    defaults: any[];
    body: any;
    generator: boolean;
    expression: boolean;
    constructor(id, params, defaults, body, generator) {
        this.type = Syntax.FunctionExpression;
        this.id = id;
        this.params = params;
        this.defaults = defaults;
        this.body = body;
        this.generator = generator;
        this.expression = false;
    }
}

export class Identifier {
    type: string;
    name: string;
    constructor(name) {
        this.type = Syntax.Identifier;
        this.name = name;
    }
}

export class IfStatement {
    type: string;
    test: any;
    consequent: any;
    alternate: any;
    constructor(test, consequent, alternate) {
        this.type = Syntax.IfStatement;
        this.test = test;
        this.consequent = consequent;
        this.alternate = alternate;
    }
}

export class ImportDeclaration {
    type: string;
    specifiers: ImportSpecifier[];
    source: any;
    constructor(specifiers, source) {
        this.type = Syntax.ImportDeclaration;
        this.specifiers = specifiers;
        this.source = source;
    }
}

export class ImportDefaultSpecifier {
    type: string;
    local: any;
    constructor(local) {
        this.type = Syntax.ImportDefaultSpecifier;
        this.local = local;
    }
}

export class ImportNamespaceSpecifier {
    type: string;
    local: any;
    constructor(local) {
        this.type = Syntax.ImportNamespaceSpecifier;
        this.local = local;
    }
}

export class ImportSpecifier {
    type: string;
    local: any;
    imported: any;
    constructor(local, imported) {
        this.type = Syntax.ImportSpecifier;
        this.local = local || imported;
        this.imported = imported;
    }
}

export class LabeledStatement {
    type: string;
    label: Identifier;
    body: any;
    constructor(label, body) {
        this.type = Syntax.LabeledStatement;
        this.label = label;
        this.body = body;
    }
}

export class Literal {
    type: string;
    value: string;
    raw: string;
    constructor(value, raw) {
        this.type = Syntax.Literal;
        this.value = value;
        this.raw = raw;
    }
}

export class MetaProperty {
    type: string;
    meta: any;
    property: any;
    constructor(meta, property) {
        this.type = Syntax.MetaProperty;
        this.meta = meta;
        this.property = property;
    }
}

export class NewExpression {
    type: string;
    callee: any;
    arguments: any;
    constructor(callee, args) {
        this.type = Syntax.NewExpression;
        this.callee = callee;
        this.arguments = args;
    }
}

export class ObjectExpression {
    type: string;
    properties: Property[];
    constructor(properties) {
        this.type = Syntax.ObjectExpression;
        this.properties = properties;
    }
}

export class ObjectPattern {
    type: string;
    properties: Property[];
    constructor(properties) {
        this.type = Syntax.ObjectPattern;
        this.properties = properties;
    }
}

export class PostfixExpression {
    type: string;
    operator: string;
    argument: any;
    prefix: boolean;
    constructor(operator, argument) {
        this.type = Syntax.UpdateExpression;
        this.operator = operator;
        this.argument = argument;
        this.prefix = false;
    }
}

export class Program {
    type: string;
    body: any[];
    sourceType: string;
    constructor(body, sourceType) {
        this.type = Syntax.Program;
        this.body = body;
        this.sourceType = sourceType;
    }
}

export class Property {
    type: string;
    key: any;
    computed: boolean;
    value: any;
    kind: string;
    method: boolean;
    shorthand: boolean;
    constructor(kind, key, computed, value, method, shorthand) {
        this.type = Syntax.Property;
        this.key = key;
        this.computed = computed;
        this.value = value;
        this.kind = kind;
        this.method = method;
        this.shorthand = shorthand;
    }
}
export class RegexLiteral {
    type: string;
    value: string;
    raw: string;
    regex: any;
    constructor(value, raw, regex) {
        this.type = Syntax.Literal;
        this.value = value;
        this.raw = raw;
        this.regex = regex;
    }
}

export class RestElement {
    type: string;
    argument: any;
    constructor(argument) {
        this.type = Syntax.RestElement;
        this.argument = argument;
    }
}

export class ReturnStatement {
    type: string;
    argument: any;
    constructor(argument) {
        this.type = Syntax.ReturnStatement;
        this.argument = argument;
    }
}

export class SequenceExpression {
    type: string;
    expressions: any;
    constructor(expressions) {
        this.type = Syntax.SequenceExpression;
        this.expressions = expressions;
    }
}

export class SpreadElement {
    type: string;
    argument: any;
    constructor(argument) {
        this.type = Syntax.SpreadElement;
        this.argument = argument;
    }
}

export class StaticMemberExpression {
    type: string;
    computed: boolean;
    object: any;
    property: any;
    constructor(object, property) {
        this.type = Syntax.MemberExpression;
        this.computed = false;
        this.object = object;
        this.property = property;
    }
}

export class Super {
    type: string;
    constructor() {
        this.type = Syntax.Super;
    }
}

export class SwitchCase {
    type: string;
    test: any;
    consequent: any;
    constructor(test, consequent) {
        this.type = Syntax.SwitchCase;
        this.test = test;
        this.consequent = consequent;
    }
}

export class SwitchStatement {
    type: string;
    discriminant: any;
    cases: SwitchCase[];
    constructor(discriminant, cases) {
        this.type = Syntax.SwitchStatement;
        this.discriminant = discriminant;
        this.cases = cases;
    }
}

export class TaggedTemplateExpression {
    type: string;
    tag: any;
    quasi: TemplateLiteral;
    constructor(tag, quasi) {
        this.type = Syntax.TaggedTemplateExpression;
        this.tag = tag;
        this.quasi = quasi;
    }
}

export class TemplateElement {
    type: string;
    value: any;
    tail: any;
    constructor(value, tail) {
        this.type = Syntax.TemplateElement;
        this.value = value;
        this.tail = tail;
    }
}

export class TemplateLiteral {
    type: string;
    quasis: TemplateElement[];
    expressions: any[];
    constructor(quasis, expressions) {
        this.type = Syntax.TemplateLiteral;
        this.quasis = quasis;
        this.expressions = expressions;
    }
}

export class ThisExpression {
    type: string;
    constructor() {
        this.type = Syntax.ThisExpression;
    }
}

export class ThrowStatement {
    type: string;
    argument: any;
    constructor(argument) {
        this.type = Syntax.ThrowStatement;
        this.argument = argument;
    }
}

export class TryStatement {
    type: string;
    block: any;
    handler: any;
    finalizer: any;
    constructor(block, handler, finalizer) {
        this.type = Syntax.TryStatement;
        this.block = block;
        this.handler = handler;
        this.finalizer = finalizer;
    }
}

export class UnaryExpression {
    type: string;
    operator: string;
    argument: any;
    prefix: boolean;
    constructor(operator, argument) {
        const update = (operator === '++' || operator === '--');
        this.type = update ? Syntax.UpdateExpression : Syntax.UnaryExpression;
        this.operator = operator;
        this.argument = argument;
        this.prefix = true;
    }
}

export class VariableDeclaration {
    type: string;
    declarations: VariableDeclarator[];
    kind: string;
    constructor(declarations, kind) {
        this.type = Syntax.VariableDeclaration;
        this.declarations = declarations;
        this.kind = kind;
    }
}

export class VariableDeclarator {
    type: string;
    id: any;
    init: any;
    constructor(id, init) {
        this.type = Syntax.VariableDeclarator;
        this.id = id;
        this.init = init;
    }
}

export class WhileStatement {
    type: string;
    test: string;
    body: string;
    constructor(test, body) {
        this.type = Syntax.WhileStatement;
        this.test = test;
        this.body = body;
    }
}

export class WithStatement {
    type: string;
    object: string;
    body: string;
    constructor(object, body) {
        this.type = Syntax.WithStatement;
        this.object = object;
        this.body = body;
    }
}

export class YieldExpression {
    type: string;
    argument: any;
    delegate: any;
    constructor(argument, delegate) {
        this.type = Syntax.YieldExpression;
        this.argument = argument;
        this.delegate = delegate;
    }
}
