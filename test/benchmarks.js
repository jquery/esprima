/*jslint browser: true */
/*global runAllBenchmark: true */

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

    function id(i) {
        return document.getElementById(i);
    }

    function kb(bytes) {
        return (bytes / 1024).toFixed(1);
    }

    function setText(el, str) {
        if (typeof el.innerText === 'string') {
            el.innerText = str;
        } else {
            el.textContent = str;
        }
    }

    function showResult(name, size, stats) {
        var el;
        el = id(name + '-time');
        setText(el, (1000 * stats.mean).toFixed(1));
        el = id(name + '-variance');
        setText(el, (1000 * stats.variance).toFixed(1));
    }

    function ready() {
        setText(id('status'), 'Ready.');
        id('run').disabled = false;
        id('run').style.visibility = 'visible';
    }

    function load(tst, callback) {
        var el = id('status'),
            xhr = new XMLHttpRequest(),
            src = '3rdparty/' + tst + '.js';

        try {
            xhr.timeout = 30000;
            xhr.open('GET', src, true);
            setText(el, 'Please wait. Loading ' + src);

            xhr.ontimeout = function () {
                setText(el, 'Please wait. Error: time out while loading ' + src + ' ');
                callback.apply();
            };

            xhr.onreadystatechange = function () {
                var success = false,
                    size = 0;

                if (this.readyState === XMLHttpRequest.DONE) {
                    if (this.status === 200) {
                        window.data = window.data || {};
                        window.data[tst] = this.responseText;
                        size = this.responseText.length;
                        totalSize += size;
                        success = true;
                    }
                }

                if (success) {
                    setText(id(tst + '-size'), kb(size));
                } else {
                    setText(el, 'Please wait. Error loading ' + src);
                    setText(id(tst + '-size'), 'Error');
                }

                callback.apply();
            };

            xhr.send(null);
        } catch (e) {
            setText(el, 'Please wait. Error loading ' + src);
            callback.apply();
        }
    }

    function loadTests() {
        var sources = fixture.slice();

        function loadNextTest() {
            var tst;

            if (sources.length > 0) {
                tst = sources[0];
                sources.splice(0, 1);
                window.setTimeout(function () {
                    load(tst, loadNextTest);
                }, 100);
            } else {
                setText(id('total-size'), kb(totalSize));
                ready();
            }
        }

        id('run').style.visibility = 'hidden';
        loadNextTest();
    }

    function runBenchmark() {
        var el, test, source, benchmark;

        if (index >= fixture.length) {
            setText(id('total-time'), (1000 * totalTime).toFixed(1));
            ready();
            return;
        }

        test = fixture[index];
        el = id(test);
        source = window.data[test];
        setText(id(test + '-time'), 'Running...');

        // Force the result to be held in this array, thus defeating any
        // possible "dead core elimination" optimization.
        window.tree = [];

        benchmark = new window.Benchmark(test, function (o) {
            var syntax = window.esprima.parse(source);
            window.tree.push(syntax.body.length);
        }, {
            'onComplete': function () {
                showResult(this.name, source.length, this.stats);
                totalTime += this.stats.mean;
            }
        });

        window.setTimeout(function () {
            benchmark.run();
            index += 1;
            window.setTimeout(runBenchmark, 211);
        }, 211);
    }

    id('run').onclick = function () {

        for (index = 0; index < fixture.length; index += 1) {
            setText(id(fixture[index] + '-time'), '');
            setText(id(fixture[index] + '-variance'), '');
        }
        setText(id('total-time'), '');

        setText(id('status'), 'Please wait. Running benchmarks...');
        id('run').style.visibility = 'hidden';

        index = 0;
        totalTime = 0;
        runBenchmark();
    };

    setText(id('benchmarkjs-version'), ' version ' + window.Benchmark.version);
    setText(id('version'), window.esprima.version);

    loadTests();
}

