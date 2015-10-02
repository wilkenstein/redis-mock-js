/* jshint unused:true, undef:true, strict:true, plusplus:true */
/* global setTimeout:false, module:false, exports:true, clearTimeout:false, require:false, console:false */

(function () {

    // Baseline setup
    // --------------

    "use strict";

    // Establish the root object, `window` in the browser, or `exports` on the server.
    var root = this;

    var net = typeof require === 'function' ? require('net') : root.net;

    var redismockserver = {};

    // Export the server object for **node.js/io.js**, with
    // backwards-compatibility for the old `require()` API. If we're in
    // the browser, add `redismock` as a global object.
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = redismockserver;
        }
        exports.redismockserver = redismockserver;
    } 
    else {
        root.redismockserver = redismockserver;
    }

    var server = net.createServer();

    server.on('error', function (e) {
        if (e.code == 'EADDRINUSE') {
            console.log('Address in use');
            redismockserver.close();
        }
    });

    server.on('connection', function (socket) {
        var command = '';
        socket.on('data', function (data) {
            var command += data.toString();
            var arr;
            if (command.charAt(command.length - 1) === '\0') {
                // We have a command! Parse it.
            }
        });
    });

    redismockserver.listen = function (port, host, backlog, callback) {
        server.listen(port, host, backlog, callback);
        return this;
    };

    redismockserver.close = function (callback) {
        server.close(callback);
        return this;
    };

}).call(this);
