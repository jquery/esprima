import { Comment, Scanner } from './scanner';
import { ErrorHandler } from './error-handler';
import { Token, TokenName } from './token';

// A function following one of those tokens is an expression.
function beforeFunctionExpression(t: string): boolean {
    return ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new',
        'return', 'case', 'delete', 'throw', 'void',
    // assignment operators
        '=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '>>>=',
        '&=', '|=', '^=', ',',
    // binary/unary operators
        '+', '-', '*', '/', '%', '++', '--', '<<', '>>', '>>>', '&',
        '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=',
        '<=', '<', '>', '!=', '!=='].indexOf(t) >= 0;
}

interface ReaderState {
    values: string[];
    curly: number;
    paren: number;
}

class Tokenizer {
    errorHandler: ErrorHandler;
    scanner: Scanner;
    trackRange: boolean;
    trackLoc: boolean;
    buffer: any[];
    reader: ReaderState;

    constructor(code: string, config: any) {
        this.errorHandler = new ErrorHandler();
        this.errorHandler.tolerant = config ? (typeof config.tolerant === 'boolean' && config.tolerant) : false;

        this.scanner = new Scanner(code, this.errorHandler);
        this.scanner.trackComment = config ? (typeof config.comment === 'boolean' && config.comment) : false;

        this.trackRange = config ? (typeof config.range === 'boolean' && config.range) : false;
        this.trackLoc = config ? (typeof config.loc === 'boolean' && config.loc) : false;
        this.buffer = [];
        this.reader = {
            values: [],
            curly: -1,
            paren: -1
        };
    };

    errors() {
        if (this.errorHandler.tolerant) {
            return this.errorHandler.errors;
        }
    };

    getNextToken() {
        if (this.buffer.length === 0) {

            const comments: Comment[] = this.scanner.scanComments();
            if (this.scanner.trackComment) {
                for (let i = 0; i < comments.length; ++i) {
                    const e: Comment = comments[i];
                    let comment;
                    let value = this.scanner.source.slice(e.slice[0], e.slice[1]);
                    comment = {
                        type: e.multiLine ? 'BlockComment' : 'LineComment',
                        value: value
                    };
                    if (this.trackRange) {
                        comment.range = e.range;
                    }
                    if (this.trackLoc) {
                        comment.loc = e.loc;
                    }
                    this.buffer.push(comment);
                }
            }

            if (!this.scanner.eof()) {
                let range, loc;

                if (this.trackLoc) {
                    loc = {
                        start: {
                            line: this.scanner.lineNumber,
                            column: this.scanner.index - this.scanner.lineStart
                        },
                        end: {}
                    };
                }

                let token = null;
                if (this.scanner.source[this.scanner.index] === '/') {
                    // https://github.com/mozilla/sweet.js/wiki/design

                    const previous = this.reader.values[this.reader.values.length - 1];
                    let regex = (previous !== null);

                    switch (previous) {
                        case 'this':
                        case ']':
                            regex = false;
                            break;

                        case ')':
                            const check = this.reader.values[this.reader.paren - 1];
                            regex = (check === 'if' || check === 'while' || check === 'for' || check === 'with');
                            break;

                        case '}':
                            // Dividing a function by anything makes little sense,
                            // but we have to check for that.
                            regex = false;
                            if (this.reader.values[this.reader.curly - 3] === 'function') {
                                // Anonymous function, e.g. function(){} /42
                                const check = this.reader.values[this.reader.curly - 4];
                                regex = check ? !beforeFunctionExpression(check) : false;
                            } else if (this.reader.values[this.reader.curly - 4] === 'function') {
                                // Named function, e.g. function f(){} /42/
                                const check = this.reader.values[this.reader.curly - 5];
                                regex = check ? !beforeFunctionExpression(check) : true;
                            }
                    }
                    if (regex) {
                        token = this.scanner.scanRegExp();
                    }
                }
                if (!token) {
                    token = this.scanner.lex();
                }

                let value = null;
                if (token.type === Token.Punctuator || token.type === Token.Keyword) {
                    value = this.scanner.source.slice(token.start, token.end);
                    if (value === '{') {
                        this.reader.curly = this.reader.values.length;
                    } if (value === '(') {
                        this.reader.paren = this.reader.values.length;
                    }
                }
                this.reader.values.push(value);


                if (this.trackRange) {
                    range = [token.start, token.end];
                }
                if (this.trackLoc) {
                    loc.end = {
                        line: this.scanner.lineNumber,
                        column: this.scanner.index - this.scanner.lineStart
                    };
                }

                const entry = {
                    type: TokenName[token.type],
                    value: this.scanner.source.slice(token.start, token.end),
                    range: range,
                    loc: loc,
                    regex: token.regex
                };
                this.buffer.push(entry);
            }
        }

        return this.buffer.shift();
    };

}

export function tokenize(code: string, options, delegate) {
    let tokenizer: Tokenizer = new Tokenizer(code, options);

    let tokens;
    tokens = [];

    try {
        while (true) {
            let token = tokenizer.getNextToken();
            if (!token) {
                break;
            }
            if (delegate) {
                token = delegate(token);
            }
            tokens.push(token);
        }
    } catch (e) {
        tokenizer.errorHandler.tolerate(e);
    }

    tokens.errors = tokenizer.errors();
    return tokens;
}
