/**
 * Ensure the condition is true, otherwise throw an error.
 * This is only to have a better contract semantic, i.e. another safety net
 * to catch a logic error. The condition shall be fulfilled in normal case.
 * Do NOT use this to enforce a certain condition on any user input.
 *
 * @param {boolean} condition the condition we're asserting
 * @param {string} message the message if there is an error
 **/
export function assert(condition: boolean, message: string): void {
    /* istanbul ignore if */
    if (!condition) {
        throw new Error('ASSERT: ' + message);
    }
}
