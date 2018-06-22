import { Syntax } from './syntax';

export type ArgumentListElement = Expression | SpreadElement;
export type ArrayExpressionElement = Expression | SpreadElement;
export type ArrayPatternElement = AssignmentPattern | BindingIdentifier | BindingPattern | RestElement;
export type BindingPattern = ArrayPattern | ObjectPattern;
export type BindingIdentifier = Identifier;
export type Declaration = ClassDeclaration | ExportDeclaration | FunctionDeclaration | ImportDeclaration | VariableDeclaration;
export type ExportDeclaration = ExportAllDeclaration | ExportDefaultDeclaration | ExportNamedDeclaration;
export type Expression = ArrayExpression | ArrowFunctionExpression | AssignmentExpression |
    BinaryExpression | CallExpression | ClassExpression | ComputedMemberExpression |
    ConditionalExpression | Identifier | FunctionExpression | Literal | NewExpression | ObjectExpression |
    RegexLiteral | SequenceExpression | StaticMemberExpression | TaggedTemplateExpression |
    ThisExpression | UnaryExpression | UpdateExpression | YieldExpression;
export type FunctionParameter = AssignmentPattern | BindingIdentifier | BindingPattern;
export type ImportDeclarationSpecifier = ImportDefaultSpecifier | ImportNamespaceSpecifier | ImportSpecifier;
export type Statement = BreakStatement | ContinueStatement | DebuggerStatement | DoWhileStatement |
    EmptyStatement | ExpressionStatement | Directive | ForStatement | ForInStatement | ForOfStatement |
    FunctionDeclaration | IfStatement | ReturnStatement | SwitchStatement | ThrowStatement |
    TryStatement | VariableDeclaration | WhileStatement | WithStatement;
export type PropertyKey = Identifier | Literal;
export type PropertyValue = AssignmentPattern | BindingIdentifier | BindingPattern | FunctionExpression;
export type StatementListItem = Declaration | Statement;

export class ArrayExpression {
    type: string;
    elements: ArrayExpressionElement[];
    constructor(elements: ArrayExpressionElement[]) {
        this.type = Syntax.ArrayExpression;
        this.elements = elements;
    }
}

export class ArrayPattern {
    type: string;
    elements: ArrayPatternElement[];
    constructor(elements: ArrayPatternElement[]) {
        this.type = Syntax.ArrayPattern;
        this.elements = elements;
    }
}

export class ArrowFunctionExpression {
    type: string;
    id: Identifier;
    params: FunctionParameter[];
    body: BlockStatement | Expression;
    generator: boolean;
    expression: boolean;
    constructor(params: FunctionParameter[], body: BlockStatement | Expression, expression: boolean) {
        this.type = Syntax.ArrowFunctionExpression;
        this.id = null;
        this.params = params;
        this.body = body;
        this.generator = false;
        this.expression = expression;
    }
}

export class AssignmentExpression {
    type: string;
    operator: string;
    left: Expression;
    right: Expression;
    constructor(operator: string, left: Expression, right: Expression) {
        this.type = Syntax.AssignmentExpression;
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
}

export class AssignmentPattern {
    type: string;
    left: BindingIdentifier | BindingPattern;
    right: Expression;
    constructor(left: BindingIdentifier | BindingPattern, right: Expression) {
        this.type = Syntax.AssignmentPattern;
        this.left = left;
        this.right = right;
    }
}

export class BinaryExpression {
    type: string;
    operator: string;
    left: Expression;
    right: Expression;
    constructor(operator: string, left: Expression, right: Expression) {
        const logical = (operator === '||' || operator === '&&');
        this.type = logical ? Syntax.LogicalExpression : Syntax.BinaryExpression;
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
}

export class BlockStatement {
    type: string;
    body: Statement[];
    constructor(body) {
        this.type = Syntax.BlockStatement;
        this.body = body;
    }
}

export class BreakStatement {
    type: string;
    label: Identifier;
    constructor(label: Identifier) {
        this.type = Syntax.BreakStatement;
        this.label = label;
    }
}

export class CallExpression {
    type: string;
    callee: Expression;
    arguments: ArgumentListElement[];
    constructor(callee, args) {
        this.type = Syntax.CallExpression;
        this.callee = callee;
        this.arguments = args;
    }
}

export class CatchClause {
    type: string;
    param: BindingIdentifier | BindingPattern;
    body: BlockStatement;
    constructor(param: BindingIdentifier | BindingPattern, body: BlockStatement) {
        this.type = Syntax.CatchClause;
        this.param = param;
        this.body = body;
    }
}

export class ClassBody {
    type: string;
    body: Property[];
    constructor(body: Property[]) {
        this.type = Syntax.ClassBody;
        this.body = body;
    }
}

export class ClassDeclaration {
    type: string;
    id: Identifier;
    superClass: Identifier;
    body: ClassBody;
    constructor(id: Identifier, superClass: Identifier, body: ClassBody) {
        this.type = Syntax.ClassDeclaration;
        this.id = id;
        this.superClass = superClass;
        this.body = body;
    }
}

export class ClassExpression {
    type: string;
    id: Identifier;
    superClass: Identifier;
    body: ClassBody;
    constructor(id: Identifier, superClass: Identifier, body: ClassBody) {
        this.type = Syntax.ClassExpression;
        this.id = id;
        this.superClass = superClass;
        this.body = body;
    }
}

export class ComputedMemberExpression {
    type: string;
    computed: boolean;
    object: Expression;
    property: Expression;
    constructor(object: Expression, property: Expression) {
        this.type = Syntax.MemberExpression;
        this.computed = true;
        this.object = object;
        this.property = property;
    }
}

export class ConditionalExpression {
    type: string;
    test: Expression;
    consequent: Expression;
    alternate: Expression;
    constructor(test: Expression, consequent: Expression, alternate: Expression) {
        this.type = Syntax.ConditionalExpression;
        this.test = test;
        this.consequent = consequent;
        this.alternate = alternate;
    }
}

export class ContinueStatement {
    type: string;
    label: Identifier;
    constructor(label: Identifier) {
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

export class Directive {
    type: string;
    expression: Expression;
    directive: string;
    constructor(expression: Expression, directive: string) {
        this.type = Syntax.ExpressionStatement;
        this.expression = expression;
        this.directive = directive;
    }
}

export class DoWhileStatement {
    type: string;
    body: Statement;
    test: Expression;
    constructor(body: Statement, test: Expression) {
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
    source: Literal;
    constructor(source: Literal) {
        this.type = Syntax.ExportAllDeclaration;
        this.source = source;
    }
}

export class ExportDefaultDeclaration {
    type: string;
    declaration: BindingIdentifier | BindingPattern | ClassDeclaration | Expression | FunctionDeclaration;
    constructor(declaration: BindingIdentifier | BindingPattern | ClassDeclaration | Expression | FunctionDeclaration) {
        this.type = Syntax.ExportDefaultDeclaration;
        this.declaration = declaration;
    }
}

export class ExportNamedDeclaration {
    type: string;
    declaration: ClassDeclaration | Function | VariableDeclaration;
    specifiers: ExportSpecifier[];
    source: Literal;
    constructor(declaration: ClassDeclaration | Function | VariableDeclaration, specifiers: ExportSpecifier[], source: Literal) {
        this.type = Syntax.ExportNamedDeclaration;
        this.declaration = declaration;
        this.specifiers = specifiers;
        this.source = source;
    }
}

export class ExportSpecifier {
    type: string;
    exported: Identifier;
    local: Identifier;
    constructor(local: Identifier, exported: Identifier) {
        this.type = Syntax.ExportSpecifier;
        this.exported = exported;
        this.local = local;
    }
}

export class ExpressionStatement {
    type: string;
    expression: Expression;
    constructor(expression: Expression) {
        this.type = Syntax.ExpressionStatement;
        this.expression = expression;
    }
}

export class ForInStatement {
    type: string;
    left: Expression;
    right: Expression;
    body: Statement;
    each: boolean;
    constructor(left: Expression, right: Expression, body: Statement) {
        this.type = Syntax.ForInStatement;
        this.left = left;
        this.right = right;
        this.body = body;
        this.each = false;
    }
}

export class ForOfStatement {
    type: string;
    left: Expression;
    right: Expression;
    body: Statement;
    constructor(left: Expression, right: Expression, body: Statement) {
        this.type = Syntax.ForOfStatement;
        this.left = left;
        this.right = right;
        this.body = body;
    }
}

export class ForStatement {
    type: string;
    init: Expression;
    test: Expression;
    update: Expression;
    body: Statement;
    constructor(init: Expression, test: Expression, update: Expression, body: Statement) {
        this.type = Syntax.ForStatement;
        this.init = init;
        this.test = test;
        this.update = update;
        this.body = body;
    }
}

export class FunctionDeclaration {
    type: string;
    id: Identifier;
    params: FunctionParameter[];
    body: BlockStatement;
    generator: boolean;
    expression: boolean;
    constructor(id: Identifier, params: FunctionParameter[], body: BlockStatement, generator: boolean) {
        this.type = Syntax.FunctionDeclaration;
        this.id = id;
        this.params = params;
        this.body = body;
        this.generator = generator;
        this.expression = false;
    }
}

export class FunctionExpression {
    type: string;
    id: Identifier;
    params: FunctionParameter[];
    body: BlockStatement;
    generator: boolean;
    expression: boolean;
    constructor(id: Identifier, params: FunctionParameter[], body: BlockStatement, generator: boolean) {
        this.type = Syntax.FunctionExpression;
        this.id = id;
        this.params = params;
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
    test: Expression;
    consequent: Statement;
    alternate: Statement;
    constructor(test: Expression, consequent: Statement, alternate: Statement) {
        this.type = Syntax.IfStatement;
        this.test = test;
        this.consequent = consequent;
        this.alternate = alternate;
    }
}

export class ImportDeclaration {
    type: string;
    specifiers: ImportDeclarationSpecifier[];
    source: Literal;
    constructor(specifiers, source) {
        this.type = Syntax.ImportDeclaration;
        this.specifiers = specifiers;
        this.source = source;
    }
}

export class ImportDefaultSpecifier {
    type: string;
    local: Identifier;
    constructor(local: Identifier) {
        this.type = Syntax.ImportDefaultSpecifier;
        this.local = local;
    }
}

export class ImportNamespaceSpecifier {
    type: string;
    local: Identifier;
    constructor(local: Identifier) {
        this.type = Syntax.ImportNamespaceSpecifier;
        this.local = local;
    }
}

export class ImportSpecifier {
    type: string;
    local: Identifier;
    imported: Identifier;
    constructor(local: Identifier, imported: Identifier) {
        this.type = Syntax.ImportSpecifier;
        this.local = local;
        this.imported = imported;
    }
}

export class LabeledStatement {
    type: string;
    label: Identifier;
    body: Statement;
    constructor(label: Identifier, body: Statement) {
        this.type = Syntax.LabeledStatement;
        this.label = label;
        this.body = body;
    }
}

export class Literal {
    type: string;
    value: boolean | number | string;
    raw: string;
    constructor(value: boolean | number | string, raw: string) {
        this.type = Syntax.Literal;
        this.value = value;
        this.raw = raw;
    }
}

export class MetaProperty {
    type: string;
    meta: Identifier;
    property: Identifier;
    constructor(meta: Identifier, property: Identifier) {
        this.type = Syntax.MetaProperty;
        this.meta = meta;
        this.property = property;
    }
}

export class MethodDefinition {
    type: string;
    key: Expression;
    computed: boolean;
    value: FunctionExpression;
    kind: string;
    static: boolean;
    constructor(key: Expression, computed: boolean, value: FunctionExpression, kind: string, isStatic: boolean) {
        this.type = Syntax.MethodDefinition;
        this.key = key;
        this.computed = computed;
        this.value = value;
        this.kind = kind;
        this.static = isStatic;
    }
}

export class NewExpression {
    type: string;
    callee: Expression;
    arguments: ArgumentListElement[];
    constructor(callee: Expression, args: ArgumentListElement[]) {
        this.type = Syntax.NewExpression;
        this.callee = callee;
        this.arguments = args;
    }
}

export class ObjectExpression {
    type: string;
    properties: Property[];
    constructor(properties: Property[]) {
        this.type = Syntax.ObjectExpression;
        this.properties = properties;
    }
}

export class ObjectPattern {
    type: string;
    properties: Property[];
    constructor(properties: Property[]) {
        this.type = Syntax.ObjectPattern;
        this.properties = properties;
    }
}

export class Program {
    type: string;
    body: StatementListItem[];
    sourceType: string;
    constructor(body: StatementListItem[], sourceType: string) {
        this.type = Syntax.Program;
        this.body = body;
        this.sourceType = sourceType;
    }
}

export class Property {
    type: string;
    key: PropertyKey;
    computed: boolean;
    value: PropertyValue;
    kind: string;
    method: boolean;
    shorthand: boolean;
    constructor(kind: string, key: PropertyKey, computed: boolean, value: PropertyValue, method: boolean, shorthand: boolean) {
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
    constructor(value: string, raw: string, regex) {
        this.type = Syntax.Literal;
        this.value = value;
        this.raw = raw;
        this.regex = regex;
    }
}

export class RestElement {
    type: string;
    argument: BindingIdentifier | BindingPattern;
    constructor(argument: BindingIdentifier | BindingPattern) {
        this.type = Syntax.RestElement;
        this.argument = argument;
    }
}

export class ReturnStatement {
    type: string;
    argument: Expression;
    constructor(argument: Expression) {
        this.type = Syntax.ReturnStatement;
        this.argument = argument;
    }
}

export class SequenceExpression {
    type: string;
    expressions: Expression[];
    constructor(expressions: Expression[]) {
        this.type = Syntax.SequenceExpression;
        this.expressions = expressions;
    }
}

export class SpreadElement {
    type: string;
    argument: Expression;
    constructor(argument: Expression) {
        this.type = Syntax.SpreadElement;
        this.argument = argument;
    }
}

export class StaticMemberExpression {
    type: string;
    computed: boolean;
    object: Expression;
    property: Expression;
    constructor(object: Expression, property: Expression) {
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
    test: Expression;
    consequent: Statement[];
    constructor(test: Expression, consequent: Statement[]) {
        this.type = Syntax.SwitchCase;
        this.test = test;
        this.consequent = consequent;
    }
}

export class SwitchStatement {
    type: string;
    discriminant: Expression;
    cases: SwitchCase[];
    constructor(discriminant: Expression, cases: SwitchCase[]) {
        this.type = Syntax.SwitchStatement;
        this.discriminant = discriminant;
        this.cases = cases;
    }
}

export class TaggedTemplateExpression {
    type: string;
    tag: Expression;
    quasi: TemplateLiteral;
    constructor(tag: Expression, quasi: TemplateLiteral) {
        this.type = Syntax.TaggedTemplateExpression;
        this.tag = tag;
        this.quasi = quasi;
    }
}

export interface TemplateElementValue {
    cooked: string;
    raw: string;
}

export class TemplateElement {
    type: string;
    value: TemplateElementValue;
    tail: boolean;
    constructor(value: TemplateElementValue, tail: boolean) {
        this.type = Syntax.TemplateElement;
        this.value = value;
        this.tail = tail;
    }
}

export class TemplateLiteral {
    type: string;
    quasis: TemplateElement[];
    expressions: Expression[];
    constructor(quasis: TemplateElement[], expressions: Expression[]) {
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
    argument: Expression;
    constructor(argument: Expression) {
        this.type = Syntax.ThrowStatement;
        this.argument = argument;
    }
}

export class TryStatement {
    type: string;
    block: BlockStatement;
    handler: CatchClause;
    finalizer: BlockStatement;
    constructor(block: BlockStatement, handler: CatchClause, finalizer: BlockStatement) {
        this.type = Syntax.TryStatement;
        this.block = block;
        this.handler = handler;
        this.finalizer = finalizer;
    }
}

export class UnaryExpression {
    type: string;
    operator: string;
    argument: Expression;
    prefix: boolean;
    constructor(operator, argument) {
        this.type = Syntax.UnaryExpression;
        this.operator = operator;
        this.argument = argument;
        this.prefix = true;
    }
}

export class UpdateExpression {
    type: string;
    operator: string;
    argument: Expression;
    prefix: boolean;
    constructor(operator, argument, prefix) {
        this.type = Syntax.UpdateExpression;
        this.operator = operator;
        this.argument = argument;
        this.prefix = prefix;
    }
}

export class VariableDeclaration {
    type: string;
    declarations: VariableDeclarator[];
    kind: string;
    constructor(declarations: VariableDeclarator[], kind: string) {
        this.type = Syntax.VariableDeclaration;
        this.declarations = declarations;
        this.kind = kind;
    }
}

export class VariableDeclarator {
    type: string;
    id: BindingIdentifier | BindingPattern;
    init: Expression;
    constructor(id: BindingIdentifier | BindingPattern, init: Expression) {
        this.type = Syntax.VariableDeclarator;
        this.id = id;
        this.init = init;
    }
}

export class WhileStatement {
    type: string;
    test: Expression;
    body: Statement;
    constructor(test: Expression, body: Statement) {
        this.type = Syntax.WhileStatement;
        this.test = test;
        this.body = body;
    }
}

export class WithStatement {
    type: string;
    object: Expression;
    body: Statement;
    constructor(object: Expression, body: Statement) {
        this.type = Syntax.WithStatement;
        this.object = object;
        this.body = body;
    }
}

export class YieldExpression {
    type: string;
    argument: Expression;
    delegate: boolean;
    constructor(argument: Expression, delegate: boolean) {
        this.type = Syntax.YieldExpression;
        this.argument = argument;
        this.delegate = delegate;
    }
}
