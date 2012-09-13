/*
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2011 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2011 Arpad Borsos <arpad.borsos@googlemail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var testFixture;

var mozillaTestFixture = {
    'Allow Starless Generators': {
        '(function () { yield 10 })':
        {
            type: 'ExpressionStatement',
            expression: {
                type: 'FunctionExpression',
                id: null,
                params: [],
                defaults: [],
                body: {
                    type: 'BlockStatement',
                    body: [{
                        type: 'ExpressionStatement',
                        expression: {
                            type: 'YieldExpression',
                            argument: {
                                type: 'Literal',
                                value: 10,
                                raw: '10',
                                range: [21, 23],
                                loc: {
                                    start: { line: 1, column: 21 },
                                    end: { line: 1, column: 23 }
                                }
                            },
                            delegate: false,
                            range: [15, 23],
                            loc: {
                                start: { line: 1, column: 15 },
                                end: { line: 1, column: 23 }
                            }
                        },
                        range: [15, 24],
                        loc: {
                            start: { line: 1, column: 15 },
                            end: { line: 1, column: 24 }
                        }
                    }],
                    range: [13, 25],
                    loc: {
                        start: { line: 1, column: 13 },
                        end: { line: 1, column: 25 }
                    }
                },
                rest: null,
                generator: true,
                expression: false,
                range: [1, 25],
                loc: {
                    start: { line: 1, column: 1 },
                    end: { line: 1, column: 25 }
                }
            },
            range: [0, 26],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 26 }
            }
        },
        '(function(){}({a: function(){yield 1}}))': {
            type: 'ExpressionStatement',
            expression: {
                type: 'CallExpression',
                callee: {
                    type: 'FunctionExpression',
                    id: null,
                    params: [],
                    defaults: [],
                    body: {
                        type: 'BlockStatement',
                        body: [],
                        range: [11, 13],
                        loc: {
                            start: { line: 1, column: 11 },
                            end: { line: 1, column: 13 }
                        }
                    },
                    rest: null,
                    generator: false,
                    expression: false,
                    range: [1, 13],
                    loc: {
                        start: { line: 1, column: 1 },
                        end: { line: 1, column: 13 }
                    }
                },
                'arguments': [{
                    type: 'ObjectExpression',
                    properties: [{
                        type: 'Property',
                        key: {
                            type: 'Identifier',
                            name: 'a',
                            range: [15, 16],
                            loc: {
                                start: { line: 1, column: 15 },
                                end: { line: 1, column: 16 }
                            }
                        },
                        value: {
                            type: 'FunctionExpression',
                            id: null,
                            params: [],
                            defaults: [],
                            body: {
                                type: 'BlockStatement',
                                body: [{
                                    type: 'ExpressionStatement',
                                    expression: {
                                        type: 'YieldExpression',
                                        argument: {
                                            type: 'Literal',
                                            value: 1,
                                            raw: '1',
                                            range: [35, 36],
                                            loc: {
                                                start: { line: 1, column: 35 },
                                                end: { line: 1, column: 36 }
                                            }
                                        },
                                        delegate: false,
                                        range: [29, 36],
                                        loc: {
                                            start: { line: 1, column: 29 },
                                            end: { line: 1, column: 36 }
                                        }
                                    },
                                    range: [29, 36],
                                    loc: {
                                        start: { line: 1, column: 29 },
                                        end: { line: 1, column: 36 }
                                    }
                                }],
                                range: [28, 37],
                                loc: {
                                    start: { line: 1, column: 28 },
                                    end: { line: 1, column: 37 }
                                }
                            },
                            rest: null,
                            generator: true,
                            expression: false,
                            range: [18, 37],
                            loc: {
                                start: { line: 1, column: 18 },
                                end: { line: 1, column: 37 }
                            }
                        },
                        kind: 'init',
                        range: [15, 37],
                        loc: {
                            start: { line: 1, column: 15 },
                            end: { line: 1, column: 37 }
                        }
                    }],
                    range: [14, 38],
                    loc: {
                        start: { line: 1, column: 14 },
                        end: { line: 1, column: 38 }
                    }
                }],
                range: [1, 39],
                loc: {
                    start: { line: 1, column: 1 },
                    end: { line: 1, column: 39 }
                }
            },
            range: [0, 40],
            loc: {
                start: { line: 1, column: 0 },
                end: { line: 1, column: 40 }
            }
        }
    },

    'Mozilla Invalid syntax': {
        'function(){yield 1}  // function must be named or assigned': {
            index: 8,
            lineNumber: 1,
            column: 9,
            message: 'Error: Line 1: Unexpected token ('
        }

        /* these 3 are TypeError: generator function a returns a value */
        /* perhaps these aren't esprima's job to catch?
        'function a(){if (1) {return 1} else {yield 1 }} // no mixing return and yield':{
            index: 2,
            lineNumber: 1,
            column: 3,
            message: 'Error: Line 1: Unexpected token ILLEGAL'
        },

        'function a(){return 1; yield 1}':{
            index: 2,
            lineNumber: 1,
            column: 3,
            message: 'Error: Line 1: Unexpected token ILLEGAL'
        },

        'function a() yield 1; // expression closures are returns':{
            index: 2,
            lineNumber: 1,
            column: 3,
            message: 'Error: Line 1: Unexpected token ILLEGAL'
        }  */
    }

};

// Merge both test fixtures.

(function () {

    'use strict';

    var i, fixtures;

    for (i in mozillaTestFixture) {
        if (mozillaTestFixture.hasOwnProperty(i)) {
            fixtures = mozillaTestFixture[i];
            if (i !== 'Syntax' && testFixture.hasOwnProperty(i)) {
                throw new Error('Mozilla test should not replace existing test for ' + i);
            }
            testFixture[i] = fixtures;
        }
    }

}());

