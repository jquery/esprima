/**
 * @fileoverview Counts the cyclomatic complexity of each function of the script. See http://en.wikipedia.org/wiki/Cyclomatic_complexity.
 * Counts the number of if, conditional, for, while, try, but not logical, switch/case,
 */

"use strict";

const MAX = 24;

module.exports = {
    rules: {
        "esprima-complexity": {
            create(context) {
                const fns = [];

                function startFunction() {
                    fns.push(1);
                }

                function endFunction(node) {
                    const name = node.id ? node.id.name : `:${node.loc.start.line}`;
                    const complexity = fns.pop();

                    if (complexity > MAX) {
                        context.report(node, `${name} has a Cyclomatic complexity of ${complexity}, treshold of ${MAX} is exceeded!`);
                    }
                }

                function increaseComplexity() {
                    if (fns.length) {
                        fns[fns.length - 1]++;
                    }
                }

                return {
                    FunctionDeclaration: startFunction,
                    FunctionExpression: startFunction,
                    ArrowFunctionExpression: startFunction,
                    "FunctionDeclaration:exit": endFunction,
                    "FunctionExpression:exit": endFunction,
                    "ArrowFunctionExpression:exit": endFunction,

                    CatchClause: increaseComplexity,
                    ConditionalExpression: increaseComplexity,
                    ForStatement: increaseComplexity,
                    ForInStatement: increaseComplexity,
                    ForOfStatement: increaseComplexity,
                    IfStatement: increaseComplexity,
                    WhileStatement: increaseComplexity,
                    DoWhileStatement: increaseComplexity
                };
            }
        }
    }
};