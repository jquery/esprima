export interface EsprimaError extends Error {
    name: string;
    message: string;
    index: number;
    lineNumber: number;
    column: number;
    description: string;
    // constructor(message: string);
}

export class ErrorHandler {
    readonly errors: EsprimaError[];
    tolerant: boolean;

    constructor() {
        this.errors = [];
        this.tolerant = false;
    }

    recordError(error: EsprimaError): void {
        this.errors.push(error);
    }

    tolerate(error: EsprimaError): void {
        if (this.tolerant) {
            this.recordError(error);
        } else {
            throw error;
        }
    }

    constructError(msg: string, column: number): Error {
        let error = new Error(msg);
        try {
            throw error;
        } catch (base) {
            /* istanbul ignore else */
            if (Object.create && Object.defineProperty) {
                error = Object.create(base);
                Object.defineProperty(error, 'column', { value: column });
            }
        }
        /* istanbul ignore next */
        return error;
    }

    createError(index: number, line: number, col: number, description: string): EsprimaError {
        const msg = 'Line ' + line + ': ' + description;
        const _error = this.constructError(msg, col) as any;
        _error.index = index;
        _error.lineNumber = line;
        _error.description = description;
        const error: EsprimaError = _error
        return error;
    }

    throwError(index: number, line: number, col: number, description: string): never {
        throw this.createError(index, line, col, description);
    }

    tolerateError(index: number, line: number, col: number, description: string) {
        const error = this.createError(index, line, col, description);
        if (this.tolerant) {
            this.recordError(error);
        } else {
            throw error;
        }
    }

}
