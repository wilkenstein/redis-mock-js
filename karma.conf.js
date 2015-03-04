// Note some browser launchers should be installed before using karma start.

// For example:
//      $ npm install karma-firefox-launcher
//      $ karma start --browser=Firefox

// See http://karma-runner.github.io/0.8/config/configuration-file.html
module.exports = function(config) {
    "use strict";
    config.set({
        basePath: '',

        frameworks: ['mocha', 'chai'],

        port: 9876,
        colors: true,
        autoWatch: false,

        // list of files / patterns to load in the browser
        files: [
            'node_modules/q/q.js',
            'redis-mock.js',
            'test/mocha/*.js'
        ],

        client: {
            mocha: {
                reporter: 'spec' // change Karma's debug.html to the mocha spec reporter
            }
        },

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        //browsers: ['PhantomJS', 'Firefox'],
        browsers: ['PhantomJS'],

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true
    });
};