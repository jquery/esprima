const child_process = require('child_process');
const assert = require('assert');

const actual = child_process
    .execSync('rollup test/test-sideEffects/app.js')
    .toString();

const expected = `const foo = 'bar';

export { foo };
`;

assert.equal(actual, expected)