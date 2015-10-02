/* jshint unused:true, undef:true, strict:true, plusplus:true */
/* global setTimeout:false, module:false, exports:true, clearTimeout:false, require:false, console:false */

(function () {

    // Baseline setup
    // --------------

    "use strict";

    // Establish the root object, `window` in the browser, or `exports` on the server.
    var root = this;

    var redismockRESP = {};

    // Export the server object for **node.js/io.js**, with
    // backwards-compatibility for the old `require()` API. If we're in
    // the browser, add `redismock` as a global object.
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = redismockRESP;
        }
        exports.redismockRESP = redismockRESP;
    } 
    else {
        root.redismockRESP = redismockRESP;
    }

    function bulkString(length, idx, parts) {
        var str = parts[idx + 1];
        if (!str || str.value.length !== length) {
            return null;
        }
        return [str, idx + 1];
    }

    function array(count, idx, parts) {
        var len = parts.length, cnt = 0;
        var arr = [];
        var part, bs;
        while (idx < len && cnt < count) {
            part = parts[idx];
            if (part.type === 'Bulk String') {
                bs = bulkString(part.value, idx, parts);
                idx = bs[1];
                arr.push(bs[0]);
            }
            else {
                arr.push(part.value);
            }
            idx += 1;
        }
        return [arr, idx];
    }

    redismockRESP.decode = function (string) {
        var composed = [];
        var parts = string.split('\r\n');
        var part;
        var idx, len, stringIdx;
        var arr;
        if (parts.length === 0 || parts[parts.length - 1].length !== 0) {
            return null;
        }
        idx = 0, len = parts.length;
        stringIdx = 0;
        while (idx < len) {
            part = parts[idx];
            if (part.type === 'Array') {
                arr = array(part.value, idx, parts);
                idx = arr[1];
                if (arr[0].length !== part.value) {
                    return ;
                }
                if (arr.some(function ));
                composed.push(arr);
            }
        }
        return {parsed: composed, upto: idx};
    };

}).call(this);
