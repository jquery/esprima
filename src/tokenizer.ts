import { ErrorHandler } from './error-handler';
import { Comment, RawToken, Scanner, SourceLocation } from './scanner';
import { Token, TokenName } from './token';

type ReaderEntry = string | null;

interface BufferEntry {
    type: string;
    value: string;
    regex?: {
        pattern: string;
        flags: string;
    };
    range?: [number, number];
    loc?: SourceLocation;
}

class Reader {
    readonly values: ReaderEntry[];
    curly: number;
    paren: number;

    constructor() {
        this.values = [];
        this.curly = this.paren = -1;
    }

    // A function following one of those tokens is an expression.
    beforeFunctionExpression(t: string): boolean {
        return ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new',
            'return', 'case', 'delete', 'throw', 'void',
            // assignment operators
            '=', '+=', '-=', '*=', '**=', '/=', '%=', '<<=', '>>=', '>>>=',
            '&=', '|=', '^=', ',',
            // binary/unary operators
            '+', '-', '*', '**', '/', '%', '++', '--', '<<', '>>', '>>>', '&',
            '|', '^', '!', '~', '&&', '||', '??', '?', ':', '===', '==', '>=',
            '<=', '<', '>', '!=', '!=='].indexOf(t) >= 0;
    }

    // Determine if forward slash (/) is an operator or part of a regular expression
    // https://github.com/mozilla/sweet.js/wiki/design
    isRegexStart() {
        const previous = this.values[this.values.length - 1];
        let regex = (previous !== null);

        switch (previous) {
            case 'this':
            case ']':
                regex = false;
                break;

            case ')':
                const keyword = this.values[this.paren - 1];
                regex = (keyword === 'if' || keyword === 'while' || keyword === 'for' || keyword === 'with');
                break;

            case '}':
                // Dividing a function by anything makes little sense,
                // but we have to check for that.
                regex = true;
                if (this.values[this.curly - 3] === 'function') {
                    // Anonymous function, e.g. function(){} /42
                    const check = this.values[this.curly - 4];
                    regex = check ? !this.beforeFunctionExpression(check) : false;
                } else if (this.values[this.curly - 4] === 'function') {
                    // Named function, e.g. function f(){} /42/
                    const check = this.values[this.curly - 5];
                    regex = check ? !this.beforeFunctionExpression(check) : true;
                }
                break;
            default:
                break;
        }

        return regex;
    }

    push(token): void {
        if (token.type === Token.Punctuator || token.type === Token.Keyword) {
            if (token.value === '{') {
                this.curly = this.values.length;
            } else if (token.value === '(') {
                this.paren = this.values.length;
            }
            this.values.push(token.value);
        } else {
            this.values.push(null);
        }
    }

}

interface Config {
    tolerant?: boolean;
    comment?: boolean;
    range?: boolean;
    loc?: boolean;
}

export class Tokenizer {
    readonly errorHandler: ErrorHandler;
    scanner: Scanner;
    readonly trackRange: boolean;
    readonly trackLoc: boolean;
    readonly buffer: BufferEntry[];
    readonly reader: Reader;

    constructor(code: string, config: Config) {
        this.errorHandler = new ErrorHandler();
        this.errorHandler.tolerant = config ? (typeof config.tolerant === 'boolean' && config.tolerant) : false;

        this.scanner = new Scanner(code, this.errorHandler);
        this.scanner.trackComment = config ? (typeof config.comment === 'boolean' && config.comment) : false;

        this.trackRange = config ? (typeof config.range === 'boolean' && config.range) : false;
        this.trackLoc = config ? (typeof config.loc === 'boolean' && config.loc) : false;
        this.buffer = [];
        this.reader = new Reader();
    }

    errors() {
        return this.errorHandler.errors;
    }

    getNextToken() {
        if (this.buffer.length === 0) {

            const comments: Comment[] = this.scanner.scanComments();
            if (this.scanner.trackComment) {
                for (let i = 0; i < comments.length; ++i) {
                    const e: Comment = comments[i];
                    const value = this.scanner.source.slice(e.slice[0], e.slice[1]);
                    const comment: BufferEntry = {
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
                let loc;

                if (this.trackLoc) {
                    loc = {
                        start: {
                            line: this.scanner.lineNumber,
                            column: this.scanner.index - this.scanner.lineStart
                        },
                        end: {}
                    };
                }

                const maybeRegex = (this.scanner.source[this.scanner.index] === '/') && this.reader.isRegexStart();
                let token: RawToken;
                if (maybeRegex) {
                    const state = this.scanner.saveState();
                    try {
                        token = this.scanner.scanRegExp();
                    } catch (e) {
                        this.scanner.restoreState(state);
                        token = this.scanner.lex();
                    }
                } else {
                    token = this.scanner.lex();
                }

                this.reader.push(token);
                const entry: BufferEntry = {
                    type: TokenName[token.type],
                    value: this.scanner.source.slice(token.start, token.end)
                };
                if (this.trackRange) {
                    entry.range = [token.start, token.end];
                }
                if (this.trackLoc) {
                    loc.end = {
                        line: this.scanner.lineNumber,
                        column: this.scanner.index - this.scanner.lineStart
                    };
                    entry.loc = loc;
                }
                if (token.type === Token.RegularExpression) {
                    const pattern = token.pattern as string;
                    const flags = token.flags as string;
                    entry.regex = { pattern, flags };
                }

                this.buffer.push(entry);
            }
        }

        return this.buffer.shift();
    }

}
