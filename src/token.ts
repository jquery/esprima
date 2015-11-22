export enum Token {
    BooleanLiteral = 1,
    EOF,
    Identifier,
    Keyword,
    NullLiteral,
    NumericLiteral,
    Punctuator,
    StringLiteral,
    RegularExpression,
    Template
};

export let TokenName = {};
TokenName[Token.BooleanLiteral] = 'Boolean';
TokenName[Token.EOF] = '<end>';
TokenName[Token.Identifier] = 'Identifier';
TokenName[Token.Keyword] = 'Keyword';
TokenName[Token.NullLiteral] = 'Null';
TokenName[Token.NumericLiteral] = 'Numeric';
TokenName[Token.Punctuator] = 'Punctuator';
TokenName[Token.StringLiteral] = 'String';
TokenName[Token.RegularExpression] = 'RegularExpression';
TokenName[Token.Template] = 'Template';
