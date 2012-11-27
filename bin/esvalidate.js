#!/usr/bin/env node
/*
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>

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

/*jslint sloppy:true plusplus:true node:true rhino:true */
/*global phantom:true */

var fs, system, esprima, options, fnames, count, formats, formatter, dieLoudly;

if (typeof esprima === 'undefined') {
    var tryGet = function (method) {
        var valueToGet, args, path;
        valueToGet = null;
        args = [].slice.apply(arguments);

        if (args.length > 2) {
            args.unshift();
            path = args.splice(2, 1)[0];

            try {
                valueToGet = method(path);
            } catch (e) {
                return tryGet.apply(this, args);
            }
        }
        return valueToGet;
    };

    // PhantomJS can only require() relative files
    if (typeof phantom === 'object') {
        fs = require('fs');
        system = require('system');
        esprima = tryGet(require, './esprima', '../esprima');
        formats = tryGet(require, 'bin/formats', './formats');
    } else if (typeof require === 'function') {
        fs = require('fs');
        esprima = tryGet(require, 'esprima', './esprima.js', '../esprima.js');
        formats = tryGet(require, 'formats', 'bin/formats.js', './formats.js');
    } else if (typeof load === 'function') {
        esprima = tryGet(load, 'esprima.js', '../esprima.js');
        formats = tryGet(load, 'bin/formats.js', 'formats.js');
    }
}

// Shims to Node.js objects when running under PhantomJS 1.7+.
if (typeof phantom === 'object') {
    fs.readFileSync = fs.read;
    process = {
        argv: [].slice.call(system.args),
        exit: phantom.exit
    };
    process.argv.unshift('phantomjs');
}

// Shims to Node.js objects when running under Rhino.
if (typeof console === 'undefined' && typeof process === 'undefined') {
    console = { log: print };
    fs = { readFileSync: readFile };
    process = { argv: arguments, exit: quit };
    process.argv.unshift('esvalidate.js');
    process.argv.unshift('rhino');
}

function showUsage() {
    var format, availableFormats;

    console.log('Usage:');
    console.log('   esvalidate [options] file.js');
    console.log();
    console.log('Available options:');
    console.log();

    console.log(formats);

    availableFormats = null;
    Object.keys(formats).forEach(function (format) {
        if (availableFormats === null) {
            availableFormats = format;
        } else {
            availableFormats = availableFormats + ", " + format;
        }
    });

    console.log('  --format=type  Set the report format: ' + availableFormats);
    console.log('  -v, --version  Print program version');
    console.log('  -q, --quiet    If an error is encountered during parsing, die silently');
    console.log();
    process.exit(1);
}

if (process.argv.length <= 2) {
    showUsage();
}

options = {
    format: 'plain'
};

fnames = [];
dieLoudly = true;

process.argv.splice(2).forEach(function (entry) {

    if (entry === '-h' || entry === '--help') {
        showUsage();
    } else if (entry === '-v' || entry === '--version') {
        console.log('ECMAScript Validator (using Esprima version', esprima.version, ')');
        console.log();
        process.exit(0);
    } else if (entry === '-q' || entry === '--quiet') {
        dieLoudly = false;
    } else if (entry.slice(0, 9) === '--format=') {
        options.format = entry.slice(9);
    } else if (entry.slice(0, 2) === '--') {
        console.log('Error: unknown option ' + entry + '.');
        process.exit(1);
    } else {
        fnames.push(entry);
    }
});

if (formats.hasOwnProperty(options.format)) {
    formatter = formats[options.format](console.log);
} else {
    console.log('Error: unknown report format ' + options.format + '.');
    process.exit(1);
}

if (fnames.length === 0) {
    console.log('Error: no input file.');
    process.exit(1);
}

formatter.startLog();

count = 0;
fnames.forEach(function (fname) {
    var content, timestamp, syntax, name, errors, failures, tests, time;

    timestamp = Date.now();

    try {
        content = fs.readFileSync(fname, 'utf-8');

        if (content[0] === '#' && content[1] === '!') {
            content = '//' + content.substr(2, content.length);
        }

        syntax = esprima.parse(content, { tolerant: true });

        name = fname;
        if (name.lastIndexOf('/') >= 0) {
            name = name.slice(name.lastIndexOf('/') + 1);
        }

        errors = 0;
        failures = syntax.errors.length;
        tests =  syntax.errors.length;
        time = Math.round((Date.now() - timestamp) / 1000);

        formatter.startSection(name, errors, failures, tests, time);

        syntax.errors.forEach(function (error) {
            formatter.writeError(name, error, "SyntaxError");
            ++count;
        });

        formatter.endSection();

    } catch (e) {
        ++count;

        errors = 1;
        failures = 0;
        tests = 1;
        time = Math.round((Date.now() - timestamp) / 1000);

        formatter.startSection(fname, errors, failures, tests, time);
        formatter.writeError(fname, e, "ParseError");
        formatter.endSection();
    }
});

formatter.endLog();

if ((count > 0) && dieLoudly) {
    process.exit(1);
}

if (count === 0 && typeof phantom === 'object') {
    process.exit(0);
}