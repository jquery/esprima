### Unit Tests

#### How do I run the tests?

```bash
gulp test           # run tests once
gulp test-watch     # run tests when esprima or fixtures change
gulp test-chrome    # run tests in chrome

```

#### How are fixtures built?

Gulp compiles the JS and JSON fixture files into two fixture files of the form:

```js
__fixtures_js__ = {};
__fixtures_js__['api/migrated_0011.run'] = "esprima.tokenize(42);\n";
__fixtures_js__['comment/migrated_0014'] = "/*a\nc*/ 42";
```

```js
__fixtures_json_ = {};
__fixtures_json__['api/migrated_0011.run'] = "{\n    \"type\": \"Program\",\n"
__fixtures_json__['comment/migrated_0014'] = "{\n    \"type\": \"Program\",\n"
```

#### How are tests run?

In Node, Gulp uses Mocha to load and test files Each test requires the modules that it needs to run.

In Browsers, Gulp uses Karma and WebPack.
+ Host the Assets - Karma
+ Launch the browsers - Karma
+ Run Webpack - Karma
+ Bundle mocha test files - WebPack
+ Build source map - WebPack


### Anatomy of a test.

There are five types of tests (api, failure, module, tokens, tree). Each test,
requires Esprima, the test cases, and needed utilities.

The tests are written in a BDD style with a data provider with these libraries:
  + Runner - Mocha
  + Reporter - Mocha
  + Data Provider - leche
  + Assertions - chai


```js
// TEST DEPENDENCIES
var esprima = require('../../esprima'),
    cases = require('./lib/enumerate-fixtures')
    jsonify = require('./lib/jsonify'),
    expect    = require("chai").expect,
    leche = require('leche');

// TEST CASES
var apiSpecs = _.omit(cases, function(_case) { return !_case.result; });

describe('Api', function() {
  leche.withData(apiSpecs, function(testCase) {

    // SINGLE TEST CASE
    it('should match expected output', function() {
        var expected = jsonify(testCase.result);
        var actual = jsonify(eval(testCase.run));
        expect(actual).to.equal(expected);
    });
  });
});
```
