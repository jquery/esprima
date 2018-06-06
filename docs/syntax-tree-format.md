# Appendix A. Syntax Tree Format

Esprima syntax tree format is derived from the original version of [Mozilla Parser API](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API), which is then formalized and expanded as the [ESTree specification](https://github.com/estree/estree).

**Note**: In the following sections, interfaces are described using the syntax of [TypeScript interface](https://www.typescriptlang.org/docs/handbook/interfaces.html).

Each node is represented as a regular JavaScript object that implements the interface:

```js
interface Node {
  type: string;
}
```

The `type` property is a string that contains the variant type of the node. Each subtype of _Node_ is explained in the subsequent sections.

When the node is annotated with [its location](syntactic-analysis.html#node-location), the interface becomes:

```js
interface Node {
  type: string;
  range?: [number, number];
  loc?: SourceLocation;
}
```

with the source location defined as:

```js
interface Position {
    line: number;
    column: number;
}

interface SourceLocation {
    start: Position;
    end: Position;
    source?: string | null;
}
```

## Expressions and Patterns

A binding pattern can be one of the following:

```js
type BindingPattern = ArrayPattern | ObjectPattern;
```

An expression can be one of the following:

```js
type Expression = ThisExpression | Identifier | Literal |
    ArrayExpression | ObjectExpression | FunctionExpression | ArrowFunctionExpression | ClassExpression |
    TaggedTemplateExpression | MemberExpression | Super | MetaProperty |
    NewExpression | CallExpression | UpdateExpression | AwaitExpression | UnaryExpression |
    BinaryExpression | LogicalExpression | ConditionalExpression |
    YieldExpression | AssignmentExpression | SequenceExpression;
```

### Array Pattern

```js
interface ArrayPattern {
    type: 'ArrayPattern';
    elements: ArrayPatternElement[];
}
```

with

```js
type ArrayPatternElement = AssignmentPattern | Identifier | BindingPattern | RestElement | null;

interface RestElement {
    type: 'RestElement';
    argument: Identifier | BindingPattern;
}
```

### Assignment Pattern

```js
interface AssignmentPattern {
    type: 'AssignmentPattern';
    left: Identifier | BindingPattern;
    right: Expression;
}
```

### Object Pattern

```js
interface ObjectPattern {
    type: 'ObjectPattern';
    properties: Property[];
}
```

### This Expression

```js
interface ThisExpression {
    type: 'ThisExpression';
}
```

### Identifier

```js
interface Identifier {
    type: 'Identifier';
    name: string;
}
```

### Literal

```js
interface Literal {
    type: 'Literal';
    value: boolean | number | string | RegExp | null;
    raw: string;
    regex?: { pattern: string, flags: string };
}
```

The `regex` property only applies to regular expression literals.

### Array Expression

```js
interface ArrayExpression {
    type: 'ArrayExpression';
    elements: ArrayExpressionElement[];
}
```

where

```js
type ArrayExpressionElement = Expression | SpreadElement;
```

### Object Expression

```js
interface ObjectExpression {
    type: 'ObjectExpression';
    properties: Property[];
}
```

where

```js
interface Property {
    type: 'Property';
    key: Expression;
    computed: boolean;
    value: Expression | null;
    kind: 'get' | 'set' | 'init';
    method: false;
    shorthand: boolean;
}
```

### Function Expression

```js
interface FunctionExpression {
    type: 'FunctionExpression';
    id: Identifier | null;
    params: FunctionParameter[];
    body: BlockStatement;
    generator: boolean;
    async: boolean;
    expression: boolean;
}
```

with

```js
type FunctionParameter = AssignmentPattern | Identifier | BindingPattern;
```

The value of `generator` is true for a generator expression.

### Arrow Function Expression

```js
interface ArrowFunctionExpression {
    type: 'ArrowFunctionExpression';
    id: Identifier | null;
    params: FunctionParameter[];
    body: BlockStatement | Expression;
    generator: boolean;
    async: boolean;
    expression: false;
}
```

### Class Expression

```js
interface ClassExpression {
    type: 'ClassExpression';
    id: Identifier | null;
    superClass: Identifier | null;
    body: ClassBody;
}
```

with

```js
interface ClassBody {
    type: 'ClassBody';
    body: MethodDefinition[];
}

interface MethodDefinition {
    type: 'MethodDefinition';
    key: Expression | null;
    computed: boolean;
    value: FunctionExpression | null;
    kind: 'method' | 'constructor';
    static: boolean;
}
```

### Tagged Template Expression

```js
interface TaggedTemplateExpression {
    type: 'TaggedTemplateExpression';
    readonly tag: Expression;
    readonly quasi: TemplateLiteral;
}
```

with

```js
interface TemplateElement {
    type: 'TemplateElement';
    value: { cooked: string; raw: string };
    tail: boolean;
}

interface TemplateLiteral {
    type: 'TemplateLiteral';
    quasis: TemplateElement[];
    expressions: Expression[];
}
```

### Member Expression

```js
interface MemberExpression {
    type: 'MemberExpression';
    computed: boolean;
    object: Expression;
    property: Expression;
}
```

### Super

```js
interface Super {
    type: 'Super';
}
```

### MetaProperty

```js
interface MetaProperty {
    type: 'MetaProperty';
    meta: Identifier;
    property: Identifier;
}
```

### Call and New Expressions

```js
interface CallExpression {
    type: 'CallExpression';
    callee: Expression | Import;
    arguments: ArgumentListElement[];
}

interface NewExpression {
    type: 'NewExpression';
    callee: Expression;
    arguments: ArgumentListElement[];
}
```

with

```js
interface Import {
    type: 'Import';
}

type ArgumentListElement = Expression | SpreadElement;

interface SpreadElement {
    type: 'SpreadElement';
    argument: Expression;
}
```

### Update Expression

```js
interface UpdateExpression {
    type: 'UpdateExpression';
    operator: '++' | '--';
    argument: Expression;
    prefix: boolean;
}
```

### Await Expression

```js
interface AwaitExpression {
    type: 'AwaitExpression';
    argument: Expression;
}
```

### Unary Expression

```js
interface UnaryExpression {
    type: 'UnaryExpression';
    operator: '+' | '-' | '~' | '!' | 'delete' | 'void' | 'typeof';
    argument: Expression;
    prefix: true;
}
```

### Binary Expression

```js
interface BinaryExpression {
    type: 'BinaryExpression';
    operator: 'instanceof' | 'in' | '+' | '-' | '*' | '/' | '%' | '**' |
        '|' | '^' | '&' | '==' | '!=' | '===' | '!==' |
        '<' | '>' | '<=' | '<<' | '>>' | '>>>';
    left: Expression;
    right: Expression;
}
```

### Logical Expression

```js
interface LogicalExpression {
    type: 'LogicalExpression';
    operator: '||' | '&&';
    left: Expression;
    right: Expression;
}
```

### Conditional Expression

```js
interface ConditionalExpression {
    type: 'ConditionalExpression';
    test: Expression;
    consequent: Expression;
    alternate: Expression;
}
```

### Yield Expression

```js
interface YieldExpression {
    type: 'YieldExpression';
    argument: Expression | null;
    delegate: boolean;
}
```

### Assignment Expression

```js
interface AssignmentExpression {
    type: 'AssignmentExpression';
    operator: '=' | '*=' | '**=' | '/=' | '%=' | '+=' | '-=' |
        '<<=' | '>>=' | '>>>=' | '&=' | '^=' | '|=';
    left: Expression;
    right: Expression;
}
```

### Sequence Expression

```js
interface SequenceExpression {
    type: 'SequenceExpression';
    expressions: Expression[];
}
```

## Statements and Declarations

A statement can be one of the following:

```js
type Statement = BlockStatement | BreakStatement | ContinueStatement |
    DebuggerStatement | DoWhileStatement | EmptyStatement |
    ExpressionStatement | ForStatement | ForInStatement |
    ForOfStatement | FunctionDeclaration | IfStatement |
    LabeledStatement | ReturnStatement | SwitchStatement |
    ThrowStatement | TryStatement | VariableDeclaration |
    WhileStatement | WithStatement;
```

A declaration can be one of the following:

```js
type Declaration = ClassDeclaration | FunctionDeclaration |  VariableDeclaration;
```

A statement list item is either a statement or a declaration:

```js
type StatementListItem = Declaration | Statement;
```

### Block Statement

A series of statements enclosed by a pair of curly braces form a block statement:

```js
interface BlockStatement {
    type: 'BlockStatement';
    body: StatementListItem[];
}
```

### Break Statement

```js
interface BreakStatement {
    type: 'BreakStatement';
    label: Identifier | null;
}
```

### Class Declaration

```js
interface ClassDeclaration {
    type: 'ClassDeclaration';
    id: Identifier | null;
    superClass: Identifier | null;
    body: ClassBody;
}
```

### Continue Statement

```js
interface ContinueStatement {
    type: 'ContinueStatement';
    label: Identifier | null;
}
```

### Debugger Statement

```js
interface DebuggerStatement {
    type: 'DebuggerStatement';
}
```

### Do-While Statement

```js
interface DoWhileStatement {
    type: 'DoWhileStatement';
    body: Statement;
    test: Expression;
}
```

### Empty Statement

```js
interface EmptyStatement {
    type: 'EmptyStatement';
}
```

### Expression Statement

```js
interface ExpressionStatement {
    type: 'ExpressionStatement';
    expression: Expression;
    directive?: string;
}
```

When the expression statement represents a directive (such as `"use strict"`), then the `directive` property will contain the directive string.

### For Statement

```js
interface ForStatement {
    type: 'ForStatement';
    init: Expression | VariableDeclaration | null;
    test: Expression | null;
    update: Expression | null;
    body: Statement;
}
```

### For-In Statement

```js
interface ForInStatement {
    type: 'ForInStatement';
    left: Expression;
    right: Expression;
    body: Statement;
    each: false;
}
```

### For-Of Statement

```js
interface ForOfStatement {
    type: 'ForOfStatement';
    left: Expression;
    right: Expression;
    body: Statement;
}
```

### Function Declaration

```js
interface FunctionDeclaration {
    type: 'FunctionDeclaration';
    id: Identifier | null;
    params: FunctionParameter[];
    body: BlockStatement;
    generator: boolean;
    async: boolean;
    expression: false;
}
```

with

```js
type FunctionParameter = AssignmentPattern | Identifier | BindingPattern;
```

### If Statement

```js
interface IfStatement {
    type: 'IfStatement';
    test: Expression;
    consequent: Statement;
    alternate?: Statement;
}
```

### Labelled Statement

A statement prefixed by a label becomes a labelled statement:

```js
interface LabeledStatement {
    type: 'LabeledStatement';
    label: Identifier;
    body: Statement;
}
```

### Return Statement

```js
interface ReturnStatement {
    type: 'ReturnStatement';
    argument: Expression | null;
}
```

### Switch Statement

```js
interface SwitchStatement {
    type: 'SwitchStatement';
    discriminant: Expression;
    cases: SwitchCase[];
}
```

with

```js
interface SwitchCase {
    type: 'SwitchCase';
    test: Expression | null;
    consequent: Statement[];
}
```

### Throw Statement

```js
interface ThrowStatement {
    type: 'ThrowStatement';
    argument: Expression;
}
```

### Try Statement

```js
interface TryStatement {
    type: 'TryStatement';
    block: BlockStatement;
    handler: CatchClause | null;
    finalizer: BlockStatement | null;
}
```

with

```js
interface CatchClause {
    type: 'CatchClause';
    param: Identifier | BindingPattern;
    body: BlockStatement;
}
```

### Variable Declaration

```js
interface VariableDeclaration {
    type: 'VariableDeclaration';
    declarations: VariableDeclarator[];
    kind: 'var' | 'const' | 'let';
}
```

with

```js
interface VariableDeclarator {
    type: 'VariableDeclarator';
    id: Identifier | BindingPattern;
    init: Expression | null;
}
```

### While Statement

```js
interface WhileStatement {
    type: 'WhileStatement';
    test: Expression;
    body: Statement;
}
```

### With Statement

```js
interface WithStatement {
    type: 'WithStatement';
    object: Expression;
    body: Statement;
}
```

## Scripts and Modules

A program can be either a script or a module.

```js
interface Program {
  type: 'Program';
  sourceType: 'script';
  body: StatementListItem[];
}

interface Program {
  type: 'Program';
  sourceType: 'module';
  body: ModuleItem[];
}
```

with

```js
type StatementListItem = Declaration | Statement;
type ModuleItem = ImportDeclaration | ExportDeclaration | StatementListItem;
```

### Import Declaration

```js
type ImportDeclaration {
    type: 'ImportDeclaration';
    specifiers: ImportSpecifier[];
    source: Literal;
}
```

with

```js
interface ImportSpecifier {
    type: 'ImportSpecifier' | 'ImportDefaultSpecifier' | 'ImportNamespaceSpecifier';
    local: Identifier;
    imported?: Identifier;
}
```

### Export Declaration

An export declaration can be in the form of a batch, a default, or a named declaration.

```js
type ExportDeclaration = ExportAllDeclaration | ExportDefaultDeclaration | ExportNamedDeclaration;
```

Each possible export declaration is described as follows:

```js
interface ExportAllDeclaration {
    type: 'ExportAllDeclaration';
    source: Literal;
}

interface ExportDefaultDeclaration {
    type: 'ExportDefaultDeclaration';
    declaration: Identifier | BindingPattern | ClassDeclaration | Expression | FunctionDeclaration;
}

interface ExportNamedDeclaration {
    type: 'ExportNamedDeclaration';
    declaration: ClassDeclaration | FunctionDeclaration | VariableDeclaration;
    specifiers: ExportSpecifier[];
    source: Literal;
}
```

with

```js
interface ExportSpecifier {
    type: 'ExportSpecifier';
    exported: Identifier;
    local: Identifier;
};
```
