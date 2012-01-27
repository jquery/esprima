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

/*jslint browser:true node:true */
/*global esprima:true */

var runTests, data;

data = {

    'Primary Expression': {

        'this\n': {
            type: 'Program',
            body: [{
                type: 'ExpressionStatement',
                expression: {
                    type: 'ThisExpression',
                    range: [0, 3]
                },
                range: [0, 4]
            }],
            range: [0, 4],
            tokens: [{
                type: 'Keyword',
                value: 'this',
                range: [0, 3]
            }]
        },

        '\n    42\n\n': {
            type: 'Program',
            body: [{
                type: 'ExpressionStatement',
                expression: {
                    type: 'Literal',
                    value: 42,
                    range: [5, 6]
                },
                range: [5, 8]
            }],
            range: [5, 8],
            tokens: [{
                type: 'Numeric',
                value: '42',
                range: [5, 6]
            }]
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
                        value: 1,
                        range: [1, 1]
                    },
                    right: {
                        type: 'Literal',
                        value: 2,
                        range: [5, 5]
                    },
                    range: [0, 7]
                },
                right: {
                    type: 'Literal',
                    value: 3,
                    range: [11, 11]
                },
                range: [0, 11]
            },
            range: [0, 11]
        }

    },

    'Array Initializer': {

        'x = []': {
            type: 'Program',
            body: [{
                type: 'ExpressionStatement',
                expression: {
                    type: 'AssignmentExpression',
                    operator: '=',
                    left: {
                        type: 'Identifier',
                        name: 'x',
                        range: [0, 0]
                    },
                    right: {
                        type: 'ArrayExpression',
                        elements: [],
                        range: [4, 5]
                    },
                    range: [0, 5]
                },
                range: [0, 5]
            }],
            range: [0, 5],
            tokens: [{
                type: 'Identifier',
                value: 'x',
                range: [0, 0]
            }, {
                type: 'Punctuator',
                value: '=',
                range: [2, 2]
            }, {
                type: 'Punctuator',
                value: '[',
                range: [4, 4]
            }, {
                type: 'Punctuator',
                value: ']',
                range: [5, 5]
            }]
        },

        'x = [ ]': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ArrayExpression',
                    elements: [],
                    range: [4, 6]
                },
                range: [0, 6]
            },
            range: [0, 6]
        },

        'x = [ 42 ]': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ArrayExpression',
                    elements: [{
                        type: 'Literal',
                        value: 42,
                        range: [6, 7]
                    }],
                    range: [4, 9]
                },
                range: [0, 9]
            },
            range: [0, 9]
        },

        'x = [ 42, ]': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ArrayExpression',
                    elements: [{
                        type: 'Literal',
                        value: 42,
                        range: [6, 7]
                    }],
                    range: [4, 10]
                },
                range: [0, 10]
            },
            range: [0, 10]
        },

        'x = [ ,, 42 ]': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ArrayExpression',
                    elements: [
                        null,
                        null,
                        {
                            type: 'Literal',
                            value: 42,
                            range: [9, 10]
                        }],
                    range: [4, 12]
                },
                range: [0, 12]
            },
            range: [0, 12]
        },

        'x = [ 1, 2, 3, ]': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ArrayExpression',
                    elements: [{
                        type: 'Literal',
                        value: 1,
                        range: [6, 6]
                    }, {
                        type: 'Literal',
                        value: 2,
                        range: [9, 9]
                    }, {
                        type: 'Literal',
                        value: 3,
                        range: [12, 12]
                    }],
                    range: [4, 15]
                },
                range: [0, 15]
            },
            range: [0, 15]
        },

        'x = [ 1, 2,, 3, ]': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ArrayExpression',
                    elements: [{
                        type: 'Literal',
                        value: 1,
                        range: [6, 6]
                    }, {
                        type: 'Literal',
                        value: 2,
                        range: [9, 9]
                    }, null, {
                        type: 'Literal',
                        value: 3,
                        range: [13, 13]
                    }],
                    range: [4, 16]
                },
                range: [0, 16]
            },
            range: [0, 16]
        },

        '日本語 = []': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: '日本語',
                    range: [0, 2]
                },
                right: {
                    type: 'ArrayExpression',
                    elements: [],
                    range: [6, 7]
                },
                range: [0, 7]
            },
            range: [0, 7]
        },

        'T\u203F = []': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'T\u203F',
                    range: [0, 1]
                },
                right: {
                    type: 'ArrayExpression',
                    elements: [],
                    range: [5, 6]
                },
                range: [0, 6]
            },
            range: [0, 6]
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
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [],
                    range: [4, 5]
                },
                range: [0, 5]
            },
            range: [0, 5]
        },

        'x = { }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [],
                    range: [4, 6]
                },
                range: [0, 6]
            },
            range: [0, 6]
        },

        'x = { answer: 42 }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
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
                            value: 42,
                            range: [14, 15]
                        }
                    }],
                    range: [4, 17]
                },
                range: [0, 17]
            },
            range: [0, 17]
        },

        'x = { if: 42 }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Identifier',
                            name: 'if'
                        },
                        value: {
                            type: 'Literal',
                            value: 42,
                            range: [10, 11]
                        }
                    }],
                    range: [4, 13]
                },
                range: [0, 13]
            },
            range: [0, 13]
        },

        'x = { true: 42 }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Identifier',
                            name: 'true'
                        },
                        value: {
                            type: 'Literal',
                            value: 42,
                            range: [12, 13]
                        }
                    }],
                    range: [4, 15]
                },
                range: [0, 15]
            },
            range: [0, 15]
        },

        'x = { false: 42 }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Identifier',
                            name: 'false'
                        },
                        value: {
                            type: 'Literal',
                            value: 42,
                            range: [13, 14]
                        }
                    }],
                    range: [4, 16]
                },
                range: [0, 16]
            },
            range: [0, 16]
        },

        'x = { null: 42 }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Identifier',
                            name: 'null'
                        },
                        value: {
                            type: 'Literal',
                            value: 42,
                            range: [12, 13]
                        }
                    }],
                    range: [4, 15]
                },
                range: [0, 15]
            },
            range: [0, 15]
        },

        'x = { "answer": 42 }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
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
                            value: 42,
                            range: [16, 17]
                        }
                    }],
                    range: [4, 19]
                },
                range: [0, 19]
            },
            range: [0, 19]
        },

        'x = { get width() { return m_width } }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Identifier',
                            name: 'width'
                        },
                        value: {
                            type: 'FunctionExpression',
                            id: null,
                            params: [],
                            body: {
                                type: 'BlockStatement',
                                body: [{
                                    type: 'ReturnStatement',
                                    argument: {
                                        type: 'Identifier',
                                        name: 'm_width',
                                        range: [27, 33]
                                    },
                                    range: [20, 34]
                                }],
                                range: [18, 35]
                            }
                        },
                        kind: 'get'
                    }],
                    range: [4, 37]
                },
                range: [0, 37]
            },
            range: [0, 37]
        },

        'x = { get undef() {} }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Identifier',
                            name: 'undef'
                        },
                        value: {
                            type: 'FunctionExpression',
                            id: null,
                            params: [],
                            body: {
                                type: 'BlockStatement',
                                body: [],
                                range: [18, 19]
                            }
                        },
                        kind: 'get'
                    }],
                    range: [4, 21]
                },
                range: [0, 21]
            },
            range: [0, 21]
        },

        'x = { get if() {} }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Identifier',
                            name: 'if'
                        },
                        value: {
                            type: 'FunctionExpression',
                            id: null,
                            params: [],
                            body: {
                                type: 'BlockStatement',
                                body: [],
                                range: [15, 16]
                            }
                        },
                        kind: 'get'
                    }],
                    range: [4, 18]
                },
                range: [0, 18]
            },
            range: [0, 18]
        },

        'x = { get true() {} }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Identifier',
                            name: 'true'
                        },
                        value: {
                            type: 'FunctionExpression',
                            id: null,
                            params: [],
                            body: {
                                type: 'BlockStatement',
                                body: [],
                                range: [17, 18]
                            }
                        },
                        kind: 'get'
                    }],
                    range: [4, 20]
                },
                range: [0, 20]
            },
            range: [0, 20]
        },

        'x = { get false() {} }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Identifier',
                            name: 'false'
                        },
                        value: {
                            type: 'FunctionExpression',
                            id: null,
                            params: [],
                            body: {
                                type: 'BlockStatement',
                                body: [],
                                range: [18, 19]
                            }
                        },
                        kind: 'get'
                    }],
                    range: [4, 21]
                },
                range: [0, 21]
            },
            range: [0, 21]
        },

        'x = { get null() {} }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Identifier',
                            name: 'null'
                        },
                        value: {
                            type: 'FunctionExpression',
                            id: null,
                            params: [],
                            body: {
                                type: 'BlockStatement',
                                body: [],
                                range: [17, 18]
                            }
                        },
                        kind: 'get'
                    }],
                    range: [4, 20]
                },
                range: [0, 20]
            },
            range: [0, 20]
        },

        'x = { get "undef"() {} }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Literal',
                            value: 'undef'
                        },
                        value: {
                            type: 'FunctionExpression',
                            id: null,
                            params: [],
                            body: {
                                type: 'BlockStatement',
                                body: [],
                                range: [20, 21]
                            }
                        },
                        kind: 'get'
                    }],
                    range: [4, 23]
                },
                range: [0, 23]
            },
            range: [0, 23]
        },

        'x = { get 10() {} }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Literal',
                            value: 10
                        },
                        value: {
                            type: 'FunctionExpression',
                            id: null,
                            params: [],
                            body: {
                                type: 'BlockStatement',
                                body: [],
                                range: [15, 16]
                            }
                        },
                        kind: 'get'
                    }],
                    range: [4, 18]
                },
                range: [0, 18]
            },
            range: [0, 18]
        },

        'x = { set width(w) { m_width = w } }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Identifier',
                            name: 'width'
                        },
                        value: {
                            type: 'FunctionExpression',
                            id: null,
                            params: [{
                                type: 'Identifier',
                                name: 'w'
                            }],
                            body: {
                                type: 'BlockStatement',
                                body: [{
                                    type: 'ExpressionStatement',
                                    expression: {
                                        type: 'AssignmentExpression',
                                        operator: '=',
                                        left: {
                                            type: 'Identifier',
                                            name: 'm_width',
                                            range: [21, 27]
                                        },
                                        right: {
                                            type: 'Identifier',
                                            name: 'w',
                                            range: [31, 31]
                                        },
                                        range: [21, 31]
                                    },
                                    range: [21, 32]
                                }],
                                range: [19, 33]
                            }
                        },
                        kind: 'set'
                    }],
                    range: [4, 35]
                },
                range: [0, 35]
            },
            range: [0, 35]
        },

        'x = { set if(w) { m_if = w } }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Identifier',
                            name: 'if'
                        },
                        value: {
                            type: 'FunctionExpression',
                            id: null,
                            params: [{
                                type: 'Identifier',
                                name: 'w'
                            }],
                            body: {
                                type: 'BlockStatement',
                                body: [{
                                    type: 'ExpressionStatement',
                                    expression: {
                                        type: 'AssignmentExpression',
                                        operator: '=',
                                        left: {
                                            type: 'Identifier',
                                            name: 'm_if',
                                            range: [18, 21]
                                        },
                                        right: {
                                            type: 'Identifier',
                                            name: 'w',
                                            range: [25, 25]
                                        },
                                        range: [18, 25]
                                    },
                                    range: [18, 26]
                                }],
                                range: [16, 27]
                            }
                        },
                        kind: 'set'
                    }],
                    range: [4, 29]
                },
                range: [0, 29]
            },
            range: [0, 29]
        },

        'x = { set true(w) { m_true = w } }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Identifier',
                            name: 'true'
                        },
                        value: {
                            type: 'FunctionExpression',
                            id: null,
                            params: [{
                                type: 'Identifier',
                                name: 'w'
                            }],
                            body: {
                                type: 'BlockStatement',
                                body: [{
                                    type: 'ExpressionStatement',
                                    expression: {
                                        type: 'AssignmentExpression',
                                        operator: '=',
                                        left: {
                                            type: 'Identifier',
                                            name: 'm_true',
                                            range: [20, 25]
                                        },
                                        right: {
                                            type: 'Identifier',
                                            name: 'w',
                                            range: [29, 29]
                                        },
                                        range: [20, 29]
                                    },
                                    range: [20, 30]
                                }],
                                range: [18, 31]
                            }
                        },
                        kind: 'set'
                    }],
                    range: [4, 33]
                },
                range: [0, 33]
            },
            range: [0, 33]
        },

        'x = { set false(w) { m_false = w } }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Identifier',
                            name: 'false'
                        },
                        value: {
                            type: 'FunctionExpression',
                            id: null,
                            params: [{
                                type: 'Identifier',
                                name: 'w'
                            }],
                            body: {
                                type: 'BlockStatement',
                                body: [{
                                    type: 'ExpressionStatement',
                                    expression: {
                                        type: 'AssignmentExpression',
                                        operator: '=',
                                        left: {
                                            type: 'Identifier',
                                            name: 'm_false',
                                            range: [21, 27]
                                        },
                                        right: {
                                            type: 'Identifier',
                                            name: 'w',
                                            range: [31, 31]
                                        },
                                        range: [21, 31]
                                    },
                                    range: [21, 32]
                                }],
                                range: [19, 33]
                            }
                        },
                        kind: 'set'
                    }],
                    range: [4, 35]
                },
                range: [0, 35]
            },
            range: [0, 35]
        },

        'x = { set null(w) { m_null = w } }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Identifier',
                            name: 'null'
                        },
                        value: {
                            type: 'FunctionExpression',
                            id: null,
                            params: [{
                                type: 'Identifier',
                                name: 'w'
                            }],
                            body: {
                                type: 'BlockStatement',
                                body: [{
                                    type: 'ExpressionStatement',
                                    expression: {
                                        type: 'AssignmentExpression',
                                        operator: '=',
                                        left: {
                                            type: 'Identifier',
                                            name: 'm_null',
                                            range: [20, 25]
                                        },
                                        right: {
                                            type: 'Identifier',
                                            name: 'w',
                                            range: [29, 29]
                                        },
                                        range: [20, 29]
                                    },
                                    range: [20, 30]
                                }],
                                range: [18, 31]
                            }
                        },
                        kind: 'set'
                    }],
                    range: [4, 33]
                },
                range: [0, 33]
            },
            range: [0, 33]
        },

        'x = { set "null"(w) { m_null = w } }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Literal',
                            value: 'null'
                        },
                        value: {
                            type: 'FunctionExpression',
                            id: null,
                            params: [{
                                type: 'Identifier',
                                name: 'w'
                            }],
                            body: {
                                type: 'BlockStatement',
                                body: [{
                                    type: 'ExpressionStatement',
                                    expression: {
                                        type: 'AssignmentExpression',
                                        operator: '=',
                                        left: {
                                            type: 'Identifier',
                                            name: 'm_null',
                                            range: [22, 27]
                                        },
                                        right: {
                                            type: 'Identifier',
                                            name: 'w',
                                            range: [31, 31]
                                        },
                                        range: [22, 31]
                                    },
                                    range: [22, 32]
                                }],
                                range: [20, 33]
                            }
                        },
                        kind: 'set'
                    }],
                    range: [4, 35]
                },
                range: [0, 35]
            },
            range: [0, 35]
        },

        'x = { set 10(w) { m_null = w } }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Literal',
                            value: 10
                        },
                        value: {
                            type: 'FunctionExpression',
                            id: null,
                            params: [{
                                type: 'Identifier',
                                name: 'w'
                            }],
                            body: {
                                type: 'BlockStatement',
                                body: [{
                                    type: 'ExpressionStatement',
                                    expression: {
                                        type: 'AssignmentExpression',
                                        operator: '=',
                                        left: {
                                            type: 'Identifier',
                                            name: 'm_null',
                                            range: [18, 23]
                                        },
                                        right: {
                                            type: 'Identifier',
                                            name: 'w',
                                            range: [27, 27]
                                        },
                                        range: [18, 27]
                                    },
                                    range: [18, 28]
                                }],
                                range: [16, 29]
                            }
                        },
                        kind: 'set'
                    }],
                    range: [4, 31]
                },
                range: [0, 31]
            },
            range: [0, 31]
        },

        'x = { get: 42 }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Identifier',
                            name: 'get'
                        },
                        value: {
                            type: 'Literal',
                            value: 42,
                            range: [11, 12]
                        }
                    }],
                    range: [4, 14]
                },
                range: [0, 14]
            },
            range: [0, 14]
        },

        'x = { set: 43 }': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [{
                        key: {
                            type: 'Identifier',
                            name: 'set'
                        },
                        value: {
                            type: 'Literal',
                            value: 43,
                            range: [11, 12]
                        }
                    }],
                    range: [4, 14]
                },
                range: [0, 14]
            },
            range: [0, 14]
        }

    },

    'Comments': {

        '/* block comment */ 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 42,
                range: [20, 21]
            },
            range: [20, 21]
        },

        '42 /*The*/ /*Answer*/': {
            type: 'Program',
            body: [{
                type: 'ExpressionStatement',
                expression: {
                    type: 'Literal',
                    value: 42,
                    range: [0, 1]
                },
                range: [0, 20]
            }],
            range: [0, 20],
            comments: [{
                range: [3, 9],
                type: 'Block',
                value: 'The'
            }, {
                range: [11, 20],
                type: 'Block',
                value: 'Answer'
            }]
        },

        '/* multiline\ncomment\nshould\nbe\nignored */ 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 42,
                range: [42, 43]
            },
            range: [42, 43]
        },

        '// line comment\n42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 42,
                range: [16, 17]
            },
            range: [16, 17]
        },

        '// Hello, world!\n42': {
            type: 'Program',
            body: [{
                type: 'ExpressionStatement',
                expression: {
                    type: 'Literal',
                    value: 42,
                    range: [17, 18]
                },
                range: [17, 18]
            }],
            range: [17, 18],
            comments: [{
                range: [0, 16],
                type: 'Line',
                value: ' Hello, world!'
            }]
        },

        '// Hello, world!\n\n//   Another hello\n42': {
            type: 'Program',
            body: [{
                type: 'ExpressionStatement',
                expression: {
                    type: 'Literal',
                    value: 42,
                    range: [37, 38]
                },
                range: [37, 38]
            }],
            range: [37, 38],
            comments: [{
                range: [0, 16],
                type: 'Line',
                value: ' Hello, world!'
            }, {
                range: [18, 36],
                type: 'Line',
                value: '   Another hello'
            }]
        },

        'if (x) { // Some comment\ndoThat(); }': {
            type: 'Program',
            body: [{
                type: 'IfStatement',
                test: {
                    type: 'Identifier',
                    name: 'x',
                    range: [4, 4]
                },
                consequent: {
                    type: 'BlockStatement',
                    body: [{
                        type: 'ExpressionStatement',
                        expression: {
                            type: 'CallExpression',
                            callee: {
                                type: 'Identifier',
                                name: 'doThat',
                                range: [25, 30]
                            },
                            'arguments': [],
                            range: [25, 32]
                        },
                        range: [25, 33]
                    }],
                    range: [7, 35]
                },
                alternate: null,
                range: [0, 35]
            }],
            range: [0, 35],
            comments: [{
                range: [9, 24],
                type: 'Line',
                value: ' Some comment'
            }]
        },

        'switch (answer) { case 42: /* perfect */ bingo() }': {
            type: 'Program',
            body: [{
                type: 'SwitchStatement',
                discriminant: {
                    type: 'Identifier',
                    name: 'answer',
                    range: [8, 13]
                },
                cases: [{
                    type: 'SwitchCase',
                    test: {
                        type: 'Literal',
                        value: 42,
                        range: [23, 24]
                    },
                    consequent: [{
                        type: 'ExpressionStatement',
                        expression: {
                            type: 'CallExpression',
                            callee: {
                                type: 'Identifier',
                                name: 'bingo',
                                range: [41, 45]
                            },
                            'arguments': [],
                            range: [41, 47]
                        },
                        range: [41, 48]
                    }]
                }],
                range: [0, 49]
            }],
            range: [0, 49],
            comments: [{
                range: [27, 39],
                type: 'Block',
                value: ' perfect '
            }]
        }

    },

    'Numeric Literals': {

        '0': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 0,
                range: [0, 0]
            },
            range: [0, 0]
        },

        '42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 42,
                range: [0, 1]
            },
            range: [0, 1]
        },

        '.14': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 0.14,
                range: [0, 2]
            },
            range: [0, 2]
        },

        '3.14159': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 3.14159,
                range: [0, 6]
            },
            range: [0, 6]
        },

        '6.02214179e+23': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 6.02214179e+23,
                range: [0, 13]
            },
            range: [0, 13]
        },

        '1.492417830e-10': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 1.492417830e-10,
                range: [0, 14]
            },
            range: [0, 14]
        },

        '0x0': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 0,
                range: [0, 2]
            },
            range: [0, 2]
        },

        '0xabc': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 0xabc,
                range: [0, 4]
            },
            range: [0, 4]
        },

        '0xdef': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 0xdef,
                range: [0, 4]
            },
            range: [0, 4]
        },

        '0X1A': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 0x1A,
                range: [0, 3]
            },
            range: [0, 3]
        },

        '0x10': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 0x10,
                range: [0, 3]
            },
            range: [0, 3]
        },

        '0x100': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 0x100,
                range: [0, 4]
            },
            range: [0, 4]
        },

        '0X04': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 0X04,
                range: [0, 3]
            },
            range: [0, 3]
        }

    },

    'String Literals': {

        '"Hello"': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 'Hello',
                range: [0, 6]
            },
            range: [0, 6]
        },

        '"Hello\nworld"': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 'Hello\nworld',
                range: [0, 12]
            },
            range: [0, 12]
        }

    },

    'Regular Expression Literals': {

        'var x = /[a-z]/i': {
            type: 'Program',
            body: [{
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: {
                        type: 'Literal',
                        value: '/[a-z]/i',
                        range: [8, 15]
                    }
                }],
                kind: 'var',
                range: [0, 15]
            }],
            range: [0, 15],
            tokens: [{
                type: 'Keyword',
                value: 'var',
                range: [0, 2]
            }, {
                type: 'Identifier',
                value: 'x',
                range: [4, 4]
            }, {
                type: 'Punctuator',
                value: '=',
                range: [6, 6]
            }, {
                type: 'RegularExpression',
                value: '/[a-z]/i',
                range: [8, 15]
            }]
        },

        'var x = /[P QR]/i': {
            type: 'Program',
            body: [{
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: {
                        type: 'Literal',
                        value: '/[P QR]/i',
                        range: [8, 16]
                    }
                }],
                kind: 'var',
                range: [0, 16]
            }],
            range: [0, 16],
            tokens: [{
                type: 'Keyword',
                value: 'var',
                range: [0, 2]
            }, {
                type: 'Identifier',
                value: 'x',
                range: [4, 4]
            }, {
                type: 'Punctuator',
                value: '=',
                range: [6, 6]
            }, {
                type: 'RegularExpression',
                value: '/[P QR]/i',
                range: [8, 16]
            }]
        },

        'var x = /foo\\/bar/': {
            type: 'Program',
            body: [{
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: {
                        type: 'Literal',
                        value: '/foo\\/bar/',
                        range: [8, 17]
                    }
                }],
                kind: 'var',
                range: [0, 17]
            }],
            range: [0, 17],
            tokens: [{
                type: 'Keyword',
                value: 'var',
                range: [0, 2]
            }, {
                type: 'Identifier',
                value: 'x',
                range: [4, 4]
            }, {
                type: 'Punctuator',
                value: '=',
                range: [6, 6]
            }, {
                type: 'RegularExpression',
                value: '/foo\\/bar/',
                range: [8, 17]
            }]
        },

        'var x = /=([^=\\s])+/g': {
            type: 'Program',
            body: [{
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: {
                        type: 'Literal',
                        value: '/=([^=\\s])+/g',
                        range: [8, 20]
                    }
                }],
                kind: 'var',
                range: [0, 20]
            }],
            range: [0, 20],
            tokens: [{
                type: 'Keyword',
                value: 'var',
                range: [0, 2]
            }, {
                type: 'Identifier',
                value: 'x',
                range: [4, 4]
            }, {
                type: 'Punctuator',
                value: '=',
                range: [6, 6]
            }, {
                type: 'RegularExpression',
                value: '/=([^=\\s])+/g',
                range: [8, 20]
            }]
        }

    },

    'Left-Hand-Side Expression': {

        'new Button': {
            type: 'ExpressionStatement',
            expression: {
                type: 'NewExpression',
                callee: {
                    type: 'Identifier',
                    name: 'Button',
                    range: [4, 9]
                },
                'arguments': [],
                range: [0, 9]
            },
            range: [0, 9]
        },

        'new Button()': {
            type: 'ExpressionStatement',
            expression: {
                type: 'NewExpression',
                callee: {
                    type: 'Identifier',
                    name: 'Button',
                    range: [4, 9]
                },
                'arguments': [],
                range: [0, 11]
            },
            range: [0, 11]
        },

        'new new foo': {
            type: 'ExpressionStatement',
            expression: {
                type: 'NewExpression',
                callee: {
                    type: 'NewExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'foo',
                        range: [8, 10]
                    },
                    'arguments': []
                },
                'arguments': [],
                range: [0, 10]
            },
            range: [0, 10]
        },

        'new new foo()': {
            type: 'ExpressionStatement',
            expression: {
                type: 'NewExpression',
                callee: {
                    type: 'NewExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'foo',
                        range: [8, 10]
                    },
                    'arguments': []
                },
                'arguments': [],
                range: [0, 12]
            },
            range: [0, 12]
        },

        'new foo().bar()': {
            type: 'ExpressionStatement',
            expression: {
                type: 'CallExpression',
                callee: {
                    type: 'MemberExpression',
                    computed: false,
                    object: {
                        type: 'NewExpression',
                        callee: {
                            type: 'Identifier',
                            name: 'foo',
                            range: [4, 6]
                        },
                        'arguments': []
                    },
                    property: {
                        type: 'Identifier',
                        name: 'bar',
                        range: [10, 12]
                    },
                    range: [10, 12]
                },
                'arguments': [],
                range: [0, 14]
            },
            range: [0, 14]
        },

        'new foo.bar()': {
            type: 'ExpressionStatement',
            expression: {
                type: 'NewExpression',
                callee: {
                    type: 'MemberExpression',
                    computed: false,
                    object: {
                        type: 'Identifier',
                        name: 'foo',
                        range: [4, 6]
                    },
                    property: {
                        type: 'Identifier',
                        name: 'bar',
                        range: [8, 10]
                    },
                    range: [4, 10]
                },
                'arguments': [],
                range: [0, 12]
            },
            range: [0, 12]
        },

        'foo(bar, baz)': {
            type: 'ExpressionStatement',
            expression: {
                type: 'CallExpression',
                callee: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [0, 2]
                },
                'arguments': [{
                    type: 'Identifier',
                    name: 'bar',
                    range: [4, 6]
                }, {
                    type: 'Identifier',
                    name: 'baz',
                    range: [9, 11]
                }],
                range: [0, 12]
            },
            range: [0, 12]
        },

        'universe.milkyway': {
            type: 'ExpressionStatement',
            expression: {
                type: 'MemberExpression',
                computed: false,
                object: {
                    type: 'Identifier',
                    name: 'universe',
                    range: [0, 7]
                },
                property: {
                    type: 'Identifier',
                    name: 'milkyway',
                    range: [9, 16]
                },
                range: [0, 16]
            },
            range: [0, 16]
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
                        name: 'universe',
                        range: [0, 7]
                    },
                    property: {
                        type: 'Identifier',
                        name: 'milkyway',
                        range: [9, 16]
                    },
                    range: [0, 16]
                },
                property: {
                    type: 'Identifier',
                    name: 'solarsystem',
                    range: [18, 28]
                },
                range: [0, 28]
            },
            range: [0, 28]
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
                            name: 'universe',
                            range: [0, 7]
                        },
                        property: {
                            type: 'Identifier',
                            name: 'milkyway',
                            range: [9, 16]
                        },
                        range: [0, 16]
                    },
                    property: {
                        type: 'Identifier',
                        name: 'solarsystem',
                        range: [18, 28]
                    },
                    range: [0, 28]
                },
                property: {
                    type: 'Identifier',
                    name: 'Earth',
                    range: [30, 34]
                },
                range: [0, 34]
            },
            range: [0, 34]
        },

        'universe[galaxyName, otherUselessName]': {
            type: 'ExpressionStatement',
            expression: {
                type: 'MemberExpression',
                computed: true,
                object: {
                    type: 'Identifier',
                    name: 'universe',
                    range: [0, 7]
                },
                property: {
                    type: 'SequenceExpression',
                    expressions: [{
                        type: 'Identifier',
                        name: 'galaxyName',
                        range: [9, 18]
                    }, {
                        type: 'Identifier',
                        name: 'otherUselessName',
                        range: [21, 36]
                    }],
                    range: [9, 36]
                },
                range: [0, 37]
            },
            range: [0, 37]
        },

        'universe[galaxyName]': {
            type: 'ExpressionStatement',
            expression: {
                type: 'MemberExpression',
                computed: true,
                object: {
                    type: 'Identifier',
                    name: 'universe',
                    range: [0, 7]
                },
                property: {
                    type: 'Identifier',
                    name: 'galaxyName',
                    range: [9, 18]
                },
                range: [0, 19]
            },
            range: [0, 19]
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
                        name: 'universe',
                        range: [0, 7]
                    },
                    property: {
                        type: 'Literal',
                        value: 42,
                        range: [9, 10]
                    },
                    range: [0, 11]
                },
                property: {
                    type: 'Identifier',
                    name: 'galaxies',
                    range: [13, 20]
                },
                range: [0, 20]
            },
            range: [0, 20]
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
                        name: 'universe',
                        range: [0, 7]
                    },
                    'arguments': [{
                        type: 'Literal',
                        value: 42,
                        range: [9, 10]
                    }],
                    range: [8, 11]
                },
                property: {
                    type: 'Identifier',
                    name: 'galaxies',
                    range: [13, 20]
                },
                range: [8, 20]
            },
            range: [0, 20]
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
                                name: 'universe',
                                range: [0, 7]
                            },
                            'arguments': [{
                                type: 'Literal',
                                value: 42,
                                range: [9, 10]
                            }],
                            range: [8, 11]
                        },
                        property: {
                            type: 'Identifier',
                            name: 'galaxies',
                            range: [13, 20]
                        },
                        range: [8, 20]
                    },
                    'arguments': [{
                        type: 'Literal',
                        value: 14,
                        range: [22, 23]
                    }, {
                        type: 'Literal',
                        value: 3,
                        range: [26, 26]
                    }, {
                        type: 'Literal',
                        value: 77,
                        range: [29, 30]
                    }],
                    range: [21, 31]
                },
                property: {
                    type: 'Identifier',
                    name: 'milkyway',
                    range: [33, 40]
                },
                range: [21, 40]
            },
            range: [0, 40]
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
                                name: 'earth',
                                range: [0, 4]
                            },
                            property: {
                                type: 'Identifier',
                                name: 'asia',
                                range: [6, 9]
                            },
                            range: [0, 9]
                        },
                        property: {
                            type: 'Identifier',
                            name: 'Indonesia',
                            range: [11, 19]
                        },
                        range: [0, 19]
                    },
                    property: {
                        type: 'Identifier',
                        name: 'prepareForElection',
                        range: [21, 38]
                    },
                    range: [0, 38]
                },
                'arguments': [{
                    type: 'Literal',
                    value: 2014,
                    range: [40, 43]
                }],
                range: [0, 44]
            },
            range: [0, 44]
        },

        'universe.if': {
            type: 'ExpressionStatement',
            expression: {
                type: 'MemberExpression',
                computed: false,
                object: {
                    type: 'Identifier',
                    name: 'universe',
                    range: [0, 7]
                },
                property: {
                    type: 'Identifier',
                    name: 'if',
                    range: [9, 10]
                },
                range: [0, 10]
            },
            range: [0, 10]
        },

        'universe.true': {
            type: 'ExpressionStatement',
            expression: {
                type: 'MemberExpression',
                computed: false,
                object: {
                    type: 'Identifier',
                    name: 'universe',
                    range: [0, 7]
                },
                property: {
                    type: 'Identifier',
                    name: 'true',
                    range: [9, 12]
                },
                range: [0, 12]
            },
            range: [0, 12]
        },

        'universe.false': {
            type: 'ExpressionStatement',
            expression: {
                type: 'MemberExpression',
                computed: false,
                object: {
                    type: 'Identifier',
                    name: 'universe',
                    range: [0, 7]
                },
                property: {
                    type: 'Identifier',
                    name: 'false',
                    range: [9, 13]
                },
                range: [0, 13]
            },
            range: [0, 13]
        },

        'universe.null': {
            type: 'ExpressionStatement',
            expression: {
                type: 'MemberExpression',
                computed: false,
                object: {
                    type: 'Identifier',
                    name: 'universe',
                    range: [0, 7]
                },
                property: {
                    type: 'Identifier',
                    name: 'null',
                    range: [9, 12]
                },
                range: [0, 12]
            },
            range: [0, 12]
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
                    name: 'x',
                    range: [0, 0]
                },
                prefix: false,
                range: [0, 2]
            },
            range: [0, 2]
        },

        'x--': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UpdateExpression',
                operator: '--',
                argument: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                prefix: false,
                range: [0, 2]
            },
            range: [0, 2]
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
                    name: 'x',
                    range: [2, 2]
                },
                prefix: true,
                range: [0, 2]
            },
            range: [0, 2]
        },

        '--x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UpdateExpression',
                operator: '--',
                argument: {
                    type: 'Identifier',
                    name: 'x',
                    range: [2, 2]
                },
                prefix: true,
                range: [0, 2]
            },
            range: [0, 2]
        },

        '+x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UnaryExpression',
                operator: '+',
                argument: {
                    type: 'Identifier',
                    name: 'x',
                    range: [1, 1]
                },
                range: [0, 1]
            },
            range: [0, 1]
        },

        '-x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UnaryExpression',
                operator: '-',
                argument: {
                    type: 'Identifier',
                    name: 'x',
                    range: [1, 1]
                },
                range: [0, 1]
            },
            range: [0, 1]
        },

        '~x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UnaryExpression',
                operator: '~',
                argument: {
                    type: 'Identifier',
                    name: 'x',
                    range: [1, 1]
                },
                range: [0, 1]
            },
            range: [0, 1]
        },

        '!x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UnaryExpression',
                operator: '!',
                argument: {
                    type: 'Identifier',
                    name: 'x',
                    range: [1, 1]
                },
                range: [0, 1]
            },
            range: [0, 1]
        },

        'void x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UnaryExpression',
                operator: 'void',
                argument: {
                    type: 'Identifier',
                    name: 'x',
                    range: [5, 5]
                },
                range: [0, 5]
            },
            range: [0, 5]
        },

        'delete x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UnaryExpression',
                operator: 'delete',
                argument: {
                    type: 'Identifier',
                    name: 'x',
                    range: [7, 7]
                },
                range: [0, 7]
            },
            range: [0, 7]
        },

        'typeof x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'UnaryExpression',
                operator: 'typeof',
                argument: {
                    type: 'Identifier',
                    name: 'x',
                    range: [7, 7]
                },
                range: [0, 7]
            },
            range: [0, 7]
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
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [4, 4]
                },
                range: [0, 4]
            },
            range: [0, 4]
        },

        'x / y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '/',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [4, 4]
                },
                range: [0, 4]
            },
            range: [0, 4]
        },

        'x % y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '%',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [4, 4]
                },
                range: [0, 4]
            },
            range: [0, 4]
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
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [4, 4]
                },
                range: [0, 4]
            },
            range: [0, 4]
        },

        'x - y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '-',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [4, 4]
                },
                range: [0, 4]
            },
            range: [0, 4]
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
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [5, 5]
                },
                range: [0, 5]
            },
            range: [0, 5]
        },

        'x >> y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '>>',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [5, 5]
                },
                range: [0, 5]
            },
            range: [0, 5]
        },

        'x >>> y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '>>>',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [6, 6]
                },
                range: [0, 6]
            },
            range: [0, 6]
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
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [4, 4]
                },
                range: [0, 4]
            },
            range: [0, 4]
        },

        'x > y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '>',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [4, 4]
                },
                range: [0, 4]
            },
            range: [0, 4]
        },

        'x <= y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '<=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [5, 5]
                },
                range: [0, 5]
            },
            range: [0, 5]
        },

        'x >= y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '>=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [5, 5]
                },
                range: [0, 5]
            },
            range: [0, 5]
        },

        'x in y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: 'in',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [5, 5]
                },
                range: [0, 5]
            },
            range: [0, 5]
        },

        'x instanceof y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: 'instanceof',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [13, 13]
                },
                range: [0, 13]
            },
            range: [0, 13]
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
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [5, 5]
                },
                range: [0, 5]
            },
            range: [0, 5]
        },

        'x != y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '!=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [5, 5]
                },
                range: [0, 5]
            },
            range: [0, 5]
        },

        'x === y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '===',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [6, 6]
                },
                range: [0, 6]
            },
            range: [0, 6]
        },

        'x !== y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '!==',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [6, 6]
                },
                range: [0, 6]
            },
            range: [0, 6]
        }

    },

    'Binary Bitwise Operators': {

        'x & y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '&',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [4, 4]
                },
                range: [0, 4]
            },
            range: [0, 4]
        },

        'x ^ y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '^',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [4, 4]
                },
                range: [0, 4]
            },
            range: [0, 4]
        },

        'x | y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '|',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [4, 4]
                },
                range: [0, 4]
            },
            range: [0, 4]
        }

    },

    'Binary Expressions': {

        'x + y + z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '+',
                left: {
                    type: 'BinaryExpression',
                    operator: '+',
                    left: {
                        type: 'Identifier',
                        name: 'x',
                        range: [0, 0]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'y',
                        range: [4, 4]
                    },
                    range: [0, 4]
                },
                right: {
                    type: 'Identifier',
                    name: 'z',
                    range: [8, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
        },

        'x - y + z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '+',
                left: {
                    type: 'BinaryExpression',
                    operator: '-',
                    left: {
                        type: 'Identifier',
                        name: 'x',
                        range: [0, 0]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'y',
                        range: [4, 4]
                    },
                    range: [0, 4]
                },
                right: {
                    type: 'Identifier',
                    name: 'z',
                    range: [8, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
        },

        'x + y - z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '-',
                left: {
                    type: 'BinaryExpression',
                    operator: '+',
                    left: {
                        type: 'Identifier',
                        name: 'x',
                        range: [0, 0]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'y',
                        range: [4, 4]
                    },
                    range: [0, 4]
                },
                right: {
                    type: 'Identifier',
                    name: 'z',
                    range: [8, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
        },

        'x - y - z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '-',
                left: {
                    type: 'BinaryExpression',
                    operator: '-',
                    left: {
                        type: 'Identifier',
                        name: 'x',
                        range: [0, 0]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'y',
                        range: [4, 4]
                    },
                    range: [0, 4]
                },
                right: {
                    type: 'Identifier',
                    name: 'z',
                    range: [8, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
        },

        'x + y * z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '+',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: {
                        type: 'Identifier',
                        name: 'y',
                        range: [4, 4]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'z',
                        range: [8, 8]
                    },
                    range: [4, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
        },

        'x + y / z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '+',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'BinaryExpression',
                    operator: '/',
                    left: {
                        type: 'Identifier',
                        name: 'y',
                        range: [4, 4]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'z',
                        range: [8, 8]
                    },
                    range: [4, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
        },

        'x - y % z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '-',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'BinaryExpression',
                    operator: '%',
                    left: {
                        type: 'Identifier',
                        name: 'y',
                        range: [4, 4]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'z',
                        range: [8, 8]
                    },
                    range: [4, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
        },

        'x * y * z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '*',
                left: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: {
                        type: 'Identifier',
                        name: 'x',
                        range: [0, 0]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'y',
                        range: [4, 4]
                    },
                    range: [0, 4]
                },
                right: {
                    type: 'Identifier',
                    name: 'z',
                    range: [8, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
        },

        'x * y / z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '/',
                left: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: {
                        type: 'Identifier',
                        name: 'x',
                        range: [0, 0]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'y',
                        range: [4, 4]
                    },
                    range: [0, 4]
                },
                right: {
                    type: 'Identifier',
                    name: 'z',
                    range: [8, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
        },

        'x * y % z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '%',
                left: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: {
                        type: 'Identifier',
                        name: 'x',
                        range: [0, 0]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'y',
                        range: [4, 4]
                    },
                    range: [0, 4]
                },
                right: {
                    type: 'Identifier',
                    name: 'z',
                    range: [8, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
        },

        'x % y * z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '*',
                left: {
                    type: 'BinaryExpression',
                    operator: '%',
                    left: {
                        type: 'Identifier',
                        name: 'x',
                        range: [0, 0]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'y',
                        range: [4, 4]
                    },
                    range: [0, 4]
                },
                right: {
                    type: 'Identifier',
                    name: 'z',
                    range: [8, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
        },

        'x << y << z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '<<',
                left: {
                    type: 'BinaryExpression',
                    operator: '<<',
                    left: {
                        type: 'Identifier',
                        name: 'x',
                        range: [0, 0]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'y',
                        range: [5, 5]
                    },
                    range: [0, 5]
                },
                right: {
                    type: 'Identifier',
                    name: 'z',
                    range: [10, 10]
                },
                range: [0, 10]
            },
            range: [0, 10]
        },

        'x | y | z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '|',
                left: {
                    type: 'BinaryExpression',
                    operator: '|',
                    left: {
                        type: 'Identifier',
                        name: 'x',
                        range: [0, 0]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'y',
                        range: [4, 4]
                    },
                    range: [0, 4]
                },
                right: {
                    type: 'Identifier',
                    name: 'z',
                    range: [8, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
        },

        'x & y & z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '&',
                left: {
                    type: 'BinaryExpression',
                    operator: '&',
                    left: {
                        type: 'Identifier',
                        name: 'x',
                        range: [0, 0]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'y',
                        range: [4, 4]
                    },
                    range: [0, 4]
                },
                right: {
                    type: 'Identifier',
                    name: 'z',
                    range: [8, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
        },

        'x ^ y ^ z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '^',
                left: {
                    type: 'BinaryExpression',
                    operator: '^',
                    left: {
                        type: 'Identifier',
                        name: 'x',
                        range: [0, 0]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'y',
                        range: [4, 4]
                    },
                    range: [0, 4]
                },
                right: {
                    type: 'Identifier',
                    name: 'z',
                    range: [8, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
        },

        'x & y | z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '|',
                left: {
                    type: 'BinaryExpression',
                    operator: '&',
                    left: {
                        type: 'Identifier',
                        name: 'x',
                        range: [0, 0]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'y',
                        range: [4, 4]
                    },
                    range: [0, 4]
                },
                right: {
                    type: 'Identifier',
                    name: 'z',
                    range: [8, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
        },

        'x | y ^ z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '^',
                left: {
                    type: 'BinaryExpression',
                    operator: '|',
                    left: {
                        type: 'Identifier',
                        name: 'x',
                        range: [0, 0]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'y',
                        range: [4, 4]
                    },
                    range: [0, 4]
                },
                right: {
                    type: 'Identifier',
                    name: 'z',
                    range: [8, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
        },

        'x | y & z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'BinaryExpression',
                operator: '|',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'BinaryExpression',
                    operator: '&',
                    left: {
                        type: 'Identifier',
                        name: 'y',
                        range: [4, 4]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'z',
                        range: [8, 8]
                    },
                    range: [4, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
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
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [5, 5]
                },
                range: [0, 5]
            },
            range: [0, 5]
        },

        'x && y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'LogicalExpression',
                operator: '&&',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [5, 5]
                },
                range: [0, 5]
            },
            range: [0, 5]
        },

        'x || y || z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'LogicalExpression',
                operator: '||',
                left: {
                    type: 'LogicalExpression',
                    operator: '||',
                    left: {
                        type: 'Identifier',
                        name: 'x',
                        range: [0, 0]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'y',
                        range: [5, 5]
                    },
                    range: [0, 5]
                },
                right: {
                    type: 'Identifier',
                    name: 'z',
                    range: [10, 10]
                },
                range: [0, 10]
            },
            range: [0, 10]
        },

        'x && y && z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'LogicalExpression',
                operator: '&&',
                left: {
                    type: 'LogicalExpression',
                    operator: '&&',
                    left: {
                        type: 'Identifier',
                        name: 'x',
                        range: [0, 0]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'y',
                        range: [5, 5]
                    },
                    range: [0, 5]
                },
                right: {
                    type: 'Identifier',
                    name: 'z',
                    range: [10, 10]
                },
                range: [0, 10]
            },
            range: [0, 10]
        },

        'x || y && z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'LogicalExpression',
                operator: '||',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'LogicalExpression',
                    operator: '&&',
                    left: {
                        type: 'Identifier',
                        name: 'y',
                        range: [5, 5]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'z',
                        range: [10, 10]
                    },
                    range: [5, 10]
                },
                range: [0, 10]
            },
            range: [0, 10]
        },

        'x || y ^ z': {
            type: 'ExpressionStatement',
            expression: {
                type: 'LogicalExpression',
                operator: '||',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'BinaryExpression',
                    operator: '^',
                    left: {
                        type: 'Identifier',
                        name: 'y',
                        range: [5, 5]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'z',
                        range: [9, 9]
                    },
                    range: [5, 9]
                },
                range: [0, 9]
            },
            range: [0, 9]
        }

    },

    'Conditional Operator': {

        'y ? 1 : 2': {
            type: 'ExpressionStatement',
            expression: {
                type: 'ConditionalExpression',
                test: {
                    type: 'Identifier',
                    name: 'y',
                    range: [0, 0]
                },
                consequent: {
                    type: 'Literal',
                    value: 1,
                    range: [4, 4]
                },
                alternate: {
                    type: 'Literal',
                    value: 2,
                    range: [8, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
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
                        name: 'x',
                        range: [0, 0]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'y',
                        range: [5, 5]
                    },
                    range: [0, 5]
                },
                consequent: {
                    type: 'Literal',
                    value: 1,
                    range: [9, 9]
                },
                alternate: {
                    type: 'Literal',
                    value: 2,
                    range: [13, 13]
                },
                range: [0, 13]
            },
            range: [0, 13]
        }

    },

    'Assignment Operators': {

        'x = 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Literal',
                    value: 42,
                    range: [4, 5]
                },
                range: [0, 5]
            },
            range: [0, 5]
        },

        'x *= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '*=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Literal',
                    value: 42,
                    range: [5, 6]
                },
                range: [0, 6]
            },
            range: [0, 6]
        },

        'x /= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '/=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Literal',
                    value: 42,
                    range: [5, 6]
                },
                range: [0, 6]
            },
            range: [0, 6]
        },

        'x %= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '%=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Literal',
                    value: 42,
                    range: [5, 6]
                },
                range: [0, 6]
            },
            range: [0, 6]
        },

        'x += 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '+=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Literal',
                    value: 42,
                    range: [5, 6]
                },
                range: [0, 6]
            },
            range: [0, 6]
        },

        'x -= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '-=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Literal',
                    value: 42,
                    range: [5, 6]
                },
                range: [0, 6]
            },
            range: [0, 6]
        },

        'x <<= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '<<=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Literal',
                    value: 42,
                    range: [6, 7]
                },
                range: [0, 7]
            },
            range: [0, 7]
        },

        'x >>= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '>>=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Literal',
                    value: 42,
                    range: [6, 7]
                },
                range: [0, 7]
            },
            range: [0, 7]
        },

        'x >>>= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '>>>=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Literal',
                    value: 42,
                    range: [7, 8]
                },
                range: [0, 8]
            },
            range: [0, 8]
        },

        'x &= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '&=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Literal',
                    value: 42,
                    range: [5, 6]
                },
                range: [0, 6]
            },
            range: [0, 6]
        },

        'x ^= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '^=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Literal',
                    value: 42,
                    range: [5, 6]
                },
                range: [0, 6]
            },
            range: [0, 6]
        },

        'x |= 42': {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '|=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                },
                right: {
                    type: 'Literal',
                    value: 42,
                    range: [5, 6]
                },
                range: [0, 6]
            },
            range: [0, 6]
        }

    },

    'Block': {

        '{ foo }': {
            type: 'BlockStatement',
            body: [{
                type: 'ExpressionStatement',
                expression: {
                    type: 'Identifier',
                    name: 'foo',
                    range: [2, 4]
                },
                range: [2, 5]
            }],
            range: [0, 6]
        },

        '{ doThis(); doThat(); }': {
            type: 'BlockStatement',
            body: [{
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'doThis',
                        range: [2, 7]
                    },
                    'arguments': [],
                    range: [2, 9]
                },
                range: [2, 10]
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'doThat',
                        range: [12, 17]
                    },
                    'arguments': [],
                    range: [12, 19]
                },
                range: [12, 20]
            }],
            range: [0, 22]
        },

        '{}': {
            type: 'BlockStatement',
            body: [],
            range: [0, 1]
        }

    },

    'Variable Statement': {

        'var x': {
            type: 'VariableDeclaration',
            declarations: [{
                type: 'VariableDeclarator',
                id: {
                    type: 'Identifier',
                    name: 'x'
                },
                init: null
            }],
            kind: 'var',
            range: [0, 4]
        },

        'var x, y;': {
            type: 'VariableDeclaration',
            declarations: [{
                type: 'VariableDeclarator',
                id: {
                    type: 'Identifier',
                    name: 'x'
                },
                init: null
            }, {
                type: 'VariableDeclarator',
                id: {
                    type: 'Identifier',
                    name: 'y'
                },
                init: null
            }],
            kind: 'var',
            range: [0, 8]
        },

        'var x = 42': {
            type: 'VariableDeclaration',
            declarations: [{
                type: 'VariableDeclarator',
                id: {
                    type: 'Identifier',
                    name: 'x'
                },
                init: {
                    type: 'Literal',
                    value: 42,
                    range: [8, 9]
                }
            }],
            kind: 'var',
            range: [0, 9]
        },

        'var x = 14, y = 3, z = 1977': {
            type: 'VariableDeclaration',
            declarations: [{
                type: 'VariableDeclarator',
                id: {
                    type: 'Identifier',
                    name: 'x'
                },
                init: {
                    type: 'Literal',
                    value: 14,
                    range: [8, 9]
                }
            }, {
                type: 'VariableDeclarator',
                id: {
                    type: 'Identifier',
                    name: 'y'
                },
                init: {
                    type: 'Literal',
                    value: 3,
                    range: [16, 16]
                }
            }, {
                type: 'VariableDeclarator',
                id: {
                    type: 'Identifier',
                    name: 'z'
                },
                init: {
                    type: 'Literal',
                    value: 1977,
                    range: [23, 26]
                }
            }],
            kind: 'var',
            range: [0, 26]
        }

    },

    'Let Statement': {

        'let x': {
            type: 'VariableDeclaration',
            declarations: [{
                type: 'VariableDeclarator',
                id: {
                    type: 'Identifier',
                    name: 'x'
                },
                init: null
            }],
            kind: 'let'
        },

        '{ let x }': {
            type: 'BlockStatement',
            body: [{
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: null
                }],
                kind: 'let'
            }],
            range: [0, 8]
        },

        '{ let x = 42 }': {
            type: 'BlockStatement',
            body: [{
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: {
                        type: 'Literal',
                        value: 42,
                        range: [10, 11]
                    }
                }],
                kind: 'let'
            }],
            range: [0, 13]
        },

        '{ let x = 14, y = 3, z = 1977 }': {
            type: 'BlockStatement',
            body: [{
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: {
                        type: 'Literal',
                        value: 14,
                        range: [10, 11]
                    }
                }, {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'y'
                    },
                    init: {
                        type: 'Literal',
                        value: 3,
                        range: [18, 18]
                    }
                }, {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'z'
                    },
                    init: {
                        type: 'Literal',
                        value: 1977,
                        range: [25, 28]
                    }
                }],
                kind: 'let'
            }],
            range: [0, 30]
        }

    },

    'Const Statement': {

        'const x = 42': {
            type: 'VariableDeclaration',
            declarations: [{
                type: 'VariableDeclarator',
                id: {
                    type: 'Identifier',
                    name: 'x'
                },
                init: {
                    type: 'Literal',
                    value: 42,
                    range: [10, 11]
                }
            }],
            kind: 'const'
        },

        '{ const x = 42 }': {
            type: 'BlockStatement',
            body: [{
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: {
                        type: 'Literal',
                        value: 42,
                        range: [12, 13]
                    }
                }],
                kind: 'const'
            }],
            range: [0, 15]
        },

        '{ const x = 14, y = 3, z = 1977 }': {
            type: 'BlockStatement',
            body: [{
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: {
                        type: 'Literal',
                        value: 14,
                        range: [12, 13]
                    }
                }, {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'y'
                    },
                    init: {
                        type: 'Literal',
                        value: 3,
                        range: [20, 20]
                    }
                }, {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'z'
                    },
                    init: {
                        type: 'Literal',
                        value: 1977,
                        range: [27, 30]
                    }
                }],
                kind: 'const'
            }],
            range: [0, 32]
        }

    },

    'Empty Statement': {

        ';': {
            type: 'EmptyStatement',
            range: [0, 0]
        }

    },

    'Expression Statement': {

        'x': {
            type: 'ExpressionStatement',
            expression: {
                type: 'Identifier',
                name: 'x',
                range: [0, 0]
            },
            range: [0, 0]
        },

        'x, y': {
            type: 'ExpressionStatement',
            expression: {
                type: 'SequenceExpression',
                expressions: [{
                    type: 'Identifier',
                    name: 'x',
                    range: [0, 0]
                }, {
                    type: 'Identifier',
                    name: 'y',
                    range: [3, 3]
                }],
                range: [0, 3]
            },
            range: [0, 3]
        }

    },

    'If Statement': {

        'if (morning) goodMorning()': {
            type: 'IfStatement',
            test: {
                type: 'Identifier',
                name: 'morning',
                range: [4, 10]
            },
            consequent: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'goodMorning',
                        range: [13, 23]
                    },
                    'arguments': [],
                    range: [13, 25]
                },
                range: [13, 25]
            },
            alternate: null,
            range: [0, 25]
        },

        'if (morning) (function(){})': {
            type: 'IfStatement',
            test: {
                type: 'Identifier',
                name: 'morning',
                range: [4, 10]
            },
            consequent: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'FunctionExpression',
                    id: null,
                    params: [],
                    body: {
                        type: 'BlockStatement',
                        body: [],
                        range: [24, 25]
                    },
                    range: [13, 26]
                },
                range: [13, 26]
            },
            alternate: null,
            range: [0, 26]
        },

        'if (morning) var x = 0;': {
            type: 'IfStatement',
            test: {
                type: 'Identifier',
                name: 'morning',
                range: [4, 10]
            },
            consequent: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: {
                        type: 'Literal',
                        value: 0,
                        range: [21, 21]
                    }
                }],
                kind: 'var',
                range: [13, 22]
            },
            alternate: null,
            range: [0, 22]
        },

        'if (morning) function a(){}': {
            type: 'IfStatement',
            test: {
                type: 'Identifier',
                name: 'morning',
                range: [4, 10]
            },
            consequent: {
                type: 'FunctionDeclaration',
                id: {
                    type: 'Identifier',
                    name: 'a'
                },
                params: [],
                body: {
                    type: 'BlockStatement',
                    body: [],
                    range: [25, 26]
                },
                range: [13, 26]
            },
            alternate: null,
            range: [0, 26]
        },

        'if (morning) goodMorning(); else goodDay()': {
            type: 'IfStatement',
            test: {
                type: 'Identifier',
                name: 'morning',
                range: [4, 10]
            },
            consequent: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'goodMorning',
                        range: [13, 23]
                    },
                    'arguments': [],
                    range: [13, 25]
                },
                range: [13, 26]
            },
            alternate: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'goodDay',
                        range: [33, 39]
                    },
                    'arguments': [],
                    range: [33, 41]
                },
                range: [33, 41]
            },
            range: [0, 41]
        }

    },

    'Iteration Statements': {

        'do keep(); while (true)': {
            type: 'DoWhileStatement',
            body: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'keep',
                        range: [3, 6]
                    },
                    'arguments': [],
                    range: [3, 8]
                },
                range: [3, 9]
            },
            test: {
                type: 'Literal',
                value: true,
                range: [18, 21]
            },
            range: [0, 22]
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
                            name: 'x',
                            range: [5, 5]
                        },
                        prefix: false,
                        range: [5, 7]
                    },
                    range: [5, 8]
                }, {
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'UpdateExpression',
                        operator: '--',
                        argument: {
                            type: 'Identifier',
                            name: 'y',
                            range: [10, 10]
                        },
                        prefix: false,
                        range: [10, 12]
                    },
                    range: [10, 13]
                }],
                range: [3, 15]
            },
            test: {
                type: 'BinaryExpression',
                operator: '<',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [24, 24]
                },
                right: {
                    type: 'Literal',
                    value: 10,
                    range: [28, 29]
                },
                range: [24, 29]
            },
            range: [0, 30]
        },

        '{ do { } while (false) false }': {
            type: 'BlockStatement',
            body: [{
                type: 'DoWhileStatement',
                body: {
                    type: 'BlockStatement',
                    body: [],
                    range: [5, 7]
                },
                test: {
                    type: 'Literal',
                    value: false,
                    range: [16, 20]
                },
                range: [2, 21]
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'Literal',
                    value: false,
                    range: [23, 27]
                },
                range: [23, 28]
            }],
            range: [0, 29]
        },

        'while (true) doSomething()': {
            type: 'WhileStatement',
            test: {
                type: 'Literal',
                value: true,
                range: [7, 10]
            },
            body: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'doSomething',
                        range: [13, 23]
                    },
                    'arguments': [],
                    range: [13, 25]
                },
                range: [13, 25]
            },
            range: [0, 25]
        },

        'while (x < 10) { x++; y--; }': {
            type: 'WhileStatement',
            test: {
                type: 'BinaryExpression',
                operator: '<',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [7, 7]
                },
                right: {
                    type: 'Literal',
                    value: 10,
                    range: [11, 12]
                },
                range: [7, 12]
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
                            name: 'x',
                            range: [17, 17]
                        },
                        prefix: false,
                        range: [17, 19]
                    },
                    range: [17, 20]
                }, {
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'UpdateExpression',
                        operator: '--',
                        argument: {
                            type: 'Identifier',
                            name: 'y',
                            range: [22, 22]
                        },
                        prefix: false,
                        range: [22, 24]
                    },
                    range: [22, 25]
                }],
                range: [15, 27]
            },
            range: [0, 27]
        },

        'for(;;);': {
            type: 'ForStatement',
            init: null,
            test: null,
            update: null,
            body: {
                type: 'EmptyStatement',
                range: [7, 7]
            },
            range: [0, 7]
        },

        'for(;;){}': {
            type: 'ForStatement',
            init: null,
            test: null,
            update: null,
            body: {
                type: 'BlockStatement',
                body: [],
                range: [7, 8]
            },
            range: [0, 8]
        },

        'for(x = 0;;);': {
            type: 'ForStatement',
            init: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [4, 4]
                },
                right: {
                    type: 'Literal',
                    value: 0,
                    range: [8, 8]
                },
                range: [4, 8]
            },
            test: null,
            update: null,
            body: {
                type: 'EmptyStatement',
                range: [12, 12]
            },
            range: [0, 12]
        },

        'for(var x = 0;;);': {
            type: 'ForStatement',
            init: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: {
                        type: 'Literal',
                        value: 0,
                        range: [12, 12]
                    }
                }],
                kind: 'var'
            },
            test: null,
            update: null,
            body: {
                type: 'EmptyStatement',
                range: [16, 16]
            },
            range: [0, 16]
        },

        'for(let x = 0;;);': {
            type: 'ForStatement',
            init: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: {
                        type: 'Literal',
                        value: 0,
                        range: [12, 12]
                    }
                }],
                kind: 'let'
            },
            test: null,
            update: null,
            body: {
                type: 'EmptyStatement',
                range: [16, 16]
            },
            range: [0, 16]
        },

        'for(var x = 0, y = 1;;);': {
            type: 'ForStatement',
            init: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: {
                        type: 'Literal',
                        value: 0,
                        range: [12, 12]
                    }
                }, {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'y'
                    },
                    init: {
                        type: 'Literal',
                        value: 1,
                        range: [19, 19]
                    }
                }],
                kind: 'var'
            },
            test: null,
            update: null,
            body: {
                type: 'EmptyStatement',
                range: [23, 23]
            },
            range: [0, 23]
        },

        'for(x = 0; x < 42;);': {
            type: 'ForStatement',
            init: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [4, 4]
                },
                right: {
                    type: 'Literal',
                    value: 0,
                    range: [8, 8]
                },
                range: [4, 8]
            },
            test: {
                type: 'BinaryExpression',
                operator: '<',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [11, 11]
                },
                right: {
                    type: 'Literal',
                    value: 42,
                    range: [15, 16]
                },
                range: [11, 16]
            },
            update: null,
            body: {
                type: 'EmptyStatement',
                range: [19, 19]
            },
            range: [0, 19]
        },

        'for(x = 0; x < 42; x++);': {
            type: 'ForStatement',
            init: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [4, 4]
                },
                right: {
                    type: 'Literal',
                    value: 0,
                    range: [8, 8]
                },
                range: [4, 8]
            },
            test: {
                type: 'BinaryExpression',
                operator: '<',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [11, 11]
                },
                right: {
                    type: 'Literal',
                    value: 42,
                    range: [15, 16]
                },
                range: [11, 16]
            },
            update: {
                type: 'UpdateExpression',
                operator: '++',
                argument: {
                    type: 'Identifier',
                    name: 'x',
                    range: [19, 19]
                },
                prefix: false,
                range: [19, 21]
            },
            body: {
                type: 'EmptyStatement',
                range: [23, 23]
            },
            range: [0, 23]
        },

        'for(x = 0; x < 42; x++) process(x);': {
            type: 'ForStatement',
            init: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [4, 4]
                },
                right: {
                    type: 'Literal',
                    value: 0,
                    range: [8, 8]
                },
                range: [4, 8]
            },
            test: {
                type: 'BinaryExpression',
                operator: '<',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [11, 11]
                },
                right: {
                    type: 'Literal',
                    value: 42,
                    range: [15, 16]
                },
                range: [11, 16]
            },
            update: {
                type: 'UpdateExpression',
                operator: '++',
                argument: {
                    type: 'Identifier',
                    name: 'x',
                    range: [19, 19]
                },
                prefix: false,
                range: [19, 21]
            },
            body: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'process',
                        range: [24, 30]
                    },
                    'arguments': [{
                        type: 'Identifier',
                        name: 'x',
                        range: [32, 32]
                    }],
                    range: [24, 33]
                },
                range: [24, 34]
            },
            range: [0, 34]
        },

        'for(x in list) process(x);': {
            type: 'ForInStatement',
            left: {
                type: 'Identifier',
                name: 'x',
                range: [4, 4]
            },
            right: {
                type: 'Identifier',
                name: 'list',
                range: [9, 12]
            },
            body: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'process',
                        range: [15, 21]
                    },
                    'arguments': [{
                        type: 'Identifier',
                        name: 'x',
                        range: [23, 23]
                    }],
                    range: [15, 24]
                },
                range: [15, 25]
            },
            each: false,
            range: [0, 25]
        },

        'for (var x in list) process(x);': {
            type: 'ForInStatement',
            left: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: null
                }],
                kind: 'var'
            },
            right: {
                type: 'Identifier',
                name: 'list',
                range: [14, 17]
            },
            body: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'process',
                        range: [20, 26]
                    },
                    'arguments': [{
                        type: 'Identifier',
                        name: 'x',
                        range: [28, 28]
                    }],
                    range: [20, 29]
                },
                range: [20, 30]
            },
            each: false,
            range: [0, 30]
        },

        'for (var x = 42 in list) process(x);': {
            type: 'ForInStatement',
            left: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: {
                        type: 'Literal',
                        value: 42,
                        range: [13, 14]
                    }
                }],
                kind: 'var'
            },
            right: {
                type: 'Identifier',
                name: 'list',
                range: [19, 22]
            },
            body: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'process',
                        range: [25, 31]
                    },
                    'arguments': [{
                        type: 'Identifier',
                        name: 'x',
                        range: [33, 33]
                    }],
                    range: [25, 34]
                },
                range: [25, 35]
            },
            each: false,
            range: [0, 35]
        },

        'for (let x in list) process(x);': {
            type: 'ForInStatement',
            left: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: null
                }],
                kind: 'let'
            },
            right: {
                type: 'Identifier',
                name: 'list',
                range: [14, 17]
            },
            body: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'process',
                        range: [20, 26]
                    },
                    'arguments': [{
                        type: 'Identifier',
                        name: 'x',
                        range: [28, 28]
                    }],
                    range: [20, 29]
                },
                range: [20, 30]
            },
            each: false,
            range: [0, 30]
        },

        'for (let x = 42 in list) process(x);': {
            type: 'ForInStatement',
            left: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: {
                        type: 'Literal',
                        value: 42,
                        range: [13, 14]
                    }
                }],
                kind: 'let'
            },
            right: {
                type: 'Identifier',
                name: 'list',
                range: [19, 22]
            },
            body: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'process',
                        range: [25, 31]
                    },
                    'arguments': [{
                        type: 'Identifier',
                        name: 'x',
                        range: [33, 33]
                    }],
                    range: [25, 34]
                },
                range: [25, 35]
            },
            each: false,
            range: [0, 35]
        },

        'for (var i = function() { return 10 in [] } in list) process(x);': {
            type: 'ForInStatement',
            left: {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'i'
                    },
                    init: {
                        type: 'FunctionExpression',
                        id: null,
                        params: [],
                        body: {
                            type: 'BlockStatement',
                            body: [{
                                type: 'ReturnStatement',
                                argument: {
                                    type: 'BinaryExpression',
                                    operator: 'in',
                                    left: {
                                        type: 'Literal',
                                        value: 10,
                                        range: [33, 34]
                                    },
                                    right: {
                                        type: 'ArrayExpression',
                                        elements: [],
                                        range: [39, 40]
                                    },
                                    range: [33, 40]
                                },
                                range: [26, 41]
                            }],
                            range: [24, 42]
                        },
                        range: [13, 42]
                    }
                }],
                kind: 'var'
            },
            right: {
                type: 'Identifier',
                name: 'list',
                range: [47, 50]
            },
            body: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: 'process',
                        range: [53, 59]
                    },
                    'arguments': [{
                        type: 'Identifier',
                        name: 'x',
                        range: [61, 61]
                    }],
                    range: [53, 62]
                },
                range: [53, 63]
            },
            each: false,
            range: [0, 63]
        }

    },

    'continue statement': {

        'continue': {
            type: 'ContinueStatement',
            label: null,
            range: [0, 7]
        },

        'continue done': {
            type: 'ContinueStatement',
            label: {
                type: 'Identifier',
                name: 'done'
            },
            range: [0, 12]
        },

        'continue done;': {
            type: 'ContinueStatement',
            label: {
                type: 'Identifier',
                name: 'done'
            },
            range: [0, 13]
        }

    },

    'break statement': {

        'break': {
            type: 'BreakStatement',
            label: null,
            range: [0, 4]
        },

        'break done': {
            type: 'BreakStatement',
            label: {
                type: 'Identifier',
                name: 'done'
            },
            range: [0, 9]
        },

        'break done;': {
            type: 'BreakStatement',
            label: {
                type: 'Identifier',
                name: 'done'
            },
            range: [0, 10]
        }

    },

    'return statement': {

        'return': {
            type: 'ReturnStatement',
            argument: null,
            range: [0, 5]
        },

        'return;': {
            type: 'ReturnStatement',
            argument: null,
            range: [0, 6]
        },

        'return x;': {
            type: 'ReturnStatement',
            argument: {
                type: 'Identifier',
                name: 'x',
                range: [7, 7]
            },
            range: [0, 8]
        },

        'return x * y': {
            type: 'ReturnStatement',
            argument: {
                type: 'BinaryExpression',
                operator: '*',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [7, 7]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [11, 11]
                },
                range: [7, 11]
            },
            range: [0, 11]
        }

    },

    'with statement': {

        'with (x) foo = bar': {
            type: 'WithStatement',
            object: {
                type: 'Identifier',
                name: 'x',
                range: [6, 6]
            },
            body: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'AssignmentExpression',
                    operator: '=',
                    left: {
                        type: 'Identifier',
                        name: 'foo',
                        range: [9, 11]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'bar',
                        range: [15, 17]
                    },
                    range: [9, 17]
                },
                range: [9, 17]
            },
            range: [0, 17]
        },

        'with (x) foo = bar;': {
            type: 'WithStatement',
            object: {
                type: 'Identifier',
                name: 'x',
                range: [6, 6]
            },
            body: {
                type: 'ExpressionStatement',
                expression: {
                    type: 'AssignmentExpression',
                    operator: '=',
                    left: {
                        type: 'Identifier',
                        name: 'foo',
                        range: [9, 11]
                    },
                    right: {
                        type: 'Identifier',
                        name: 'bar',
                        range: [15, 17]
                    },
                    range: [9, 17]
                },
                range: [9, 18]
            },
            range: [0, 18]
        },

        'with (x) { foo = bar }': {
            type: 'WithStatement',
            object: {
                type: 'Identifier',
                name: 'x',
                range: [6, 6]
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
                            name: 'foo',
                            range: [11, 13]
                        },
                        right: {
                            type: 'Identifier',
                            name: 'bar',
                            range: [17, 19]
                        },
                        range: [11, 19]
                    },
                    range: [11, 20]
                }],
                range: [9, 21]
            },
            range: [0, 21]
        }

    },

    'switch statement': {

        'switch (x) {}': {
            type: 'SwitchStatement',
            discriminant: {
                type: 'Identifier',
                name: 'x',
                range: [8, 8]
            },
            range: [0, 12]
        },

        'switch (answer) { case 42: hi(); break; }': {
            type: 'SwitchStatement',
            discriminant: {
                type: 'Identifier',
                name: 'answer',
                range: [8, 13]
            },
            cases: [{
                type: 'SwitchCase',
                test: {
                    type: 'Literal',
                    value: 42,
                    range: [23, 24]
                },
                consequent: [{
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'CallExpression',
                        callee: {
                            type: 'Identifier',
                            name: 'hi',
                            range: [27, 28]
                        },
                        'arguments': [],
                        range: [27, 30]
                    },
                    range: [27, 31]
                }, {
                    type: 'BreakStatement',
                    label: null,
                    range: [33, 38]
                }]
            }],
            range: [0, 40]
        },

        'switch (answer) { case 42: hi(); break; default: break }': {
            type: 'SwitchStatement',
            discriminant: {
                type: 'Identifier',
                name: 'answer',
                range: [8, 13]
            },
            cases: [{
                type: 'SwitchCase',
                test: {
                    type: 'Literal',
                    value: 42,
                    range: [23, 24]
                },
                consequent: [{
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'CallExpression',
                        callee: {
                            type: 'Identifier',
                            name: 'hi',
                            range: [27, 28]
                        },
                        'arguments': [],
                        range: [27, 30]
                    },
                    range: [27, 31]
                }, {
                    type: 'BreakStatement',
                    label: null,
                    range: [33, 38]
                }]
            }, {
                type: 'SwitchCase',
                test: null,
                consequent: [{
                    type: 'BreakStatement',
                    label: null,
                    range: [49, 54]
                }]
            }],
            range: [0, 55]
        }

    },

    'Labelled Statements': {

        'start: for (;;) break start': {
            type: 'LabeledStatement',
            label: {
                type: 'Identifier',
                name: 'start',
                range: [0, 4]
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
                    },
                    range: [16, 26]
                },
                range: [7, 26]
            },
            range: [0, 26]
        },

        'start: while (true) break start': {
            type: 'LabeledStatement',
            label: {
                type: 'Identifier',
                name: 'start',
                range: [0, 4]
            },
            body: {
                type: 'WhileStatement',
                test: {
                    type: 'Literal',
                    value: true,
                    range: [14, 17]
                },
                body: {
                    type: 'BreakStatement',
                    label: {
                        type: 'Identifier',
                        name: 'start'
                    },
                    range: [20, 30]
                },
                range: [7, 30]
            },
            range: [0, 30]
        }

    },

    'throw statement': {

        'throw x;': {
            type: 'ThrowStatement',
            argument: {
                type: 'Identifier',
                name: 'x',
                range: [6, 6]
            },
            range: [0, 7]
        },

        'throw x * y': {
            type: 'ThrowStatement',
            argument: {
                type: 'BinaryExpression',
                operator: '*',
                left: {
                    type: 'Identifier',
                    name: 'x',
                    range: [6, 6]
                },
                right: {
                    type: 'Identifier',
                    name: 'y',
                    range: [10, 10]
                },
                range: [6, 10]
            },
            range: [0, 10]
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
                        value: 'Error',
                        range: [17, 23]
                    }
                }],
                range: [6, 25]
            },
            range: [0, 25]
        }

    },

    'try statement': {

        'try { } catch (e) { }': {
            type: 'TryStatement',
            block: {
                type: 'BlockStatement',
                body: [],
                range: [4, 6]
            },
            handlers: [{
                type: 'CatchClause',
                param: {
                    type: 'Identifier',
                    name: 'e',
                    range: [15, 15]
                },
                guard: null,
                body: {
                    type: 'BlockStatement',
                    body: [],
                    range: [18, 20]
                }
            }],
            finalizer: null,
            range: [0, 20]
        },

        'try { } catch (e) { say(e) }': {
            type: 'TryStatement',
            block: {
                type: 'BlockStatement',
                body: [],
                range: [4, 6]
            },
            handlers: [{
                type: 'CatchClause',
                param: {
                    type: 'Identifier',
                    name: 'e',
                    range: [15, 15]
                },
                guard: null,
                body: {
                    type: 'BlockStatement',
                    body: [{
                        type: 'ExpressionStatement',
                        expression: {
                            type: 'CallExpression',
                            callee: {
                                type: 'Identifier',
                                name: 'say',
                                range: [20, 22]
                            },
                            'arguments': [{
                                type: 'Identifier',
                                name: 'e',
                                range: [24, 24]
                            }],
                            range: [20, 25]
                        },
                        range: [20, 26]
                    }],
                    range: [18, 27]
                }
            }],
            finalizer: null,
            range: [0, 27]
        },

        'try { } finally { cleanup(stuff) }': {
            type: 'TryStatement',
            block: {
                type: 'BlockStatement',
                body: [],
                range: [4, 6]
            },
            handlers: [],
            finalizer: {
                type: 'BlockStatement',
                body: [{
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'CallExpression',
                        callee: {
                            type: 'Identifier',
                            name: 'cleanup',
                            range: [18, 24]
                        },
                        'arguments': [{
                            type: 'Identifier',
                            name: 'stuff',
                            range: [26, 30]
                        }],
                        range: [18, 31]
                    },
                    range: [18, 32]
                }],
                range: [16, 33]
            },
            range: [0, 33]
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
                            name: 'doThat',
                            range: [6, 11]
                        },
                        'arguments': [],
                        range: [6, 13]
                    },
                    range: [6, 14]
                }],
                range: [4, 16]
            },
            handlers: [{
                type: 'CatchClause',
                param: {
                    type: 'Identifier',
                    name: 'e',
                    range: [25, 25]
                },
                guard: null,
                body: {
                    type: 'BlockStatement',
                    body: [{
                        type: 'ExpressionStatement',
                        expression: {
                            type: 'CallExpression',
                            callee: {
                                type: 'Identifier',
                                name: 'say',
                                range: [30, 32]
                            },
                            'arguments': [{
                                type: 'Identifier',
                                name: 'e',
                                range: [34, 34]
                            }],
                            range: [30, 35]
                        },
                        range: [30, 36]
                    }],
                    range: [28, 37]
                }
            }],
            finalizer: null,
            range: [0, 37]
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
                            name: 'doThat',
                            range: [6, 11]
                        },
                        'arguments': [],
                        range: [6, 13]
                    },
                    range: [6, 14]
                }],
                range: [4, 16]
            },
            handlers: [{
                type: 'CatchClause',
                param: {
                    type: 'Identifier',
                    name: 'e',
                    range: [25, 25]
                },
                guard: null,
                body: {
                    type: 'BlockStatement',
                    body: [{
                        type: 'ExpressionStatement',
                        expression: {
                            type: 'CallExpression',
                            callee: {
                                type: 'Identifier',
                                name: 'say',
                                range: [30, 32]
                            },
                            'arguments': [{
                                type: 'Identifier',
                                name: 'e',
                                range: [34, 34]
                            }],
                            range: [30, 35]
                        },
                        range: [30, 36]
                    }],
                    range: [28, 37]
                }
            }],
            finalizer: {
                type: 'BlockStatement',
                body: [{
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'CallExpression',
                        callee: {
                            type: 'Identifier',
                            name: 'cleanup',
                            range: [49, 55]
                        },
                        'arguments': [{
                            type: 'Identifier',
                            name: 'stuff',
                            range: [57, 61]
                        }],
                        range: [49, 62]
                    },
                    range: [49, 63]
                }],
                range: [47, 64]
            },
            range: [0, 64]
        }

    },

    'debugger statement': {

        'debugger;': {
            type: 'DebuggerStatement',
            range: [0, 8]
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
                            name: 'sayHi',
                            range: [19, 23]
                        },
                        'arguments': [],
                        range: [19, 25]
                    },
                    range: [19, 26]
                }],
                range: [17, 28]
            },
            range: [0, 28]
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
                            name: 'sayHi',
                            range: [20, 24]
                        },
                        'arguments': [],
                        range: [20, 26]
                    },
                    range: [20, 27]
                }],
                range: [18, 29]
            },
            range: [0, 29]
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
                            name: 'sayHi',
                            range: [23, 27]
                        },
                        'arguments': [],
                        range: [23, 29]
                    },
                    range: [23, 30]
                }],
                range: [21, 32]
            },
            range: [0, 32]
        },

        'var hi = function() { sayHi() };': {
            type: 'VariableDeclaration',
            declarations: [{
                type: 'VariableDeclarator',
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
                                    name: 'sayHi',
                                    range: [22, 26]
                                },
                                'arguments': [],
                                range: [22, 28]
                            },
                            range: [22, 29]
                        }],
                        range: [20, 30]
                    },
                    range: [9, 30]
                }
            }],
            kind: 'var',
            range: [0, 31]
        },

        'var hello = function hi() { sayHi() };': {
            type: 'VariableDeclaration',
            declarations: [{
                type: 'VariableDeclarator',
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
                                    name: 'sayHi',
                                    range: [28, 32]
                                },
                                'arguments': [],
                                range: [28, 34]
                            },
                            range: [28, 35]
                        }],
                        range: [26, 36]
                    },
                    range: [12, 36]
                }
            }],
            kind: 'var',
            range: [0, 37]
        },

        '(function(){})': {
            type: 'ExpressionStatement',
            expression: {
                type: 'FunctionExpression',
                id: null,
                params: [],
                body: {
                    type: 'BlockStatement',
                    body: [],
                    range: [11, 12]
                },
                range: [0, 13]
            },
            range: [0, 13]
        }

    },

    'Automatic semicolon insertion': {

        '{ x\n++y }': {
            type: 'BlockStatement',
            body: [{
                type: 'ExpressionStatement',
                expression: {
                    type: 'Identifier',
                    name: 'x',
                    range: [2, 2]
                },
                range: [2, 3]
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'UpdateExpression',
                    operator: '++',
                    argument: {
                        type: 'Identifier',
                        name: 'y',
                        range: [6, 6]
                    },
                    prefix: true,
                    range: [4, 6]
                },
                range: [4, 7]
            }],
            range: [0, 8]
        },

        '{ x\n--y }': {
            type: 'BlockStatement',
            body: [{
                type: 'ExpressionStatement',
                expression: {
                    type: 'Identifier',
                    name: 'x',
                    range: [2, 2]
                },
                range: [2, 3]
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'UpdateExpression',
                    operator: '--',
                    argument: {
                        type: 'Identifier',
                        name: 'y',
                        range: [6, 6]
                    },
                    prefix: true,
                    range: [4, 6]
                },
                range: [4, 7]
            }],
            range: [0, 8]
        },

        '{ var x = 14, y = 3\nz; }': {
            type: 'BlockStatement',
            body: [{
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'x'
                    },
                    init: {
                        type: 'Literal',
                        value: 14,
                        range: [10, 11]
                    }
                }, {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'y'
                    },
                    init: {
                        type: 'Literal',
                        value: 3,
                        range: [18, 18]
                    }
                }],
                kind: 'var',
                range: [2, 19]
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'Identifier',
                    name: 'z',
                    range: [20, 20]
                },
                range: [20, 21]
            }],
            range: [0, 23]
        },

        '{ continue\nthere; }': {
            type: 'BlockStatement',
            body: [{
                type: 'ContinueStatement',
                label: null,
                range: [2, 9]
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'Identifier',
                    name: 'there',
                    range: [11, 15]
                },
                range: [11, 16]
            }],
            range: [0, 18]
        },

        '{ continue // Comment\nthere; }': {
            type: 'BlockStatement',
            body: [{
                type: 'ContinueStatement',
                label: null,
                range: [2, 9]
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'Identifier',
                    name: 'there',
                    range: [22, 26]
                },
                range: [22, 27]
            }],
            range: [0, 29]
        },

        '{ continue /* Multiline\nComment */there; }': {
            type: 'BlockStatement',
            body: [{
                type: 'ContinueStatement',
                label: null,
                range: [2, 9]
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'Identifier',
                    name: 'there',
                    range: [34, 38]
                },
                range: [34, 39]
            }],
            range: [0, 41]
        },

        '{ break\nthere; }': {
            type: 'BlockStatement',
            body: [{
                type: 'BreakStatement',
                label: null,
                range: [2, 6]
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'Identifier',
                    name: 'there',
                    range: [8, 12]
                },
                range: [8, 13]
            }],
            range: [0, 15]
        },

        '{ break // Comment\nthere; }': {
            type: 'BlockStatement',
            body: [{
                type: 'BreakStatement',
                label: null,
                range: [2, 6]
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'Identifier',
                    name: 'there',
                    range: [19, 23]
                },
                range: [19, 24]
            }],
            range: [0, 26]
        },

        '{ break /* Multiline\nComment */there; }': {
            type: 'BlockStatement',
            body: [{
                type: 'BreakStatement',
                label: null,
                range: [2, 6]
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'Identifier',
                    name: 'there',
                    range: [31, 35]
                },
                range: [31, 36]
            }],
            range: [0, 38]
        },

        '{ return\nx; }': {
            type: 'BlockStatement',
            body: [{
                type: 'ReturnStatement',
                argument: null,
                range: [2, 7]
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'Identifier',
                    name: 'x',
                    range: [9, 9]
                },
                range: [9, 10]
            }],
            range: [0, 12]
        },

        '{ return // Comment\nx; }': {
            type: 'BlockStatement',
            body: [{
                type: 'ReturnStatement',
                argument: null,
                range: [2, 7]
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'Identifier',
                    name: 'x',
                    range: [20, 20]
                },
                range: [20, 21]
            }],
            range: [0, 23]
        },

        '{ return/* Multiline\nComment */x; }': {
            type: 'BlockStatement',
            body: [{
                type: 'ReturnStatement',
                argument: null,
                range: [2, 7]
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'Identifier',
                    name: 'x',
                    range: [31, 31]
                },
                range: [31, 32]
            }],
            range: [0, 34]
        },

        '{ throw error\nerror; }': {
            type: 'BlockStatement',
            body: [{
                type: 'ThrowStatement',
                argument: {
                    type: 'Identifier',
                    name: 'error',
                    range: [8, 12]
                },
                range: [2, 13]
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'Identifier',
                    name: 'error',
                    range: [14, 18]
                },
                range: [14, 19]
            }],
            range: [0, 21]
        },

        '{ throw error// Comment\nerror; }': {
            type: 'BlockStatement',
            body: [{
                type: 'ThrowStatement',
                argument: {
                    type: 'Identifier',
                    name: 'error',
                    range: [8, 12]
                },
                range: [2, 23]
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'Identifier',
                    name: 'error',
                    range: [24, 28]
                },
                range: [24, 29]
            }],
            range: [0, 31]
        },

        '{ throw error/* Multiline\nComment */error; }': {
            type: 'BlockStatement',
            body: [{
                type: 'ThrowStatement',
                argument: {
                    type: 'Identifier',
                    name: 'error',
                    range: [8, 12]
                },
                range: [2, 35]
            }, {
                type: 'ExpressionStatement',
                expression: {
                    type: 'Identifier',
                    name: 'error',
                    range: [36, 40]
                },
                range: [36, 41]
            }],
            range: [0, 43]
        }

    },

    'Trace Function Entrance': {

        'function hello() {}': {
            modifiers: [{
                name: 'Tracer.FunctionEntrance',
                config: 'EnterFunction'
            }],
            result: 'function hello() {\nEnterFunction(\'hello\', [0, 18]);}'
        },

        'hello = function() {}': {
            modifiers: [{
                name: 'Tracer.FunctionEntrance',
                config: 'Enter'
            }],
            result: 'hello = function() {\nEnter(\'hello\', [8, 20]);}'
        },

        'var hello = function() {}': {
            modifiers: [{
                name: 'Tracer.FunctionEntrance',
                config: 'TRACE'
            }],
            result: 'var hello = function() {\nTRACE(\'hello\', [12, 24]);}'
        },

        'var hello = function say() {}': {
            modifiers: [{
                name: 'Tracer.FunctionEntrance',
                config: 'TRACE'
            }],
            result: 'var hello = function say() {\nTRACE(\'hello\', [12, 28]);}'
        },

        'hello = function () {}': {
            modifiers: [{
                name: 'Tracer.FunctionEntrance',
                config: 'EnterFunction'
            }],
            result: 'hello = function () {\nEnterFunction(\'hello\', [8, 21]);}'
        },

        '\n\nfunction say(name) { print(name);}': {
            modifiers: [{
                name: 'Tracer.FunctionEntrance',
                config: 'EnterFunction'
            }],
            result: '\n\nfunction say(name) {\nEnterFunction(\'say\', [2, 35]); print(name);}'
        },

        '(function(){}())': {
            modifiers: [{
                name: 'Tracer.FunctionEntrance',
                config: 'EnterFunction'
            }],
            result: '(function(){\nEnterFunction(\'[Anonymous]\', [1, 12]);}())'
        },

        '(function(){})()': {
            modifiers: [{
                name: 'Tracer.FunctionEntrance',
                config: 'EnterFunction'
            }],
            result: '(function(){\nEnterFunction(\'[Anonymous]\', [0, 13]);})()'
        },

        '[14, 3].forEach(function(x) { alert(x) })': {
            modifiers: [{
                name: 'Tracer.FunctionEntrance',
                config: 'TR'
            }],
            result: '[14, 3].forEach(function(x) {\nTR(\'[Anonymous]\', [16, 39]); alert(x) })'
        },

        'var x = { y: function(z) {} }': {
            modifiers: [{
                name: 'Tracer.FunctionEntrance',
                config: 'TR'
            }],
            result: 'var x = { y: function(z) {\nTR(\'y\', [13, 26]);} }'
        }
    },

    'Invalid syntax': {

        '{': {
            index: 1,
            lineNumber: 1,
            column: 2,
            message: 'Error: Line 1: Unexpected end of input'
        },

        '}': {
            index: 0,
            lineNumber: 1,
            column: 1,
            message: 'Error: Line 1: Unexpected token }'
        },

        '3ea': {
            index: 2,
            lineNumber: 1,
            column: 3,
            message: 'Error: Line 1: Unexpected token ILLEGAL'
        },

        '3in[]': {
            index: 1,
            lineNumber: 1,
            column: 2,
            message: 'Error: Line 1: Unexpected token ILLEGAL'
        },

        '0x3in[]': {
            index: 3,
            lineNumber: 1,
            column: 4,
            message: 'Error: Line 1: Unexpected token ILLEGAL'
        },

        'var x = /(s/g': {
            index: 13,
            lineNumber: 1,
            column: 14,
            message: 'Error: Line 1: Invalid regular expression'
        },

        '/': {
            index: 1,
            lineNumber: 1,
            column: 2,
            message: 'Error: Line 1: Invalid regular expression: missing /'
        },

        'var x = /\n/': {
            index: 10,
            lineNumber: 1,
            column: 11,
            message: 'Error: Line 1: Invalid regular expression: missing /'
        },

        'var x = "\n': {
            index: 10,
            lineNumber: 1,
            column: 11,
            message: 'Error: Line 1: Unexpected token ILLEGAL'
        },

        'var if = 42': {
            index: 4,
            lineNumber: 1,
            column: 5,
            message: 'Error: Line 1: Unexpected token if'
        },

        '1 + (': {
            index: 5,
            lineNumber: 1,
            column: 6,
            message: 'Error: Line 1: Unexpected end of input'
        },

        '\n\n\n{': {
            index: 4,
            lineNumber: 4,
            column: 2,
            message: 'Error: Line 4: Unexpected end of input'
        },

        '\n/* Some multiline\ncomment */\n)': {
            index: 30,
            lineNumber: 4,
            column: 1,
            message: 'Error: Line 4: Unexpected token )'
        },

        '{ set 1 }': {
            index: 6,
            lineNumber: 1,
            column: 7,
            message: 'Error: Line 1: Unexpected number'
        },

        '{ get 2 }': {
            index: 6,
            lineNumber: 1,
            column: 7,
            message: 'Error: Line 1: Unexpected number'
        },

        '({ set: s(if) { } })': {
            index: 10,
            lineNumber: 1,
            column: 11,
            message: 'Error: Line 1: Unexpected token if'
        },

        '({ set: s() { } })': {
            index: 12,
            lineNumber: 1,
            column: 13,
            message: 'Error: Line 1: Unexpected token {'
        },

        '({ set: s(a, b) { } })': {
            index: 16,
            lineNumber: 1,
            column: 17,
            message: 'Error: Line 1: Unexpected token {'
        },

        '({ get: g(d) { } })': {
            index: 13,
            lineNumber: 1,
            column: 14,
            message: 'Error: Line 1: Unexpected token {'
        },

        'function t(if) { }': {
            index: 11,
            lineNumber: 1,
            column: 12,
            message: 'Error: Line 1: Unexpected token if'
        },

        'function t(true) { }': {
            index: 11,
            lineNumber: 1,
            column: 12,
            message: 'Error: Line 1: Unexpected token true'
        },

        'function t(false) { }': {
            index: 11,
            lineNumber: 1,
            column: 12,
            message: 'Error: Line 1: Unexpected token false'
        },

        'function t(null) { }': {
            index: 11,
            lineNumber: 1,
            column: 12,
            message: 'Error: Line 1: Unexpected token null'
        },

        'function null() { }': {
            index: 9,
            lineNumber: 1,
            column: 10,
            message: 'Error: Line 1: Unexpected token null'
        },

        'function true() { }': {
            index: 9,
            lineNumber: 1,
            column: 10,
            message: 'Error: Line 1: Unexpected token true'
        },

        'function false() { }': {
            index: 9,
            lineNumber: 1,
            column: 10,
            message: 'Error: Line 1: Unexpected token false'
        },

        'function if() { }': {
            index: 9,
            lineNumber: 1,
            column: 10,
            message: 'Error: Line 1: Unexpected token if'
        },

        'a b;': {
            index: 2,
            lineNumber: 1,
            column: 3,
            message: 'Error: Line 1: Unexpected identifier'
        },

        'if.a;': {
            index: 2,
            lineNumber: 1,
            column: 3,
            message: 'Error: Line 1: Unexpected token .'
        },

        'a if;': {
            index: 2,
            lineNumber: 1,
            column: 3,
            message: 'Error: Line 1: Unexpected token if'
        },

        'a class;': {
            index: 2,
            lineNumber: 1,
            column: 3,
            message: 'Error: Line 1: Unexpected reserved word'
        },

        'break 1;': {
            index: 6,
            lineNumber: 1,
            column: 7,
            message: 'Error: Line 1: Unexpected number'
        },

        'continue 2;': {
            index: 9,
            lineNumber: 1,
            column: 10,
            message: 'Error: Line 1: Unexpected number'
        },

        'throw': {
            index: 5,
            lineNumber: 1,
            column: 6,
            message: 'Error: Line 1: Unexpected end of input'
        },

        'throw;': {
            index: 5,
            lineNumber: 1,
            column: 6,
            message: 'Error: Line 1: Unexpected token ;'
        },

        'throw\n': {
            index: 5,
            lineNumber: 1,
            column: 6,
            message: 'Error: Line 1: Illegal newline after throw'
        },

        '10 = 20': {
            index: 2,
            lineNumber: 1,
            column: 3,
            message: 'Error: Line 1: Invalid left-hand side in assignment'
        },

        '10++': {
            index: 2,
            lineNumber: 1,
            column: 3,
            message: 'Error: Line 1: Invalid left-hand side expression in postfix operation'
        },

        '++10': {
            index: 4,
            lineNumber: 1,
            column: 5,
            message: 'Error: Line 1: Invalid left-hand side expression in prefix operation'
        },

        'for (10 in []);': {
            index: 13,
            lineNumber: 1,
            column: 14,
            message: 'Error: Line 1: Invalid left-hand side in for-in'
        },

        'for (var i, i2 in {});': {
            index: 15,
            lineNumber: 1,
            column: 16,
            message: 'Error: Line 1: Unexpected token in'
        },

        'for ((i in {}));': {
            index: 14,
            lineNumber: 1,
            column: 15,
            message: 'Error: Line 1: Unexpected token )'
        },

        'try { }': {
            index: 7,
            lineNumber: 1,
            column: 8,
            message: 'Error: Line 1: Missing catch or finally after try'
        },

        '\u203F = 10': {
            index: 0,
            lineNumber: 1,
            column: 1,
            message: 'Error: Line 1: Unexpected token ILLEGAL'
        },

        'const x = 12, y;': {
            index: 15,
            lineNumber: 1,
            column: 16,
            message: 'Error: Line 1: Unexpected token ;'
        },

        'const x, y = 12;': {
            index: 7,
            lineNumber: 1,
            column: 8,
            message: 'Error: Line 1: Unexpected token ,'
        },

        'const x;': {
            index: 7,
            lineNumber: 1,
            column: 8,
            message: 'Error: Line 1: Unexpected token ;'
        },

        'if(true) let a = 1;': {
            index: 9,
            lineNumber: 1,
            column: 10,
            message: 'Error: Line 1: Unexpected token let'
        },

        'if(true) const a = 1;': {
            index: 9,
            lineNumber: 1,
            column: 10,
            message: 'Error: Line 1: Unexpected token const'
        },

        '\n]': {
            index: 1,
            lineNumber: 2,
            column: 1,
            message: 'Error: Line 2: Unexpected token ]'
        },

        '\r]': {
            index: 1,
            lineNumber: 2,
            column: 1,
            message: 'Error: Line 2: Unexpected token ]'
        },

        '\r\n]': {
            index: 2,
            lineNumber: 2,
            column: 1,
            message: 'Error: Line 2: Unexpected token ]'
        },

        '\n\r]': {
            index: 2,
            lineNumber: 3,
            column: 1,
            message: 'Error: Line 3: Unexpected token ]'
        },

        '//\r\n]': {
            index: 4,
            lineNumber: 2,
            column: 1,
            message: 'Error: Line 2: Unexpected token ]'
        },

        '//\n\r]': {
            index: 4,
            lineNumber: 3,
            column: 1,
            message: 'Error: Line 3: Unexpected token ]'
        },

        '//\r \n]': {
            index: 5,
            lineNumber: 3,
            column: 1,
            message: 'Error: Line 3: Unexpected token ]'
        },

        '/*\r\n*/]': {
            index: 6,
            lineNumber: 2,
            column: 3,
            message: 'Error: Line 2: Unexpected token ]'
        },

        '/*\n\r*/]': {
            index: 6,
            lineNumber: 3,
            column: 3,
            message: 'Error: Line 3: Unexpected token ]'
        },

        '/*\r \n*/]': {
            index: 7,
            lineNumber: 3,
            column: 3,
            message: 'Error: Line 3: Unexpected token ]'
        }
    }
};


function hasComment(syntax) {
    'use strict';
    return typeof syntax.comments !== 'undefined';
}

function hasTokens(syntax) {
    'use strict';
    var result = false;
    JSON.stringify(syntax, function (key, value) {
        if (key === 'tokens') {
            result = true;
        }
        return value;
    });
    return result;
}

// Special handling for regular expression literal since we need to
// convert it to a string literal, otherwise it will be decoded
// as object "{}" and the regular expression would be lost.
function adjustRegexLiteral(key, value) {
    'use strict';
    if (key === 'value' && value instanceof RegExp) {
        value = value.toString();
    }
    return value;
}

if (typeof window === 'undefined') {
    var esprima = require('../esprima');
}

function NotMatchingError(expected, actual) {
    'use strict';
    Error.call(this, 'Expected ');
    this.expected = expected;
    this.actual = actual;
}
NotMatchingError.prototype = new Error();

function testParse(code, syntax) {
    'use strict';
    var expected, tree, actual, options, StringObject;

    // alias, so that JSLint does not complain.
    StringObject = String;

    options = {
        comment: false,
        range: true,
        tokens: false
    };

    options.comment = hasComment(syntax);
    options.tokens = hasTokens(syntax);

    expected = JSON.stringify(syntax, null, 4);
    try {
        tree = esprima.parse(code, options);
        tree = (options.comment || options.tokens) ? tree : tree.body[0];
        actual = JSON.stringify(tree, adjustRegexLiteral, 4);

        // Only to ensure that there is no error when using string object.
        esprima.parse(new StringObject(code), options);

    } catch (e) {
        throw new NotMatchingError(expected, e.toString());
    }
    if (expected !== actual) {
        throw new NotMatchingError(expected, actual);
    }
}

function testError(code, exception) {
    'use strict';
    var expected, msg, actual;

    expected = JSON.stringify(exception);

    try {
        esprima.parse(code);
    } catch (e) {
        msg = e.toString();

        // Opera 9.64 produces an non-standard string in toString().
        if (msg.substr(0, 6) !== 'Error:') {
            if (typeof e.message === 'string') {
                msg = 'Error: ' + e.message;
            }
        }

        actual = JSON.stringify({
            index: e.index,
            lineNumber: e.lineNumber,
            column: e.column,
            message: msg
        });

    }

    if (expected !== actual) {
        throw new NotMatchingError(expected, actual);
    }
}

function testModify(code, result) {
    'use strict';
    var actual, expected, i, modifier, modifiers;

    function findModifier(name) {
        var properties = name.split('.'),
            object = esprima,
            i;
        for (i = 0; i < properties.length; i += 1) {
            object = object[properties[i]];
        }
        return object;
    }

    esprima.Tracer.FunctionEntrance('EnterFunction');
    modifiers = [];
    for (i = 0; i < result.modifiers.length; i += 1) {
        modifier = result.modifiers[i];
        modifiers.push(findModifier(modifier.name).call(null, modifier.config));
    }

    expected = result.result;
    try {
        actual = esprima.modify(code, modifiers);
    } catch (e) {
        throw new NotMatchingError(expected, e.toString());
    }
    if (expected !== actual) {
        throw new NotMatchingError(expected, actual);
    }
}

function runTest(code, result) {
    'use strict';
    if (typeof result === 'string' || result.hasOwnProperty('lineNumber')) {
        testError(code, result);
    } else {
        if (result.hasOwnProperty('modifiers')) {
            testModify(code, result);
        } else {
            testParse(code, result);
        }
    }
}

if (typeof window !== 'undefined') {
    // Run all tests in a browser environment.
    runTests = function () {
        'use strict';
        var total = 0,
            failures = 0,
            category,
            fixture,
            source,
            tick,
            expected;

        function setText(el, str) {
            if (typeof el.innerText === 'string') {
                el.innerText = str;
            } else {
                el.textContent = str;
            }
        }

        function startCategory(category) {
            var report, e;
            report = document.getElementById('report');
            e = document.createElement('h4');
            setText(e, category);
            report.appendChild(e);
        }

        function reportSuccess(code) {
            var report, e;
            report = document.getElementById('report');
            e = document.createElement('pre');
            e.setAttribute('class', 'code');
            setText(e, code);
            report.appendChild(e);
        }

        function reportFailure(code, expected, actual) {
            var report, e;

            report = document.getElementById('report');

            e = document.createElement('p');
            setText(e, 'Code:');
            report.appendChild(e);

            e = document.createElement('pre');
            e.setAttribute('class', 'code');
            setText(e, code);
            report.appendChild(e);

            e = document.createElement('p');
            setText(e, 'Expected');
            report.appendChild(e);

            e = document.createElement('pre');
            e.setAttribute('class', 'expected');
            setText(e, expected);
            report.appendChild(e);

            e = document.createElement('p');
            setText(e, 'Actual');
            report.appendChild(e);

            e = document.createElement('pre');
            e.setAttribute('class', 'actual');
            setText(e, actual);
            report.appendChild(e);
        }

        setText(document.getElementById('version'), esprima.version);

        tick = new Date();
        for (category in data) {
            if (data.hasOwnProperty(category)) {
                startCategory(category);
                fixture = data[category];
                for (source in fixture) {
                    if (fixture.hasOwnProperty(source)) {
                        expected = fixture[source];
                        total += 1;
                        try {
                            runTest(source, expected);
                            reportSuccess(source, JSON.stringify(expected, null, 4));
                        } catch (e) {
                            failures += 1;
                            reportFailure(source, e.expected, e.actual);
                        }
                    }
                }
            }
        }
        tick = (new Date()) - tick;

        if (failures > 0) {
            setText(document.getElementById('status'), total + ' tests. ' +
                'Failures: ' + failures + '. ' + tick + ' ms');
        } else {
            setText(document.getElementById('status'), total + ' tests. ' +
                'No failure. ' + tick + ' ms');
        }
    };
} else {
    (function () {
        'use strict';

        var total = 0,
            failures = [],
            tick = new Date(),
            expected,
            header;

        Object.keys(data).forEach(function (category) {
            Object.keys(data[category]).forEach(function (source) {
                total += 1;
                expected = data[category][source];
                try {
                    runTest(source, expected);
                } catch (e) {
                    e.source = source;
                    failures.push(e);
                }
            });
        });
        tick = (new Date()) - tick;

        header = total + ' tests. ' + failures.length + ' failures. ' +
            tick + ' ms';
        if (failures.length) {
            console.error(header);
            failures.forEach(function (failure) {
                console.error(failure.source + ': Expected\n    ' +
                    failure.expected.split('\n').join('\n    ') +
                    '\nto match\n    ' + failure.actual);
            });
        }
        console.log(header);
        process.exit(failures.length === 0 ? 0 : 1);
    }());
}
/* vim: set sw=4 ts=4 et tw=80 : */
