/*jslint browser: true */

function runBenchmarks() {
    'use strict';
    var index = 0,
        totalSize = 0,
        totalTime = 0,
        fixture;

    fixture = [
        'jquery-1.7.1',
        'jquery-1.6.4',
        'prototype-1.7.0.0',
        'prototype-1.6.1',
        'ext-core-3.1.0',
        'ext-core-3.0.0',
        'mootools-1.4.1',
        'mootools-1.3.2'
    ];

    function setText(el, str) {
        if (typeof el.innerText === 'string') {
            el.innerText = str;
        } else {
            el.textContent = str;
        }
    }

    function showVersion() {
        var el = document.getElementById('benchmarkjs-version');
        setText(el, ' version ' + window.Benchmark.version);
        el = document.getElementById('version');
        setText(el, window.esprima.version);
    }

    function showStatus(name) {
        var el = document.getElementById(name + '-time');
        setText(el, 'Running...');
    }

    function finish() {
        var el = document.getElementById('status');
        setText(el, 'Completed.');
        el = document.getElementById('total-size');
        setText(el, (totalSize / 1024).toFixed(1));
        el = document.getElementById('total-time');
        setText(el, (1000 * totalTime).toFixed(1));
    }

    function showResult(name, size, stats) {
        var el;
        el = document.getElementById(name + '-size');
        setText(el, (size / 1024).toFixed(1));
        el = document.getElementById(name + '-time');
        setText(el, (1000 * stats.mean).toFixed(1));
        el = document.getElementById(name + '-variance');
        setText(el, (1000 * stats.variance).toFixed(1));
    }

    function runBenchmark() {
        var el, test, source, benchmark;

        if (index >= fixture.length) {
            finish();
            return;
        }

        test = fixture[index];
        el = document.getElementById(test);
        source = (typeof el.innerText === 'string') ? el.innerText : el.textContent;
        showStatus(test);

        // Force the result to be held in this array, thus defeating any
        // possible "dead core elimination" optimization.
        window.tree = [];

        benchmark = new window.Benchmark(test, function (o) {
            var syntax = window.esprima.parse(source);
            window.tree.push(syntax.body.length);
        }, {
            'onComplete': function () {
                showResult(this.name, source.length, this.stats);
                totalSize += source.length;
                totalTime += this.stats.mean;
            }
        });

        window.setTimeout(function () {
            benchmark.run();
            index += 1;
            window.setTimeout(runBenchmark, 211);
        }, 211);
    }

    showVersion();
    window.setTimeout(runBenchmark, 211);
}

