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

    function padString(amountToPad) {
        var paddingCounter = 8 - amountToPad,
            padding = '',
            i;

        for (i = 0; i < paddingCounter; i++) {
            padding += ' ';
        }

        return padding;
    }

    formatter = function (log) {
        return {
            startLog: function () { },
            startSection: function (fileName, errors, failures, tests, time) {
                log("[esvalidate file:" + fileName + "]");
                errors = errors + failures;

                if (errors > 0) {
                    log(errors + " Error" + (errors > 1 ? "s" : "") + ":");
                }
            },
            writeError: function (fileName, error, errorType) {
                var msg = error.message;
                msg = msg.replace(removeLineNumRegEx, '');
                if (error.lineNumber && error.column) {
                    log(padString((error.lineNumber.toString() + error.column.toString()).length), error.lineNumber + ',' + error.column + ':', msg);
                } else {
                    log(msg);
                }
            },
            endSection: function () { },
            endLog: function () { }
        };
    };

    if (typeof module !== 'undefined') {
        module.exports = formatter;
    }
}());