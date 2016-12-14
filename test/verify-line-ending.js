#!/usr/bin/env node

'use strict';

var fs = require('fs');

var fname = 'test/line-ending-sample.js';
var content = fs.readFileSync(fname, 'utf-8');
var lines = content.split('\n');
if (content.length !== 28 || lines.length !== 8) {
    console.error(fname, 'uses an incorrect line ending.');
    console.error('Please verify that the repository was checked out properly!');
    process.exit(-1);
} else {
    console.log(fname, 'has the correct line endings.');
}
