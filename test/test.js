/*
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

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

/*global document: true, window:true, esprima: true */

var runTests, data;

data = {

    'Primary Expression': {

        'this': {
            type: 'ExpressionStatement',
            expression: {
                type: 'ThisExpression'
            }
        },

        '42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 42
            }
        },

        '(1 + 2 ) * 3': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '*',
                left: {
                    type: 'BinaryExpression',
                    operator: '+',
                    left: {
                        type: 'Literal',
                        value: 1
                    },
                    right: {
                        type: 'Literal',
                        value: 2
                    }
                },
                right: {
                    type: 'Literal',
                    value: 3
                }
            }
        }
    },

    'Array Initializer': {

        'x = []': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'ArrayExpression',
                    elements: []
                }
            }
        },

        'x = [ ]': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'ArrayExpression',
                    elements: []
                }
            }
        },

        'x = [ 42 ]': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'ArrayExpression',
                    elements: [{
                        type: 'Literal',
                        value: 42
                    }]
                }
            }
        },

        'x = [ 42, ]': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'ArrayExpression',
                    elements: [{
                        type: 'Literal',
                        value: 42
                    }]
                }
            }
        },

        'x = [ 1, 2, 3, ]': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'ArrayExpression',
                    elements: [{
                        type: 'Literal',
                        value: 1
                    }, {
                        type: 'Literal',
                        value: 2
                    }, {
                        type: 'Literal',
                        value: 3
                    }]
                }
            }
        }
    },

    'Object Initializer': {

        'x = {}': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'ObjectExpression',
                    properties: []
                }
            }
        },

        'x = { }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'ObjectExpression',
                    properties: []
                }
            }
        },

        'x = { answer: 42 }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Identifier',
                            name: 'answer'
                        },
                        value: {
                            type: 'Literal',
                            value: 42
                        }
                    }]
                }
            }
        },

        'x = { "answer": 42 }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Literal',
                            value: 'answer'
                        },
                        value: {
                            type: 'Literal',
                            value: 42
                        }
                    }]
                }
            }
        }

    },

    'Comments': {

        '/* block comment */ 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 42
            }
        },

        '/* multiline\ncomment\nshould\nbe\nignore */ 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 42
            }
        },

        '// line comment\n42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 42
            }
        }
    },

    'Numeric Literals': {

        '42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 42
            }
        },

        '0': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 0
            }
        },

        '.14': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 0.14
            }
        },

        '3.14159': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 3.14159
            }
        },

        '6.02214179e+23': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 6.02214179e+23
            }
        },

        '1.492417830e-10': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 1.492417830e-10
            }
        },

        '0x0': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 0x0
            }
        },

        '0xabc': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 0xabc
            }
        },

        '0xdef': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 0xdef
            }
        },

        '0X1A': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 0X1A
            }
        },

        '0x10': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 0x10
            }
        },

        '0x100': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 0x100
            }
        },

        '0X04': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 0X04
            }
        }
    },

    'Regular Expression Literals': {

        'var x = /[a-z]/i': {
            type: 'VariableDeclaration',
            declarations: [{
                id: {
                    type: 'Identifier',
                    name: 'x'
                },
                init: {
                    type: 'Literal',
                    value: '/[a-z]/i'
                }
            }],
            kind: 'var'
        },

        'var x = /[P QR]/i': {
            type: 'VariableDeclaration',
            declarations: [{
                id: {
                    type: 'Identifier',
                    name: 'x'
                },
                init: {
                    type: 'Literal',
                    value: '/[P QR]/i'
                }
            }],
            kind: 'var'
        },

        'var x = /foo\\/bar/': {
            type: 'VariableDeclaration',
            declarations: [{
                id: {
                    type: 'Identifier',
                    name: 'x'
                },
                init: {
                    type: 'Literal',
                    value: '/foo\\/bar/'
                }
            }],
            kind: 'var'
        },

        'var x = /=([^=\\s]+/g': {
            type: 'VariableDeclaration',
            declarations: [{
                id: {
                    type: 'Identifier',
                    name: 'x'
                },
                init: {
                    type: 'Literal',
                    value: '/=([^=\\s]+/g'
                }
            }],
            kind: 'var'
        }
    },

    'Left-Hand-Side Expression': {

        'new Button': {
            type: 'ExpressionStatement',
            expression: {
                type: 'NewExpression',
                callee: {
                    type: 'Identifier',
                    name: 'Button'
                },
                'arguments': []
            }
        },

        'new Button()': {
            type: 'ExpressionStatement',
            expression: {
                type: 'NewExpression',
                callee: {
                    type: 'Identifier',
                    name: 'Button'
                },
                'arguments': []
            }
        },

        'new new foo': {
            type: 'ExpressionStatement',
            expression: {
                type: 'NewExpression',
                callee: {
                    type: 'NewExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'foo'
                    },
                    'arguments': []
                },
                'arguments': []
            }
        },

        'new new foo()': {
            type: 'ExpressionStatement',
            expression: {
                type: 'NewExpression',
                callee: {
                    type: 'NewExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'foo'
                    },
                    'arguments': []
                },
                'arguments': []
            }
        },

        'foo(bar, baz)': {
            type: 'ExpressionStatement',
            expression: {
                type: 'CallExpression',
                callee: {
                    type: 'Identifier',
                    name: 'foo'
                },
                'arguments': [{
                    type: 'Identifier',
                    name: 'bar'
                }, {
                    type: 'Identifier',
                    name: 'baz'
                }]
            }
        },

        'universe.milkyway': {
            type: 'ExpressionStatement',
            expression: {
                type: 'MemberExpression',
                computed: false,
                object: {
                    type: 'Identifier',
                    name: 'universe'
                },
                property: {
                    type: 'Identifier',
                    name: 'milkyway'
                }
            }
        },

        'universe.milkyway.solarsystem': {
            type: 'ExpressionStatement',
            expression: {
                type: 'MemberExpression',
                computed: false,
                object: {
                    type: 'MemberExpression',
                    computed: false,
                    object: {
                        type: 'Identifier',
                        name: 'universe'
                    },
                    property: {
                        type: 'Identifier',
                        name: 'milkyway'
                    }
                },
                property: {
                    type: 'Identifier',
                    name: 'solarsystem'
                }
            }
        },

        'universe.milkyway.solarsystem.Earth': {
            type: 'ExpressionStatement',
            expression: {
                type: 'MemberExpression',
                computed: false,
                object: {
                    type: 'MemberExpression',
                    computed: false,
                    object: {
                        type: 'MemberExpression',
                        computed: false,
                        object: {
                            type: 'Identifier',
                            name: 'universe'
                        },
                        property: {
                            type: 'Identifier',
                            name: 'milkyway'
                        }
                    },
                    property: {
                        type: 'Identifier',
                        name: 'solarsystem'
                    }
                },
                property: {
                    type: 'Identifier',
                    name: 'Earth'
                }
            }
        },

        'universe[galaxyName, otherUselessName]': {
            type: 'ExpressionStatement',
            expression: {
                type: 'MemberExpression',
                computed: true,
                object: {
                    type: 'Identifier',
                    name: 'universe'
                },
                property: {
                    type: 'SequenceExpression',
                    expressions: [{
                        type: 'Identifier',
                        name: 'galaxyName'
                    }, {
                        type: 'Identifier',
                        name: 'otherUselessName'
                    }]
                }
            }
        },

        'universe[galaxyName]': {
            type: 'ExpressionStatement',
            expression: {
                type: 'MemberExpression',
                computed: true,
                object: {
                    type: 'Identifier',
                    name: 'universe'
                },
                property: {
                    type: 'Identifier',
                    name: 'galaxyName'
                }
            }
        },

        'universe[42].galaxies': {
            type: 'ExpressionStatement',
            expression: {
                type: 'MemberExpression',
                computed: false,
                object: {
                    type: 'MemberExpression',
                    computed: true,
                    object: {
                        type: 'Identifier',
                        name: 'universe'
                    },
                    property: {
                        type: 'Literal',
                        value: 42
                    }
                },
                property: {
                    type: 'Identifier',
                    name: 'galaxies'
                }
            }
        },

        'universe(42).galaxies': {
            type: 'ExpressionStatement',
            expression: {
                type: 'MemberExpression',
                computed: false,
                object: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'universe'
                    },
                    'arguments': [{
                        type: 'Literal',
                        value: 42
                    }]
                },
                property: {
                    type: 'Identifier',
                    name: 'galaxies'
                }
            }
        },

        'universe(42).galaxies(14, 3, 77).milkyway': {
            type: 'ExpressionStatement',
            expression: {
                type: 'MemberExpression',
                computed: false,
                object: {
                    type: 'CallExpression',
                    callee: {
                        type: 'MemberExpression',
                        computed: false,
                        object: {
                            type: 'CallExpression',
                            callee: {
                                type: 'Identifier',
                                name: 'universe'
                            },
                            'arguments': [{
                                type: 'Literal',
                                value: 42
                            }]
                        },
                        property: {
                            type: 'Identifier',
                            name: 'galaxies'
                        }
                    },
                    'arguments': [{
                        type: 'Literal',
                        value: 14
                    }, {
                        type: 'Literal',
                        value: 3
                    }, {
                        type: 'Literal',
                        value: 77
                    }]
                },
                property: {
                    type: 'Identifier',
                    name: 'milkyway'
                }
            }
        },

        'earth.asia.Indonesia.prepareForElection(2014)': {
            type: 'ExpressionStatement',
            expression: {
                type: 'CallExpression',
                callee: {
                    type: 'MemberExpression',
                    computed: false,
                    object: {
                        type: 'MemberExpression',
                        computed: false,
                        object: {
                            type: 'MemberExpression',
                            computed: false,
                            object: {
                                type: 'Identifier',
                                name: 'earth'
                            },
                            property: {
                                type: 'Identifier',
                                name: 'asia'
                            }
                        },
                        property: {
                            type: 'Identifier',
                            name: 'Indonesia'
                        }
                    },
                    property: {
                        type: 'Identifier',
                        name: 'prepareForElection'
                    }
                },
                'arguments': [{
                    type: 'Literal',
                    value: 2014
                }]
            }
        }
    },

    'Postfix Expressions': {

        'x++': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UpdateExpression',
                operator: '++',
                argument: {
                    type: 'Identifier',
                    name: 'x'
                },
                prefix: false
            }
        },

        'x--': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UpdateExpression',
                operator: '--',
                argument: {
                    type: 'Identifier',
                    name: 'x'
                },
                prefix: false
            }
        }
    },

    'Unary Operators': {

        '++x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UpdateExpression',
                operator: '++',
                argument: {
                    type: 'Identifier',
                    name: 'x'
                },
                prefix: true
            }
        },

        '--x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UpdateExpression',
                operator: '--',
                argument: {
                    type: 'Identifier',
                    name: 'x'
                },
                prefix: true
            }
        },

        '+x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UnaryExpression',
                operator: '+',
                argument: {
                    type: 'Identifier',
                    name: 'x'
                }
            }
        },

        '-x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UnaryExpression',
                operator: '-',
                argument: {
                    type: 'Identifier',
                    name: 'x'
                }
            }
        },

        '~x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UnaryExpression',
                operator: '~',
                argument: {
                    type: 'Identifier',
                    name: 'x'
                }
            }
        },

        '!x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UnaryExpression',
                operator: '!',
                argument: {
                    type: 'Identifier',
                    name: 'x'
                }
            }
        },

        'void x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UnaryExpression',
                operator: 'void',
                argument: {
                    type: 'Identifier',
                    name: 'x'
                }
            }
        },

        'delete x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UnaryExpression',
                operator: 'delete',
                argument: {
                    type: 'Identifier',
                    name: 'x'
                }
            }
        },

        'typeof x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UnaryExpression',
                operator: 'typeof',
                argument: {
                    type: 'Identifier',
                    name: 'x'
                }
            }
        }
    },

    'Multiplicative Operators': {

        'x * y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '*',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'x / y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '/',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'x % y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '%',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        }
    },

    'Additive Operators': {

        'x + y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '+',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'x - y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '-',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        }
    },

    'Bitwise Shift Operator': {

        'x << y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '<<',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'x >> y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '>>',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'x >>> y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '>>>',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        }
    },

    'Relational Operators': {

        'x < y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '<',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'x > y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '>',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'x <= y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '<=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'x >= y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '>=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'x in y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: 'in',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'x instanceof y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: 'instanceof',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        }
    },

    'Equality Operators': {

        'x == y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '==',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'x != y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '!=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'x === y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '===',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'x !== y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '!==',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        }
    },

    'Binary Bitwise Operators' : {

        'x & y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '&',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'x ^ y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '^',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'x | y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '|',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'x | y & z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '|',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'BinaryExpression',
                    operator: '&',
                    left: {
                        type: 'Identifier',
                        name: 'y'
                    },
                    right: {
                        type: 'Identifier',
                        name: 'z'
                    }
                }
            }
        }
    },

    'Binary Logical Operators': {

        'x || y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'LogicalExpression',
                operator: '||',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'x && y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'LogicalExpression',
                operator: '&&',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'x || y && z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'LogicalExpression',
                operator: '||',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'LogicalExpression',
                    operator: '&&',
                    left: {
                        type: 'Identifier',
                        name: 'y'
                    },
                    right: {
                        type: 'Identifier',
                        name: 'z'
                    }
                }
            }
        },

        'x || y ^ z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'LogicalExpression',
                operator: '||',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'BinaryExpression',
                    operator: '^',
                    left: {
                        type: 'Identifier',
                        name: 'y'
                    },
                    right: {
                        type: 'Identifier',
                        name: 'z'
                    }
                }
            }
        }
    },

    'Conditional Operator': {

        'y ? 1 : 2': {
            type: 'ExpressionStatement',
            expression: {
                type: 'ConditionalExpression',
                test: {
                    type: 'Identifier',
                    name: 'y'
                },
                consequent: {
                    type: 'Literal',
                    value: 1
                },
                alternate: {
                    type: 'Literal',
                    value: 2
                }
            }
        },

        'x && y ? 1 : 2': {
            type: 'ExpressionStatement',
            expression: {
                type: 'ConditionalExpression',
                test: {
                    type: 'LogicalExpression',
                    operator: '&&',
                    left: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    right: {
                        type: 'Identifier',
                        name: 'y'
                    }
                },
                consequent: {
                    type: 'Literal',
                    value: 1
                },
                alternate: {
                    type: 'Literal',
                    value: 2
                }
            }
        },

        'x = 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 42
                }
            }
        },

        'x *= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '*=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 42
                }
            }
        },

        'x /= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '/=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 42
                }
            }
        },

        'x %= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '%=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 42
                }
            }
        },

        'x += 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '+=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 42
                }
            }
        },

        'x -= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '-=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 42
                }
            }
        },

        'x <<= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '<<=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 42
                }
            }
        },

        'x >>= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '>>=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 42
                }
            }
        },

        'x >>>= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '>>>=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 42
                }
            }
        },

        'x &= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '&=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 42
                }
            }
        },

        'x ^= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '^=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 42
                }
            }
        },

        'x |= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '|=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 42
                }
            }
        }
    },

    'Block': {

        '{ foo }': {
            type: 'BlockStatement',
            body: [{
                type: 'ExpressionStatement',
                expression: {
                    type: 'Identifier',
                    name: 'foo'
                }
            }]
        },

        '{ doThis(); doThat(); }': {
            type: 'BlockStatement',
            body: [{
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'doThis'
                    },
                    'arguments': []
                }
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'doThat'
                    },
                    'arguments': []
                }
            }]
        },

        '{}': {
            type: 'BlockStatement',
            body: []
        }
    },

    'Variable Statement': {

        'var x': {
            type: 'VariableDeclaration',
            declarations: [{
                id: {
                    type: 'Identifier',
                    name: 'x'
                },
                init: null
            }],
            kind: 'var'
        },

        'var x, y;': {
            type: 'VariableDeclaration',
            declarations: [{
                id: {
                    type: 'Identifier',
                    name: 'x'
                },
                init: null
            }, {
                id: {
                    type: 'Identifier',
                    name: 'y'
                },
                init: null
            }],
            kind: 'var'
        },

        'var x = 42': {
            type: 'VariableDeclaration',
            declarations: [{
                id: {
                    type: 'Identifier',
                    name: 'x'
                },
                init: {
                    type: 'Literal',
                    value: 42
                }
            }],
            kind: 'var'
        },

        'var x = 14, y = 3, z = 1977': {
            type: 'VariableDeclaration',
            declarations: [{
                id: {
                    type: 'Identifier',
                    name: 'x'
                },
                init: {
                    type: 'Literal',
                    value: 14
                }
            }, {
                id: {
                    type: 'Identifier',
                    name: 'y'
                },
                init: {
                    type: 'Literal',
                    value: 3
                }
            }, {
                id: {
                    type: 'Identifier',
                    name: 'z'
                },
                init: {
                    type: 'Literal',
                    value: 1977
                }
            }],
            kind: 'var'
        }
    },

    'Empty Statement': {

        ';': {
            type: 'EmptyStatement'
        }

    },

    'Expression Statement': {

        'x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Identifier',
                name: 'x'
            }
        },

        'x, y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'SequenceExpression',
                expressions: [
                    {
                        type: 'Identifier',
                        name: 'x'
                    },
                    {
                        type: 'Identifier',
                        name: 'y'
                    }
                ]
            }
        }

    },

    'If Statement': {

        'if (morning) goodMorning()': {
            type: 'IfStatement',
            test: {
                type: 'Identifier',
                name: 'morning'
            },
            consequent: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'goodMorning'
                    },
                    'arguments': []
                }
            }
        },

        'if (morning) goodMorning(); else goodDay()': {
            type: 'IfStatement',
            test: {
                type: 'Identifier',
                name: 'morning'
            },
            consequent: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'goodMorning'
                    },
                    'arguments': []
                }
            },
            alternate: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'goodDay'
                    },
                    'arguments': []
                }
            }
        }

    },

    'Iteration Statements': {

        'do keep() while (true)': {
            type: 'DoWhileStatement',
            body: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'keep'
                    },
                    'arguments': []
                }
            },
            test: {
                type: 'Literal',
                value: true
            }
        },

        'do { x++; y--; } while (x < 10)': {
            type: 'DoWhileStatement',
            body: {
                type: 'BlockStatement',
                body: [{
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'UpdateExpression',
                        operator: '++',
                        argument: {
                            type: 'Identifier',
                            name: 'x'
                        },
                        prefix: false
                    }
                }, {
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'UpdateExpression',
                        operator: '--',
                        argument: {
                            type: 'Identifier',
                            name: 'y'
                        },
                        prefix: false
                    }
                }]
            },
            test: {
                type: 'BinaryExpression',
                operator: '<',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 10
                }
            }
        },

        'while (true) doSomething()': {
            type: 'WhileStatement',
            test: {
                type: 'Literal',
                value: true
            },
            body: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'doSomething'
                    },
                    'arguments': []
                }
            }
        },

        'while (x < 10) { x++; y--; }': {
            type: 'WhileStatement',
            test: {
                type: 'BinaryExpression',
                operator: '<',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 10
                }
            },
            body: {
                type: 'BlockStatement',
                body: [{
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'UpdateExpression',
                        operator: '++',
                        argument: {
                            type: 'Identifier',
                            name: 'x'
                        },
                        prefix: false
                    }
                }, {
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'UpdateExpression',
                        operator: '--',
                        argument: {
                            type: 'Identifier',
                            name: 'y'
                        },
                        prefix: false
                    }
                }]
            }
        },

        'for(;;);': {
            type: 'ForStatement',
            init: null,
            test: null,
            update: null,
            body: {
                type: 'EmptyStatement'
            }
        },

        'for(;;){}': {
            type: 'ForStatement',
            init: null,
            test: null,
            update: null,
            body: {
                type: 'BlockStatement',
                body: []
            }
        },

        'for(x = 0;;);': {
            type: 'ForStatement',
            init: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 0
                }
            },
            test: null,
            update: null,
            body: {
                type: 'EmptyStatement'
            }
        },

        'for(var x = 0;;);': {
            type: 'ForStatement',
            init: {
                id: {
                    type: 'Identifier',
                    name: 'x'
                },
                init: {
                    type: 'Literal',
                    value: 0
                }
            },
            test: null,
            update: null,
            body: {
                type: 'EmptyStatement'
            }
        },

        'for(var x = 0, y = 1;;);': {
            type: 'ForStatement',
            init: {
                type: 'SequenceExpression',
                expressions: [{
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: {
                        type: 'Literal',
                        value: 0
                    }
                }, {
                    id: {
                        type: 'Identifier',
                        name: 'y'
                    },
                    init: {
                        type: 'Literal',
                        value: 1
                    }
                }]
            },
            test: null,
            update: null,
            body: {
                type: 'EmptyStatement'
            }
        },

        'for(x = 0; x < 42;);': {
            type: 'ForStatement',
            init: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 0
                }
            },
            test: {
                type: 'BinaryExpression',
                operator: '<',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 42
                }
            },
            update: null,
            body: {
                type: 'EmptyStatement'
            }
        },

        'for(x = 0; x < 42; x++);': {
            type: 'ForStatement',
            init: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 0
                }
            },
            test: {
                type: 'BinaryExpression',
                operator: '<',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 42
                }
            },
            update: {
                type: 'UpdateExpression',
                operator: '++',
                argument: {
                    type: 'Identifier',
                    name: 'x'
                },
                prefix: false
            },
            body: {
                type: 'EmptyStatement'
            }
        },

        'for(x = 0; x < 42; x++) process(x);': {
            type: 'ForStatement',
            init: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 0
                }
            },
            test: {
                type: 'BinaryExpression',
                operator: '<',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Literal',
                    value: 42
                }
            },
            update: {
                type: 'UpdateExpression',
                operator: '++',
                argument: {
                    type: 'Identifier',
                    name: 'x'
                },
                prefix: false
            },
            body: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'process'
                    },
                    'arguments': [{
                        type: 'Identifier',
                        name: 'x'
                    }]
                }
            }
        },

        'for(x in list) process(x);': {
            type: 'ForInStatement',
            left: {
                type: 'Identifier',
                name: 'x'
            },
            right: {
                type: 'Identifier',
                name: 'list'
            },
            body: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'process'
                    },
                    'arguments': [{
                        type: 'Identifier',
                        name: 'x'
                    }]
                }
            }
        },

        'for (var x in list) process(x);': {
            type: 'ForInStatement',
            left: {
                id: {
                    type: 'Identifier',
                    name: 'x'
                },
                init: null
            },
            right: {
                type: 'Identifier',
                name: 'list'
            },
            body: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'process'
                    },
                    'arguments': [{
                        type: 'Identifier',
                        name: 'x'
                    }]
                }
            }
        }

    },

    'continue statement': {

        'continue': {
            type: 'ContinueStatement',
            label: null
        },

        'continue done': {
            type: 'ContinueStatement',
            label: {
                type: 'Identifier',
                name: 'done'
            }
        },

        'continue done;': {
            type: 'ContinueStatement',
            label: {
                type: 'Identifier',
                name: 'done'
            }
        }

    },

    'break statement': {

        'break': {
            type: 'BreakStatement',
            label: null
        },

        'break done': {
            type: 'BreakStatement',
            label: {
                type: 'Identifier',
                name: 'done'
            }
        },

        'break done;': {
            type: 'BreakStatement',
            label: {
                type: 'Identifier',
                name: 'done'
            }
        }

    },

    'return statement': {

        'return': {
            type: 'ReturnStatement',
            argument: null
        },

        'return;': {
            type: 'ReturnStatement',
            argument: null
        },

        'return x;': {
            type: 'ReturnStatement',
            argument: {
                type: 'Identifier',
                name: 'x'
            }
        },

        'return x * y': {
            type: 'ReturnStatement',
            argument: {
                type: 'BinaryExpression',
                operator: '*',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        }

    },

    'with statement': {

        'with (x) foo = bar': {
            type: 'WithStatement',
            object: {
                type: 'Identifier',
                name: 'x'
            },
            body: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'AssignmentExpression',
                    operator: '=',
                    left: {
                        type: 'Identifier',
                        name: 'foo'
                    },
                    right: {
                        type: 'Identifier',
                        name: 'bar'
                    }
                }
            }
        },

        'with (x) foo = bar;': {
            type: 'WithStatement',
            object: {
                type: 'Identifier',
                name: 'x'
            },
            body: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'AssignmentExpression',
                    operator: '=',
                    left: {
                        type: 'Identifier',
                        name: 'foo'
                    },
                    right: {
                        type: 'Identifier',
                        name: 'bar'
                    }
                }
            }
        },

        'with (x) { foo = bar }': {
            type: 'WithStatement',
            object: {
                type: 'Identifier',
                name: 'x'
            },
            body: {
                type: 'BlockStatement',
                body: [{
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'AssignmentExpression',
                        operator: '=',
                        left: {
                            type: 'Identifier',
                            name: 'foo'
                        },
                        right: {
                            type: 'Identifier',
                            name: 'bar'
                        }
                    }
                }]
            }
        }

    },

    'switch statement': {

        'switch (x) {}': {
            type: 'SwitchStatement',
            discriminant: {
                type: 'Identifier',
                name: 'x'
            }
        },

        'switch (answer) { case 42: hi(); break; }': {
            type: 'SwitchStatement',
            discriminant: {
                type: 'Identifier',
                name: 'answer'
            },
            cases: [{
                type: 'SwitchCase',
                test: {
                    type: 'Literal',
                    value: 42
                },
                consequent: [{
                    type: 'BlockStatement',
                    body: [{
                        type: 'ExpressionStatement',
                        expression: {
                            type: 'CallExpression',
                            callee: {
                                type: 'Identifier',
                                name: 'hi'
                            },
                            'arguments': []
                        }
                    }, {
                        type: 'BreakStatement',
                        label: null
                    }]
                }]
            }]
        },

        'switch (answer) { case 42: hi(); break; default: break }': {
            type: 'SwitchStatement',
            discriminant: {
                type: 'Identifier',
                name: 'answer'
            },
            cases: [{
                type: 'SwitchCase',
                test: {
                    type: 'Literal',
                    value: 42
                },
                consequent: [{
                    type: 'BlockStatement',
                    body: [{
                        type: 'ExpressionStatement',
                        expression: {
                            type: 'CallExpression',
                            callee: {
                                type: 'Identifier',
                                name: 'hi'
                            },
                            'arguments': []
                        }
                    }, {
                        type: 'BreakStatement',
                        label: null
                    }]
                }]
            }, {
                type: 'SwitchCase',
                test: null,
                consequent: [{
                    type: 'BlockStatement',
                    body: [{
                        type: 'BreakStatement',
                        label: null
                    }]
                }]
            }]
        }

    },

    'Labelled Statements': {

        'start: for (;;) break start': {
            type: 'LabeledStatement',
            label: {
                type: 'Identifier',
                name: 'start'
            },
            body: {
                type: 'ForStatement',
                init: null,
                test: null,
                update: null,
                body: {
                    type: 'BreakStatement',
                    label: {
                        type: 'Identifier',
                        name: 'start'
                    }
                }
            }
        },

        'start: while (true) break start': {
            type: 'LabeledStatement',
            label: {
                type: 'Identifier',
                name: 'start'
            },
            body: {
                type: 'WhileStatement',
                test: {
                    type: 'Literal',
                    value: true
                },
                body: {
                    type: 'BreakStatement',
                    label: {
                        type: 'Identifier',
                        name: 'start'
                    }
                }
            }
        }

    },

    'throw statement': {

        'throw': {
            type: 'ThrowStatement',
            argument: null
        },

        'throw;': {
            type: 'ThrowStatement',
            argument: null
        },

        'throw x;': {
            type: 'ThrowStatement',
            argument: {
                type: 'Identifier',
                name: 'x'
            }
        },

        'throw x * y': {
            type: 'ThrowStatement',
            argument: {
                type: 'BinaryExpression',
                operator: '*',
                left: {
                    type: 'Identifier',
                    name: 'x'
                },
                right: {
                    type: 'Identifier',
                    name: 'y'
                }
            }
        },

        'throw { message: "Error" }': {
            type: 'ThrowStatement',
            argument: {
                type: 'ObjectExpression',
                properties: [{
                    key: {
                        type: 'Identifier',
                        name: 'message'
                    },
                    value: {
                        type: 'Literal',
                        value: 'Error'
                    }
                }]
            }
        }

    },

    'try statement': {

        'try { } catch (e) { }': {
            type: 'TryStatement',
            block: {
                type: 'BlockStatement',
                body: []
            },
            handler: {
                type: 'BlockStatement',
                body: [],
                guard: {
                    type: 'Identifier',
                    name: 'e'
                }
            },
            finalizer: null
        },

        'try { } catch (e) { say(e) }': {
            type: 'TryStatement',
            block: {
                type: 'BlockStatement',
                body: []
            },
            handler: {
                type: 'BlockStatement',
                body: [{
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'CallExpression',
                        callee: {
                            type: 'Identifier',
                            name: 'say'
                        },
                        'arguments': [{
                            type: 'Identifier',
                            name: 'e'
                        }]
                    }
                }],
                guard: {
                    type: 'Identifier',
                    name: 'e'
                }
            },
            finalizer: null
        },

        'try { } finally { cleanup(stuff) }': {
            type: 'TryStatement',
            block: {
                type: 'BlockStatement',
                body: []
            },
            handler: null,
            finalizer: {
                type: 'BlockStatement',
                body: [{
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'CallExpression',
                        callee: {
                            type: 'Identifier',
                            name: 'cleanup'
                        },
                        'arguments': [{
                            type: 'Identifier',
                            name: 'stuff'
                        }]
                    }
                }]
            }
        },

        'try { doThat(); } catch (e) { say(e) }': {
            type: 'TryStatement',
            block: {
                type: 'BlockStatement',
                body: [{
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'CallExpression',
                        callee: {
                            type: 'Identifier',
                            name: 'doThat'
                        },
                        'arguments': []
                    }
                }]
            },
            handler: {
                type: 'BlockStatement',
                body: [{
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'CallExpression',
                        callee: {
                            type: 'Identifier',
                            name: 'say'
                        },
                        'arguments': [{
                            type: 'Identifier',
                            name: 'e'
                        }]
                    }
                }],
                guard: {
                    type: 'Identifier',
                    name: 'e'
                }
            },
            finalizer: null
        },

        'try { doThat(); } catch (e) { say(e) } finally { cleanup(stuff) }': {
            type: 'TryStatement',
            block: {
                type: 'BlockStatement',
                body: [{
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'CallExpression',
                        callee: {
                            type: 'Identifier',
                            name: 'doThat'
                        },
                        'arguments': []
                    }
                }]
            },
            handler: {
                type: 'BlockStatement',
                body: [{
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'CallExpression',
                        callee: {
                            type: 'Identifier',
                            name: 'say'
                        },
                        'arguments': [{
                            type: 'Identifier',
                            name: 'e'
                        }]
                    }
                }],
                guard: {
                    type: 'Identifier',
                    name: 'e'
                }
            },
            finalizer: {
                type: 'BlockStatement',
                body: [{
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'CallExpression',
                        callee: {
                            type: 'Identifier',
                            name: 'cleanup'
                        },
                        'arguments': [{
                            type: 'Identifier',
                            name: 'stuff'
                        }]
                    }
                }]
            }

        }

    },

    'debugger statement': {

        'debugger;': {
            type: 'DebuggerStatement'
        }

    },

    'Function Definition': {

        'function hello() { sayHi(); }': {
            type: 'FunctionDeclaration',
            id: {
                type: 'Identifier',
                name: 'hello'
            },
            params: [],
            body: {
                type: 'BlockStatement',
                body: [{
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'CallExpression',
                        callee: {
                            type: 'Identifier',
                            name: 'sayHi'
                        },
                        'arguments': []
                    }
                }]
            }
        },

        'function hello(a) { sayHi(); }': {
            type: 'FunctionDeclaration',
            id: {
                type: 'Identifier',
                name: 'hello'
            },
            params: [{
                type: 'Identifier',
                name: 'a'
            }],
            body: {
                type: 'BlockStatement',
                body: [{
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'CallExpression',
                        callee: {
                            type: 'Identifier',
                            name: 'sayHi'
                        },
                        'arguments': []
                    }
                }]
            }
        },

        'function hello(a, b) { sayHi(); }': {
            type: 'FunctionDeclaration',
            id: {
                type: 'Identifier',
                name: 'hello'
            },
            params: [{
                type: 'Identifier',
                name: 'a'
            }, {
                type: 'Identifier',
                name: 'b'
            }],
            body: {
                type: 'BlockStatement',
                body: [{
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'CallExpression',
                        callee: {
                            type: 'Identifier',
                            name: 'sayHi'
                        },
                        'arguments': []
                    }
                }]
            }
        },

        'var hi = function() { sayHi() };': {
            type: 'VariableDeclaration',
            declarations: [{
                id: {
                    type: 'Identifier',
                    name: 'hi'
                },
                init: {
                    type: 'FunctionExpression',
                    id: null,
                    params: [],
                    body: {
                        type: 'BlockStatement',
                        body: [{
                            type: 'ExpressionStatement',
                            expression: {
                                type: 'CallExpression',
                                callee: {
                                    type: 'Identifier',
                                    name: 'sayHi'
                                },
                                'arguments': []
                            }
                        }]
                    }
                }
            }],
            kind: 'var'
        },

        'var hello = function hi() { sayHi() };': {
            type: 'VariableDeclaration',
            declarations: [{
                id: {
                    type: 'Identifier',
                    name: 'hello'
                },
                init: {
                    type: 'FunctionExpression',
                    id: {
                        type: 'Identifier',
                        name: 'hi'
                    },
                    params: [],
                    body: {
                        type: 'BlockStatement',
                        body: [{
                            type: 'ExpressionStatement',
                            expression: {
                                type: 'CallExpression',
                                callee: {
                                    type: 'Identifier',
                                    name: 'sayHi'
                                },
                                'arguments': []
                            }
                        }]
                    }
                }
            }],
            kind: 'var'
        }
    }
};

if (typeof window !== 'undefined') {
    // Run all tests in a browser environment.
    runTests = function () {
        'use strict';
        var total = 0,
            failures = 0,
            category,
            fixture,
            source,
            tick;

        function startCategory(category) {
            var report, e;
            report = document.getElementById('report');
            e = document.createElement('h4');
            e.textContent = category;
            report.appendChild(e);
        }

        function reportSuccess(code) {
            var report, e;
            report = document.getElementById('report');
            e = document.createElement('pre');
            e.setAttribute('class', 'code');
            e.textContent = code;
            report.appendChild(e);
        }

        function reportFailure(code, expected, actual) {
            var report, e;

            failures += 1;

            report = document.getElementById('report');

            e = document.createElement('p');
            e.textContent = 'Code:';
            report.appendChild(e);

            e = document.createElement('pre');
            e.setAttribute('class', 'code');
            e.textContent = code;
            report.appendChild(e);

            e = document.createElement('p');
            e.textContent = 'Expected';
            report.appendChild(e);

            e = document.createElement('pre');
            e.setAttribute('class', 'expected');
            e.textContent = expected;
            report.appendChild(e);

            e = document.createElement('p');
            e.textContent = 'Actual';
            report.appendChild(e);

            e = document.createElement('pre');
            e.setAttribute('class', 'actual');
            e.textContent = actual;
            report.appendChild(e);
        }

        function runTest(code, syntax) {
            var expected, tree, actual;

            expected = JSON.stringify(syntax, null, 4);
            try {
                tree = esprima.parse(code);
                tree = tree.body[0];
                actual = JSON.stringify(tree, null, 4);

                total += 1;
                if (expected === actual) {
                    reportSuccess(code);
                } else {
                    reportFailure(code, expected, actual);
                }
            } catch (e) {
                reportFailure(code, expected, JSON.stringify(e));
            }
        }

        document.getElementById('version').textContent = esprima.version;

        tick = new Date();
        for (category in data) {
            if (data.hasOwnProperty(category)) {
                startCategory(category);
                fixture = data[category];
                for (source in fixture) {
                    if (fixture.hasOwnProperty(source)) {
                        runTest(source, fixture[source]);
                    }
                }
            }
        }
        tick = (new Date()) - tick;

        if (failures > 0) {
            document.getElementById('status').textContent = total + ' tests. ' +
                'Failures: ' + failures + '. ' + tick + ' ms';
        } else {
            document.getElementById('status').textContent = total + ' tests. ' +
                'No failure. ' + tick + ' ms';
        }
    };
} else {
    // TODO: Run all tests in another environment.
    runTests = function () {
        'use strict';
    };
}
