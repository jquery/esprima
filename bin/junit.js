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

var formatter;

(function () {
    'use strict';
    var removeLineNumRegEx = /^Line\ [0-9]*\:\ /;

    formatter =  function (log) {
        return {
            startLog: function () {
                log('<?xml version="1.0" encoding="UTF-8"?>');
                log('<testsuites>');
            },
            startSection: function (fileName, errors, failures, tests, time) {
                log('<testsuite name="' + fileName + '" errors="' + errors + '" ' +
                    ' failures="' + failures + '" ' + ' tests="' + tests + '" ' +
                    ' time="' + time + '">');
            },
            writeError: function (fileName, error, errorType) {
                var errorMsg = error.Message;

                if (errorType === "SyntaxError") {
                    errorMsg = error.message;
                    errorMsg = 'Line ' + error.lineNumber + ': ' + errorMsg.replace(removeLineNumRegEx, '');
                }

                log('  <testcase name="' + errorMsg + '" ' + ' time="0">');
                log('    <error type="' + errorType + '" message="' + error.message + '">' +
                              error.message + '(' + fileName + ':' + ((error.lineNumber) ? ':' + error.lineNumber : '') + ')</error>');
                log('  </testcase>');
            },
            endSection: function () {
                log('</testsuite>');
            },
            endLog: function () {
                log('</testsuites>');
            }
        };
    };

    if (typeof module !== 'undefined') {
        module.exports = formatter;
    }
}());