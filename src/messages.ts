// Error messages should be identical to V8.
export const Messages = {
    UnexpectedToken: 'Unexpected token %0',
    UnexpectedTokenIllegal: 'Unexpected token ILLEGAL',
    UnexpectedNumber: 'Unexpected number',
    UnexpectedString: 'Unexpected string',
    UnexpectedIdentifier: 'Unexpected identifier',
    UnexpectedReserved: 'Unexpected reserved word',
    UnexpectedTemplate: 'Unexpected quasi %0',
    UnexpectedEOS: 'Unexpected end of input',
    NewlineAfterThrow: 'Illegal newline after throw',
    InvalidRegExp: 'Invalid regular expression',
    UnterminatedRegExp: 'Invalid regular expression: missing /',
    InvalidLHSInAssignment: 'Invalid left-hand side in assignment',
    InvalidLHSInForIn: 'Invalid left-hand side in for-in',
    InvalidLHSInForLoop: 'Invalid left-hand side in for-loop',
    MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
    NoCatchOrFinally: 'Missing catch or finally after try',
    UnknownLabel: 'Undefined label \'%0\'',
    Redeclaration: '%0 \'%1\' has already been declared',
    IllegalContinue: 'Illegal continue statement',
    IllegalBreak: 'Illegal break statement',
    IllegalReturn: 'Illegal return statement',
    StrictModeWith: 'Strict mode code may not include a with statement',
    StrictCatchVariable: 'Catch variable may not be eval or arguments in strict mode',
    StrictVarName: 'Variable name may not be eval or arguments in strict mode',
    StrictParamName: 'Parameter name eval or arguments is not allowed in strict mode',
    StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
    StrictFunctionName: 'Function name may not be eval or arguments in strict mode',
    StrictOctalLiteral: 'Octal literals are not allowed in strict mode.',
    StrictDelete: 'Delete of an unqualified identifier in strict mode.',
    StrictLHSAssignment: 'Assignment to eval or arguments is not allowed in strict mode',
    StrictLHSPostfix: 'Postfix increment/decrement may not have eval or arguments operand in strict mode',
    StrictLHSPrefix: 'Prefix increment/decrement may not have eval or arguments operand in strict mode',
    StrictReservedWord: 'Use of future reserved word in strict mode',
    TemplateOctalLiteral: 'Octal literals are not allowed in template strings.',
    ParameterAfterRestParameter: 'Rest parameter must be last formal parameter',
    DefaultRestParameter: 'Unexpected token =',
    ObjectPatternAsRestParameter: 'Unexpected token {',
    DuplicateProtoProperty: 'Duplicate __proto__ fields are not allowed in object literals',
    ConstructorSpecialMethod: 'Class constructor may not be an accessor',
    DuplicateConstructor: 'A class may only have one constructor',
    StaticPrototype: 'Classes may not have static property named prototype',
    MissingFromClause: 'Missing from keyword',
    NoAsAfterImportNamespace: 'Missing as keyword after import',
    InvalidModuleSpecifier: 'Invalid module specifier',
    IllegalImportDeclaration: 'Illegal import declaration',
    IllegalExportDeclaration: 'Illegal export declaration',
    DuplicateBinding: 'Duplicate binding %0',
    DeclarationMissingInitializer: 'Missing initializer in %0 declaration'
};
