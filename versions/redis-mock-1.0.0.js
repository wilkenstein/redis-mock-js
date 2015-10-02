/* jshint unused:true, undef:true, strict:true, plusplus:true */
/* global setTimeout:false, module:false, exports:true, clearTimeout:false, require:false, process:false */

(function () {

    // Baseline setup
    // --------------

    "use strict";

    // Establish the root object, `window` in the browser, or `exports` on the server.
    var root = this;

    // Create the mock object.
    var redismock = {};

    function exists(v) {
        return typeof v !== 'undefined' && v !== null;
    }

    // Export the mock object for **node.js/io.js**, with
    // backwards-compatibility for the old `require()` API. If we're in
    // the browser, add `redismock` as a global object.
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = redismock;
        }
        exports.redismock = redismock;
    } 
    else {
        root.redismock = redismock;
    }

    // We use setImmediate for callback-style returns,
    // but it is non-standard. To standardize, convert
    // setImmediate to its equivalent (mostly) counterpart --
    // setTimeout(f, 0) -- if it is not available.
    if (typeof setImmediate === 'undefined' || typeof setImmediate !== 'function') {
        var setImmediate = function (f) {
            setTimeout(f, 0);
        };
    }

    redismock.Array = Array;

    // The database.
    var cache = {};
    var timeouts = {};
    var subscribers = [];
    var watchers = {};
    var sets = 'sets-' + Math.random();
    //var keys = [];
    cache[sets] = {};
    cache[zsets] = {};
    cache[hashes] = {};

    // Utils
    // -----

    // From https://gist.github.com/Breton/2699916
    String.prototype.escape = function () {
        var escapable = /[.\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        var meta;
        /* jshint ignore:start */
        meta = { // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '\.': '\\.',
            '"': '\\"',
            '\\': '\\\\'
        };
        /* jshint ignore:end */
        function escapechar(a) {
            var c = meta[a];
            return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }
        return this.replace(escapable, escapechar);
    };
    //Translate a shell PATTERN to a regular expression.
    function translate(pat) {
        //There is no way to quote meta-characters.
        var i=0, j, n = pat.length || 0, res, c, stuff;
        res = '^';
        while (i < n) {
            c = pat[i];
            i = i + 1;
            if (c === '*') {
                res = res + '.*';
            } else if (c === '?') {
                res = res + '.';
            } else if (c === '[') {
                j = i;
                if (j < n && pat[j] === '!') {
                    j = j + 1;
                }
                if (j < n && pat[j] === ']') {
                    j = j + 1;
                }
                while (j < n && pat[j] !== ']') {
                    j = j + 1;
                }
                if (j >= n) {
                    res = res + '\\[';
                } else {
                    stuff = pat.slice(i, j).replace('\\', '\\\\');
                    i = j + 1;
                    if (stuff[0] === '!') {
                        stuff = '^' + stuff.slice(1);
                    } else if (stuff[0] === '^') {
                        stuff = '\\' + stuff;
                    }
                    res = res + '[' + stuff + ']';
                }
            } else {
                res = res + (c).escape();
            }
        }
        return res + '$';
    }

    var cb = function (callback, context) {
        return function () {
            var args = arguments;
            if (callback && typeof callback === "function") {
                setImmediate(function () {
                    callback.apply(context, args);
                });
            }
            if (args[0] instanceof Error) {
                return args[0];
            }
            return args[1];
        };
    };

    var gather = function () {
        return function () {
            var idx, len = arguments.length;
            var callback;
            var list = [];
            for (idx = len - 1; idx >= 0; idx -= 1) {
                if (!callback && typeof arguments[idx] === "function") {
                    callback = arguments[idx];
                }
                else if (exists(arguments[idx])) {
                    list.unshift(arguments[idx]);
                }
            }
            return {
                callback: callback,
                list: list
            };
        };
    };

    var wrongType = function (callback) {
        return cb(callback)(new Error('WRONGTYPE Operation against a key holding the wrong kind of value'));
    };

    redismock.ifType = function (key, type, callback) {
        var that = this;
        return {
            thenex: function (f) {
                this._ifex = f;
                return this;
            },
            thennx: function (f) {
                this._ifnx = f;
                return this;
            },
            then: function (f) {
                this._then = f;
                return this;
            },
            end: function () {
                var ret;
                if (that.exists(key)) {
                    if (that.type(key) !== type) {
                        return wrongType(callback);
                    }
                    if (typeof this._ifex === 'function') {
                        ret = this._ifex.call(that);
                        if (ret && ret instanceof Error) {
                            return cb(callback)(ret);
                        }
                    }
                }
                else {
                    if (typeof this._ifnx === 'function') {
                        ret = this._ifnx.call(that);
                        if (ret && ret instanceof Error) {
                            return cb(callback)(ret);
                        }
                    }
                }
                if (typeof this._then === 'function') {
                    ret = this._then.call(that);
                    if (ret && ret instanceof Error) {
                        return cb(callback)(ret);
                    }
                }
                return cb(callback)(null, ret);
            }
        };
    };

    // Keys Commands
    // -------------

    // Delete a key
    redismock.del = function (key, callback) {
        var that = this;
        var count = 0;
        var g = gather(this.del).apply(this, arguments);
        callback = g.callback;
        var del = function(k) {
            if (that.exists(k)) {
                if (k in cache) {
                    cache[k] = undefined;
                }
                else if (k in cache[sets]) {
                    cache[sets][k] = undefined;
                }
                else if (k in cache[zsets]) {
                    cache[zsets][k] = undefined;
                }
                else if (k in cache[hashes]) {
                    cache[hashes][k] = undefined;
                }
                count += 1;
            }
        };
        if(typeof g.list[0] === 'string') {
            del(g.list[0]);
        }
        else if(typeof g.list[0] === 'object'){
            g.list[0].forEach(function (k) {
                del(k);
            });
        }   
        return cb(callback)(null, count);
    };

    // Return a serialized version of the value stored at the specified key.
    redismock.dump = function (key, callback) {
        return cb(callback)(new Error("UNIMPLEMENTED"));
    };

    // Determine if a key exists.
    redismock.exists = function (key, callback) {
        return cb(callback)(null, (exists(cache[key]) || exists(cache[sets][key]) || exists(cache[zsets][key]) || exists(cache[hashes][key])) ? 1 : 0);
    };

    // Set a key's time to live in seconds.
    redismock.expire = function (key, seconds, callback) {
        return this.pexpire(key, seconds*1000, callback);
    };

    // Set the expiration for a key as a UNIX timestamp.
    redismock.expireat = function (key, timestamp, callback) {
        var now = new Date();
        return this.pexpire(key, timestamp*1000 - now.getTime(), callback);
    };

    // Find all the keys matching a given pattern.
    redismock.keys = function (pattern, callback) {
        var keys = [], key;
        var regex = new RegExp(translate(pattern));
        for (key in cache) {
            if (key === sets || key === zsets || key === hashes) {
                continue;
            }
            if (cache.hasOwnProperty(key)) {
                if (key.match(regex) !== null) {
                    keys.push(key);
                }
            }
        }
        for (key in cache[sets]) {
            if (cache[sets].hasOwnProperty(key)) {
                if (key.match(regex) !== null) {
                    keys.push(key);
                }
            }
        }
        for (key in cache[zsets]) {
            if (cache[zsets].hasOwnProperty(key)) {
                if (key.match(regex) !== null) {
                    keys.push(key);
                }
            }
        }
        for (key in cache[hashes]) {
            if (cache[hashes].hasOwnProperty(key)) {
                if (key.match(regex) !== null) {
                    keys.push(key);
                }
            }
        }
        return cb(callback)(null, keys);
    };

    // Atomically transfer a key from a Redis instance to another one.
    redismock.migrate = function (host, port, key, destination_db, timeout, callback) {
        return cb(callback)(new Error("UNIMPLEMENTED"));
    };

    // Move a key to another database.
    redismock.move = function (key, db, callback) {
        return cb(callback)(new Error("UNIMPLEMENTED"));
    };

    // Inspect the internals of Redis objects.
    redismock.object = function (subcommand, callback) {
        return cb(callback)(new Error("UNIMPLEMENTED"));
    };

    // Remove the expiration from a key.
    redismock.persist = function (key, callback) {
        if (this.exists(key) && timeouts[key]) {
            clearTimeout(timeouts[key].timeout);
            return cb(callback)(null, 1);
        }
        return cb(callback)(null, 0);
    };

    // Set a key's time to live in milliseconds.
    redismock.pexpire = function (key, milliseconds, callback) {
        var that = this;
        if (this.exists(key)) {
            if (timeouts[key]) {
                clearTimeout(timeouts[key].timeout);
            }
            if (milliseconds <= 0) {
                this.del(key);
            }
            else {
                timeouts[key] = {};
                timeouts[key].start = new Date();
                timeouts[key].end = (new Date(timeouts[key].start.getTime() + milliseconds));
                timeouts[key].timeout = setTimeout(function () {
                    timeouts[key] = undefined;
                    that.del(key);
                }, milliseconds);
            }
            return cb(callback)(null, 1);
        }
        return cb(callback)(null, 0);
    };

    // Set the expiration for a key as a UNIX timestamp specified in milliseconds.
    redismock.pexpireat = function (key, timestamp, callback) {
        var now = new Date();
        return this.pexpire(key, timestamp - now.getTime(), callback);
    };

    // Get the time to live for a key in milliseconds.
    redismock.pttl = function (key, callback) {
        var now = new Date();
        if (timeouts[key]) {
            return cb(callback)(null, timeouts[key].end.getTime() - now.getTime());
        }
        return cb(callback)(null, this.exists(key) ? -1 : -2);
    };

    // Return a random key from the keyspace.
    redismock.randomkey = function (callback) {
        var rando = null;
        function loop_through(count, looper) {
            var key;
            for (key in looper) {
                if (key === sets) {
                    count = loop_through(count, cache[sets]);
                    continue;
                }
                else if (key === zsets) {
                    count = loop_through(count, cache[zsets]);
                    continue;
                }
                else if (key === hashes) {
                    count = loop_through(count, cache[hashes]);
                    continue;
                }
                else if (Math.random() < 1/count) {
                    rando = key;
                }
                count += 1;
            }
            return count;
        }
        loop_through(1, cache);
        return cb(callback)(null, rando);
    };

    // Rename a key.
    redismock.rename = function (key, newkey, callback) {
        var type;
        if (!this.exists(key)) {
            return cb(callback)(new Error('ERR no such key'));
        }
        if (key === newkey) {
            return cb(callback)(null, 'OK');
        }
        type = this.type(key);
        if (type === 'string' || type === 'list') {
            cache[newkey] = cache[key];
        }
        else if (type === 'set') {
            cache[sets][newkey] = cache[sets][key];
        }
        else if (type === 'zset') {
            cache[zsets][newkey] = cache[zsets][key];
        }
        else if (type === 'hash') {
            cache[hashes][newkey] = cache[hashes][key];
        }
        // else can't occur yet...
        this.del(key);
        return cb(callback)(null, 'OK');
    };
    
    // Rename a key, only if the new key does not exist.
    redismock.renamenx = function (key, newkey, callback) {
        var r;
        if (this.exists(newkey)) {
            return cb(callback)(null, 0);
        }
        r = this.rename(key, newkey);
        if (r instanceof Error) {
            return cb(callback)(r);
        }
        return cb(callback)(null, 1);
    };

    // Create a key using the provided serialized value, previously obtained using DUMP.
    redismock.restore = function (key, ttl, serialized_value, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    // Sort the elements in a list, set, or sorted set.
    redismock.sort = function (key, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    // Get the time to live for a key.
    redismock.ttl = function (key, callback) {
        var now = new Date();
        if (timeouts[key]) {
            return cb(callback)(null, (timeouts[key].end.getTime() - now.getTime())/1000);
        }
        return cb(callback)(null, this.exists(key) ? -1 : -2);
    };

    // Determine the type stored at key.
    redismock.type = function (key, callback) {
        if (this.exists(key)) {
            var type = typeof cache[key];
            if (type === 'object') {
                if (cache[key] instanceof Array) {
                    type = 'list';
                }
            }
            else if (type === 'undefined') {
                if (key in cache[sets] && cache[sets][key]) {
                    type = 'set';
                }
                else if (key in cache[zsets] && cache[zsets][key]) {
                    type = 'zset';
                }
                else if (key in cache[hashes] && cache[hashes][key]) {
                    type = 'hash';
                }
            }
            return cb(callback)(null, type);
        }
        return cb(callback)(null, 'none');
    };

    // Incrementally iterate the keyspace.
    redismock.scan = function (cursor, callback) {
        var g = gather(this.scan).apply(null, arguments);
        var idx = 0;
        var key;
        var reply = [];
        var count, match;
        g
            .list
            .forEach(function (option, index) {
                if (option === 'count') {
                    count = g.list[index + 1];
                }
                if (option === 'match') {
                    match = new RegExp(translate(g.list[index + 1]));
                }
            });
        if (typeof count === 'undefined' || isNaN(parseInt(count, 10))) {
            count = 10;
        }
        callback = g.callback;
        for (key in cache) {
            if (cache.hasOwnProperty(key)) {
                if (key === sets || key === zsets || key === hashes) {
                    continue;
                }
                idx += 1;
                if (idx > cursor) {
                    if (!exists(match) || key.match(match)) {
                        reply.push(key);
                        if (reply.length >= count) {
                            return cb(callback)(null, [idx, reply]);
                        }
                    }
                }
            }
        }
        for (key in cache[sets]) {
            if (cache[sets].hasOwnProperty(key)) {
                idx += 1;
                if (idx > cursor) {
                    if (!exists(match) || key.match(match)) {
                        reply.push(key);
                        if (reply.length >= count) {
                            return cb(callback)(null, [idx, reply]);
                        }
                    }
                }
            }
        }
        for (key in cache[zsets]) {
            if (cache[zsets].hasOwnProperty(key)) {
                idx += 1;
                if (idx > cursor) {
                    if (!exists(match) || key.match(match)) {
                        reply.push(key);
                        if (reply.length >= count) {
                            return cb(callback)(null, [idx, reply]);
                        }
                    }
                }
            }
        }
        for (key in cache[hashes]) {
            if (cache[hashes].hasOwnProperty(key)) {
                idx += 1;
                if (idx > cursor) {
                    if (!exists(match) || key.match(match)) {
                        reply.push(key);
                        if (reply.length >= count) {
                            return cb(callback)(null, [idx, reply]);
                        }
                    }
                }
            }
        }
        if (!reply.length) {
            idx = 0;
        }
        return cb(callback)(null, [idx, reply]);
    };

    // String Commands
    // ---------------

    // Append a value to a key.
    redismock.append = function (key, value, callback) {
        return this
            .ifType(key, 'string', callback)
            .thenex(function () {
                cache[key] += value;
                return null;
            })
            .thennx(function () {
                return this.set(key, value);
            })
            .then(function () { return cache[key].length; })
            .end();
    };

    /*var hamming_weight_map = {
        0: 0,
        1: 1,
        2: 1,
        3: 2,
        4: 1,
        5: 2,
        6: 2,
        7: 3,
        8: 1,
        9: 2,
        10: 2,
        11: 3,
        12: 2,
        13: 3,
        14: 3,
        15: 4
    };*/

    // Count set bits in a string.
    redismock.bitcount = function (key, callback) {
        var g = gather(this.bitcount).apply(this, arguments);
        var start, end;
        callback = g.callback;
        if (g.list.length === 3) {
            start = g.list[1];
            end = g.list[2];
        }
        return this
            .ifType(key, 'string', callback)
            .thenex(function () {
                var idx, n, count;
                if (!exists(start)) {
                    start = 0;
                }
                if (!exists(end)) {
                    end = cache[key].length - 1;
                }
                if (end >= cache[key].length) {
                    end = cache[key].length - 1;
                }
                if (start < 0) {
                    start = cache[key].length + start;
                }
                if (end < 0) {
                    end = cache[key].length + end;
                }
                if (start > end) {
                    return 0;
                }
                count = 0;
                // TODO: Slow bit-counting, do map to do fast bit counting.
                for (idx = start; idx <= end; idx += 1) {
                    n = cache[key].charCodeAt(idx);
                    while (n) {
                        count += (n & 1);
                        n >>= 1;
                    }
                }
                return count;
            })
            .thennx(function () { return 0; })
            .end();
    };

    // Perform bitwise operations between strings.
    redismock.bitop = function (operation, destkey, key, callback) {
        var that = this;
        var g = gather(this.bitop).apply(this, arguments);
        var longest, strings, string, r;
        operation = typeof operation === 'string' ? operation.toLowerCase() : '';
        if (operation !== 'and' && operation !== 'or' && operation !== 'xor' && operation !== 'not') {
            return cb(callback)(new Error('ERR syntax error'));
        }
        callback = g.callback;
        strings = g
            .list
            .slice(2)
            .map(function (k) {
                if (that.exists(k) && that.type(k) !== 'string') {
                    return null;
                }
                return that.exists(k) ? cache[k] : '';
            });
        if (strings.some(function (str) {
            return str === null;
        })) {
            return wrongType(callback);
        }
        longest = strings.reduce(function (length, str) {
            return str.length > length ? str.length : length;
        }, 0);
        strings = strings.map(function (str) {
            while(str.length < longest) {
                str += '\0';
            }
            return str;
        });
        string = strings
            .reduce(function (cur, str, index) {
                var idx, n, s;
                s = '';
                for (idx = 0; idx < longest; idx += 1) {
                    if (operation === 'and') {
                        n = cur.charCodeAt(idx) & str.charCodeAt(idx);
                    }
                    else if (operation === 'or') {
                        n = cur.charCodeAt(idx) | str.charCodeAt(idx);
                    }
                    else if (operation === 'xor') {
                        // a XOR a = 0, so we have to avoid XOR'ing the first string with itself.
                        if (index > 0) {
                            n = cur.charCodeAt(idx) ^ str.charCodeAt(idx);
                        }
                        else {
                            n = cur.charCodeAt(idx);
                        }
                    }
                    else if (operation === 'not') {
                        n = ~cur.charCodeAt(idx);
                    }
                    s += String.fromCharCode(n);
                }
                return s;
            }, strings[0]);
        r = this.set(destkey, string);
        if (r instanceof Error) {
            return cb(callback)(r);
        }
        return cb(callback)(null, string.length);
    };

    // Find first bit set or clear in a string.
    redismock.bitpos = function (key, bit, callback) {
        var g = gather(this.bitpos).apply(this, arguments);
        var start, end;
        callback = g.callback;
        if (g.list.length > 2) {
            start = g.list[2];
            end = g.list[3];
        }
        if (typeof start === 'undefined') {
            start = 0;
        }
        if (bit !== 0 && bit !== 1) {
            return cb(callback)(new Error('ERR The bit argument must be 1 or 0.'));
        }
        return this
            .ifType(key, 'string', callback)
            .thennx(function () { 
                if (bit === 0) {
                    return 0;
                }
                return -1;
            })
            .thenex(function () {
                var idx, ch, cnt, noend = false;
                if (start < 0) {
                    start = cache[key].length + start;
                }
                if (typeof end === 'undefined') {
                    noend = true;
                    end = cache[key].length - 1;
                }
                if (end < 0) {
                    end = cache[key].length + end;
                }
                if (start > end) {
                    return -1;
                }
                for (idx = start; idx <= end; idx += 1) {
                    ch = cache[key].charCodeAt(idx);
                    cnt = 0;
                    while (cnt < 8) {
                        if (bit === 0 && (ch & 0x80) !== 0x80) {
                            return idx*8 + cnt;
                        }
                        if (bit === 1 && (ch & 0x80) === 0x80) {
                            return idx*8 + cnt;
                        }
                        ch <<= 1;
                        cnt += 1;
                    }
                }
                if (bit === 1) {
                    return -1;
                }
                if (bit === 0 && noend) {
                    return idx*8;
                }
                return -1;
            })
            .end();
    };

    redismock.decr = function (key, callback) {
        return this.decrby(key, 1, callback);
    };

    redismock.decrby = function (key, decrement, callback) {
        return this
            .ifType(key, 'string', callback)
            .thennx(function () { this.set(key, '0'); })
            .then(function () {
                var asInt = parseInt(this.get(key), 10);
                if (isNaN(asInt)) {
                    return new Error("ERR value is not an integer or out of range");
                }
                this.set(key, asInt - decrement);
                return (asInt - decrement);
            })
            .end();
    };

    redismock.get = function (key, callback) {
        if (this.type(key) === 'string') {
            return cb(callback)(null, cache[key]);
        }
        return cb(callback)(null, null);
    };

    // Returns the bit value at offset in the string value stored at key.
    redismock.getbit = function (key, offset, callback) {
        return this
            .ifType(key, 'string', callback)
            .thenex(function () {
                var n, pos;
                if (offset >= (cache[key].length*8)) {
                    return 0;
                }
                n = cache[key].charCodeAt(Math.floor(offset/8));
                pos = offset % 8;
                return (n >> pos) & 1;
            })
            .thennx(function () { return 0; })
            .end();
    };

    // Get a substring of the string stored at a key.
    redismock.getrange = function (key, start, end, callback) {
        return this
            .ifType(key, 'string', callback)
            .thenex(function () {
                var len = 0;
                if (end < 0) {
                    end = cache[key].length + end;
                }
                if (start < 0) {
                    len = end - (cache[key].length + start) + 1;
                }
                else {
                    len = end - start + 1;
                }
                return cache[key].substr(start, len);
            })
            .thennx(function () { return ""; })
            .end();
    };

    // Set the string value of a key and return its old value.
    redismock.getset = function (key, value, callback) {
        var prev = this.get(key);
        this.set(key, value);
        return cb(callback)(null, prev);
    };

    // Increment the integer value of a key by one.
    redismock.incr = function (key, callback) {
        return this.incrby(key, 1, callback);
    };

    // Increment the integer value of a key by the given amount.
    redismock.incrby = function (key, increment, callback) {
        return this
            .ifType(key, 'string', callback)
            .thennx(function () { this.set(key, '0'); })
            .then(function () {
                var asInt = parseInt(this.get(key), 10);
                if (isNaN(asInt)) {
                    return new Error("ERR value is not an integer or out of range");
                }
                this.set(key, asInt + increment);
                return (asInt + increment);
            })
            .end();
    };

    // Increment the float value of a key by the given amount.
    redismock.incrbyfloat = function (key, increment, callback) {
        return this
            .ifType(key, 'string', callback)
            .thennx(function () { this.set(key, '0'); })
            .then(function () {
                var asInt = parseFloat(this.get(key));
                if (isNaN(asInt)) {
                    return new Error("ERR value is not an integer or out of range");
                }
                this.set(key, asInt + increment);
                return this.get(key);
            })
            .end();
    };

    // Get the values of all the given keys.
    redismock.mget = function (key, callback) {
        var g = gather(this.mget).apply(this, arguments);
        callback = g.callback;
        var data = (typeof g.list[0] === 'object') ? g.list[0] : g.list;
        return cb(callback)(null, data.map(function (k) {
            return cache[k] || null;
        }));
    };

    // Set multiple keys to multiple values.
    redismock.mset = function (key, value, callback) {
        var kvs = [];
        var that = this;
        var g = gather(this.mset).apply(this, arguments);
        callback = g.callback;
        g.list.forEach(function (opt, index) {
            if (index % 2 === 0) {
                kvs.push([opt, g.list[index + 1]]);
            }
        });
        kvs.forEach(function (kv) {
            that.set(kv[0], kv[1]);
        });
        return cb(callback)(null, 'OK');
    };

    // Set multiple keys to multiple values only if none of the keys exist.
    redismock.msetnx = function (key, value, callback) {
        var kvs = [];
        var that = this;
        var g = gather(this.msetnx).apply(this, arguments);
        callback = g.callback;
        g.list.forEach(function (opt, index) {
            if (index % 2 === 0) {
                kvs.push([opt, g.list[index + 1]]);
            }
        });
        if (kvs.some(function (kv) {
            return that.exists(kv[0]);
        })) {
            return cb(callback)(null, 0);
        }
        kvs.forEach(function (kv) {
            that.set(kv[0], kv[1]);
        });
        return cb(callback)(null, 1);
    };

    // Set the value and expiration in milliseconds of a key.
    redismock.psetex = function (key, milliseconds, value, callback) {
        this.set(key, value);
        this.pexpire(key, milliseconds);
        return cb(callback)(null, 'OK');
    };

    // Set the string value of a key.
    redismock.set = function (key, value, callback) {
        var nx = false, xx = false, ex = -1, px = -1;
        var g = gather(this.set).apply(this, arguments);
        callback = g.callback;
        g
            .list
            .forEach(function (opt, index) {
                if (opt === 'nx' || opt === 'NX') {
                    nx = true;
                }
                else if (opt === 'xx' || opt === 'XX') {
                    xx = true;
                }
                else if (opt === 'ex' || opt === 'EX') {
                    ex = g.list[index + 1];
                }
                else if (opt === 'px' || opt === 'PX') {
                    px = g.list[index + 1];
                }
            });
        if (nx) {
            if (this.exists(key)) {
                return cb(callback)(null, null);
            }
        }
        if (xx) {
            if (!this.exists(key)) {
                return cb(callback)(null, null);
            }
        }
        cache[key] = exists(value) ? value.toString() : '';
        if (px !== -1) {
            redismock.pexpire(key, px);
        }
        if (ex !== -1) {
            redismock.expire(key, ex);
        }
        return cb(callback)(null, 'OK');
    };

    // Sets or clears the bit at offset in the string value stored at key.
    redismock.setbit = function (key, offset, value, callback) {
        return this
            .ifType(key, 'string', callback)
            .thennx(function () {
                cache[key] = '';
            })
            .then(function () {
                var byteIdx = Math.floor(offset/8);
                var bitIdx = offset % 8;
                var idx, bit, mask;
                var code;
                if (value !== 0 && value !== 1) {
                    return new Error('ERR bit is not an integer or out of range');
                }
                while (cache[key].length < byteIdx + 1) {
                    cache[key] += '\0';
                }
                code = cache[key].charCodeAt(byteIdx);
                idx = 0;
                mask = 0x80;
                while (idx < bitIdx) {
                    mask >>= 1;
                    idx += 1;
                }
                bit = (code & mask) === 0 ? 0 : 1;
                if (value === 0) {
                    code = code & (~mask);
                }
                else {
                    code = code | mask;
                }
                cache[key] = cache[key].substr(0, byteIdx) + String.fromCharCode(code) + cache[key].substr(byteIdx + 1);
                return bit;
            })
            .end();
    };

    // Set the value and expiration of a key.
    redismock.setex = function (key, seconds, value, callback) {
        this.set(key, value);
        this.expire(key, seconds);
        return cb(callback)(null, 'OK');
    };

    // Set the value of the key only if the key does not exist.
    redismock.setnx = function (key, value, callback) {
        if (!this.exists(key)) {
            this.set(key, value);
            return cb(callback)(null, 1);
        }
        return cb(callback)(null, 0);
    };
    
    // Overwrite part of the string at key starting at the specified offset.
    redismock.setrange = function (key, offset, value, callback) {
        return this
            .ifType(key, 'string', callback)
            .thennx(function () {
                cache[key] = '';
            })
            .then(function () {
                var idx, newValue;
                if (cache[key].length < offset + value.length - 1) {
                    for (idx = cache[key].length; idx < offset + value.length; idx += 1) {
                        cache[key] += '\0';
                    }
                }
                newValue = cache[key].substr(0, offset);
                for (idx = offset; idx < offset + value.length; idx += 1) {
                    newValue += value[idx - offset];
                }
                newValue += cache[key].substr(offset + value.length);
                cache[key] = newValue;
                return cache[key].length;
            })
            .end();
    };

    // Get the length of the value stored in a key.
    redismock.strlen = function (key, callback) {
        if (!this.exists(key)) {
            return cb(callback)(null, 0);
        }
        return this
            .ifType(key, 'string', callback)
            .thenex(function () { return cache[key].length; })
            .thennx(function () { return 0; })
            .end();
    };

    // List Commands
    // -------------

    redismock.blpop = function (key, timeout, callback) {
        var that = this;
        var g = gather(this.blpop).apply(null, arguments);
        var keys = g.list.slice(0, g.list.length - 1);
        timeout = g.list[g.list.length - 1];
        callback = g.callback;
        var f, timedout = false;
        f = function () {
            if (timedout) {
                return cb(callback)(null, null);
            }
            if (keys.some(function (k) {
                var len = that.llen(k);
                if (len instanceof Error) {
                    cb(callback)(len);
                    return true;
                }
                if (len > 0) {
                    that.lpop(k, callback);
                    return true;
                }
                return false;
            })) {
                return;
            }
            setImmediate(f);
        };
        if (timeout > 0) {
            setTimeout(function () {
                timedout = true;
            }, timeout*1000);
        }
        setImmediate(f);
        return this;
    };

    redismock.brpop = function (key, timeout, callback) {
       var that = this;
        var g = gather(this.blpop).apply(null, arguments);
        var keys = g.list.slice(0, g.list.length - 1);
        var f, timedout = false;
        timeout = g.list[g.list.length - 1];
        callback = g.callback;
        f = function () {
            if (timedout) {
                return cb(callback)(null, null);
            }
            if (keys.some(function (k) {
                var len = that.llen(k);
                if (len instanceof Error) {
                    cb(callback)(len);
                    return true;
                }
                if (len > 0) {
                    that.rpop(k, callback);
                    return true;
                }
                return false;
            })) {
                return;
            }
            setImmediate(f);
        };
        if (timeout > 0) {
            setTimeout(function () {
                timedout = true;
            }, timeout*1000);
        }
        setImmediate(f);
        return this;
    };

    redismock.brpoplpush = function (source, destination, timeout, callback) {
        var that = this;
        var f, timedout = false;
        f = function () {
            var len;
            if (timedout) {
                return cb(callback)(null, null);
            }
            len = that.llen(source);
            if (len instanceof Error) {
                return cb(callback)(len);
            }
            if (len > 0) {
                that.rpoplpush(source, destination, callback);
                return;
            }
            setImmediate(f);
        };
        if (timeout > 0) {
            setTimeout(function () {
                timedout = true;
            }, timeout*1000);
        }
        setImmediate(f);
        return this;
    };

    redismock.lindex = function (key, i, callback) {
        var elem = null;
        return this
            .ifType(key, 'list', callback)
            .thenex(function () {
                if (i >= 0 && i < cache[key].length) {
                    elem = cache[key][i];
                }
                else if (i < 0 && cache[key].length + 1 >= 0) {
                    elem = cache[key][cache[key].length + i];
                }
            })
            .then(function () { return elem; })
            .end();
    };

    redismock.linsert = function (key, beforeafter, pivot, value, callback) {
        return this
            .ifType(key, 'list', callback)
            .thenex(function () {
                var idx = cache[key].indexOf(pivot);
                if (idx !== -1) {
                    if (beforeafter === 'before') {
                        cache[key].splice(idx, 0, value);
                    }
                    else if (beforeafter === 'after') {
                        cache[key].splice(idx + 1, 0, value);
                    }
                    return cache[key].length;
                }
                return -1;
            })
            .thennx(function () { return 0; })
            .end();
    };

    redismock.llen = function (key, callback) {
        return this
            .ifType(key, 'list', callback)
            .thenex(function () { return cache[key].length; })
            .thennx(function () { return 0; })
            .end();
    };

    redismock.lpop = function (key, callback) {
        return this
            .ifType(key, 'list', callback)
            .thenex(function () { 
                var popped = cache[key].shift();
                if (!cache[key].length) {
                    this.del(key);
                }
                return popped;
            })
            .thennx(function () { return null; })
            .end();
    };

    redismock.lpush = function (key, element, callback) {
        var g = gather(this.lpush).apply(this, arguments);
        callback = g.callback;
        return this
            .ifType(key, 'list', callback)
            .thennx(function () { cache[key] = new redismock.Array(); })
            .then(function () {
                g.list.slice(1).forEach(function (elem) {
                    cache[key].unshift(elem);
                });
                return cache[key].length;
            })
            .end();
    };

    redismock.lpushx = function (key, element, callback) {
        return this
            .ifType(key, 'list', callback)
            .thenex(function () {
                cache[key].unshift(element);
                return cache[key].length;
            })
            .thennx(function () { return 0; })
            .end();
    };

    redismock.lrange = function (key, start, end, callback) {
        var l = [];
        return this
            .ifType(key, 'list', callback)
            .thenex(function () {
                if (start > cache[key].length - 1) {
                    l = [];
                }
                else {
                    if (start < 0) {
                        start = cache[key].length + start;
                    }
                    if (end < 0) {
                        end = cache[key].length + end;
                    }
                    if (start > end) {
                        l = [];
                    }
                    else {
                        l = cache[key].slice(start, end + 1);
                    }
                }
            })
            .then(function () { return l; })
            .end();
    };

    redismock.lrem = function (key, count, element, callback) {
        var cnt = 0;
        return this
            .ifType(key, 'list', callback)
            .thenex(function () {
                var idx;
                while (true) {
                    idx = cache[key].indexOf(element);
                    if (idx === -1) {
                        break;
                    }
                    cache[key].splice(idx, 1);
                    cnt += 1;
                    if (count > 0 && cnt === count) {
                        break;
                    }
                }
                if (!cache[key].length) {
                    this.del(key);
                }
            })
            .then(function () { return cnt; })
            .end();
    };

    redismock.lset = function (key, index, element, callback) {
        return this
            .ifType(key, 'list', callback)
            .thenex(function () { 
                if (index >= cache[key].length) {
                    return new Error('ERR index out of range');
                }
                cache[key][index] = element;
                return 'OK';
            })
            .thennx(function () { return new Error('ERR no such key'); })
            .end();
    };

    redismock.ltrim = function (key, start, end, callback) {
        return this
            .ifType(key, 'list', callback)
            .thenex(function () {
                var tmpS, tmpE;
                if (start > cache[key].length - 1 || start > end) {
                    cache[key] = new redismock.Array();
                }
                else {
                    if (start < 0 && end < 0) {
                        tmpE = cache[key].length + end;
                        tmpS = cache[key].length + start;
                        if (tmpS < 0) {
                            tmpS = 0;
                        }
                        start = tmpS;
                        end = tmpE;
                    }
                    if (end > cache[key].length - 1) {
                        end = cache[key].length - 1;
                    }
                    cache[key] = cache[key].slice(start, end + 1);
                }
            })
            .then(function () { 
                if (this.exists(key) && !cache[key].length) {
                    this.del(key);
                }
                return 'OK';
            })
            .end();
    };

    redismock.rpop = function (key, callback) {
        return this
            .ifType(key, 'list', callback)
            .thenex(function () { 
                var popped = cache[key].pop(); 
                if (!cache[key].length) {
                    this.del(key);
                }
                return popped;
            })
            .thennx(function () { return null; })
            .end();
    };

    redismock.rpoplpush = function (source, dest, callback) {
        var element = null, reply;
        if (this.exists(source) && this.type(source) !== 'list') {
            return wrongType(callback);
        }
        if (this.exists(dest) && this.type(dest) !== 'list') {
            return wrongType(callback);
        }
        element = this.rpop(source);
        if (element instanceof Error) {
            return cb(callback)(element);
        }
        if (element) {
            reply = this.lpush(dest, element);
            if (reply instanceof Error) {
                return cb(callback)(reply);
            }
        }
        return cb(callback)(null, element);
    };

    redismock.rpush = function (key, element, callback) {
        var g = gather(this.rpush).apply(this, arguments);
        callback = g.callback;
        return this
            .ifType(key, 'list', callback)
            .thennx(function () { cache[key] = new redismock.Array(); })
            .then(function () {
                cache[key] = cache[key].concat(g.list.slice(1));
                return cache[key].length;
            })
            .end();
    };

    redismock.rpushx = function (key, element, callback) {
        return this
            .ifType(key, 'list', callback)
            .thenex(function () {
                cache[key].push(element);
                return cache[key].length;
            })
            .thennx(function () { return 0; })
            .end();
    };

    // Set Commands
    // ------------

    redismock.sadd = function (key, member, callback) {
        var g = gather(this.sadd).apply(this, arguments);
        var count = 0;
        callback = g.callback;
        return this
            .ifType(key, 'set', callback)
            .thennx(function () { cache[sets][key] = {}; })
            .then(function () {
                g.list.slice(1).forEach(function (m) {
                    m = m ? m.toString() : '';
                    if (m.length === 0) {
                        return;
                    }
                    if (!(m in cache[sets][key])) {
                        cache[sets][key][m] = '';
                        count += 1;
                    }
                });
                return count;
            })
            .end();
    };

    redismock.scard = function (key, callback) {
        return this
            .ifType(key, 'set', callback)
            .thenex(function () { return Object.keys(cache[sets][key]).length; })
            .thennx(function () { return 0; })
            .end();
    };

    redismock.sdiff = function (key, callback) {
        var that = this;
        var g = gather(this.sdiff).apply(this, arguments);
        callback = g.callback;
        if (!g.list.every(function (k) {
            return that.type(k) === 'set' || that.type(k) === 'none';
        })) {
            return wrongType(callback);
        }
        return this
            .ifType(key, 'set', callback)
            .thennx(function () {
                return [];
            })
            .thenex(function () {
                return g
                    .list
                    .slice(1)
                    .reduce(function (diff, k) {
                        return diff.filter(function (d) {
                            return !(d in cache[sets][k]);
                        });
                    }, this.smembers(g.list[0]));
            })
            .end();
    };
    
    redismock.sdiffstore = function (destination, key, callback) {
        var g = gather(this.sdiffstore).apply(this, arguments);
        var diff = this.sdiff.apply(this, g.list.slice(1));
        callback = g.callback;
        if (diff instanceof Error) {
            return cb(callback)(diff);
        }
        if (this.exists(destination)) {
            this.del(destination);
        }
        this.sadd.apply(this, [destination].concat(diff));
        return cb(callback)(null, diff.length);
    };

    redismock.sinter = function (key, callback) {
        var that = this;
        var g = gather(this.sdiff).apply(this, arguments);
        callback = g.callback;
        if (!g.list.every(function (k) {
            return that.type(k) === 'set' || that.type(k) === 'none';
        })) {
            return wrongType(callback);
        }
        return this
            .ifType(key, 'set', callback)
            .thennx(function () {
                return [];
            })
            .thenex(function () {
                return g
                    .list
                    .slice(1)
                    .reduce(function (inter, k) {
                        return inter.filter(function (i) {
                            return i in cache[sets][k];
                        });
                    }, this.smembers(g.list[0]));
            })
            .end();
    };

    redismock.sinterstore = function (destination, key, callback) {
        var that = this;
        var g = gather(this.sinterstore).apply(this, arguments);
        var inter = this.sinter.apply(this, g.list.slice(1));
        callback = g.callback;
        if (inter instanceof Error) {
            return cb(callback)(inter);
        }
        if (this.exists(destination)) {
            this.del(destination);
        }
        inter.forEach(function (member) {
            that.sadd(destination, member);
        });
        return cb(callback)(null, inter.length);
    };

    redismock.sismember = function (key, member, callback) {
        return this
            .ifType(key, 'set', callback)
            .thenex(function () { return member in cache[sets][key] ? 1 : 0; })
            .thennx(function () { return 0; })
            .end();
    };

    redismock.smembers = function (key, callback) {
        return this
            .ifType(key, 'set', callback)
            .thenex(function () { return Object.keys(cache[sets][key]); })
            .thennx(function () { return []; })
            .end();
    };

    redismock.smove = function (source, dest, member, callback) {
        var r, e;
        if (this.exists(source) && this.type(source) !== "set") {
            return wrongType(callback);
        }
        if (this.exists(dest) && this.type(dest) !== "set") {
            return wrongType(callback);
        }
        r = redismock.srem(source, member);
        if (r instanceof Error) {
            return cb(callback)(r);
        }
        if (r === 1) {
            e = redismock.sadd(dest, member);
            if (e instanceof Error) {
                return cb(callback)(e);
            }
        }
        return cb(callback)(null, r);
    };

    redismock.spop = function (key, callback) {
        var r;
        var rando = this.srandmember(key);
        if (rando instanceof Error) {
            return cb(callback)(rando);
        }
        r = this.srem(key, rando);
        if (r instanceof Error) {
            return cb(callback)(r);
        }
        return cb(callback)(null, rando);
    };

    redismock.srandmember = function (key, callback) {
        var that = this;
        var count;
        if (arguments.length === 2 && typeof callback !== "function") {
            count = callback;
            callback = null;
        }
        if (arguments.length === 3) {
            count = callback;
            callback = arguments[2];
        }
        return this
            .ifType(key, 'set', callback)
            .thenex(function () {
                var k = Object.keys(cache[sets][key]);
                var randos, rando;
                var len = that.scard(key);
                if (count === 0) {
                    return null;
                }
                if (count) {
                    randos = [];
                    while (randos.length < Math.abs(count)) {
                        rando = k[Math.floor(Math.random() * k.length)];
                        if (count < 0) {
                            randos.push(rando);
                        }
                        else {
                            if (randos.indexOf(rando) === -1) {
                                randos.push(rando);
                                if (randos.length === len) {
                                    break;
                                }
                            }
                        }
                    }
                    return randos;
                }
                return k[Math.floor(Math.random() * k.length)];
            })
            .thennx(function () { return null; })
            .end();
    };

    redismock.srem = function (key, member, callback) {
        var g = gather(this.srem).apply(this, arguments);
        var count = 0;
        callback = g.callback;
        return this
            .ifType(key, 'set', callback)
            .thenex(function () {
                g.list.slice(1).forEach(function (m) {
                    var k = m ? m.toString() : '';
                    if (k in cache[sets][key]) {
                        delete cache[sets][key][k];
                        count += 1;
                    }
                });
                if (!Object.keys(cache[sets][key]).length) {
                    this.del(key);
                }
            })
            .then(function () { return count; })
            .end();
    };

    redismock.sunion = function (key, callback) {
        var that = this;
        var g = gather(this.sdiff).apply(this, arguments);
        callback = g.callback;
        if (!g.list.every(function (k) {
            return that.type(k) === 'set' || that.type(k) === 'none';
        })) {
            return wrongType(callback);
        }
        return this
            .ifType(key, 'set', callback)
            .thennx(function () {
                return [];
            })
            .thenex(function () {
                return Object
                    .keys(g
                          .list
                          .reduce(function (set, k) {
                              Object
                                  .keys(cache[sets][k])
                                  .filter(function (u) {
                                      return !(u in set);
                                  })
                                  .forEach(function (u) {
                                      set[u] = '';
                                  });
                              return set;
                          }, {}));
            })
            .end();
    };

    redismock.sunionstore = function (destination, key, callback) {
        var that = this;
        var g = gather(this.sunionstore).apply(this, arguments);
        var union = this.sunion.apply(this, g.list.slice(1));
        callback = g.callback;
        if (union instanceof Error) {
            return cb(callback)(union);
        }
        if (this.exists(destination)) {
            this.del(destination);
        }
        union.forEach(function (member) {
            that.sadd(destination, member);
        });
        return cb(callback)(null, union.length);
    };

    redismock.sscan = function (key, cursor, callback) {
        var g = gather(this.sscan).apply(this, arguments);
        var count, match;
        g
            .list
            .forEach(function (option, index) {
                if (option === 'count') {
                    count = g.list[index + 1];
                }
                if (option === 'match') {
                    match = new RegExp(translate(g.list[index + 1]));
                }
            });
        if (typeof count === 'undefined' || isNaN(parseInt(count, 10))) {
            count = 10;
        }
        callback = g.callback;
        return this
            .ifType(key, 'set', callback)
            .then(function () {
                var arr = [];
                this
                    .smembers(key)
                    .slice(cursor)
                    .some(function (member) {
                        if (typeof match === 'undefined' || member.match(match)) {
                            arr.push(member);
                        }
                        cursor += 1;
                        return arr.length >= count;
                    });
                if (!arr.length) {
                    cursor = 0;
                }
                return [cursor, arr];
            })
            .end();
    };

    // Connection Commands
    // -------------------

    redismock.auth = function (password, callback) {
        if (!redismock.password) {
            return cb(callback)(new Error('ERR Client sent AUTH, but no password is set'));
        }
        if (password === redismock.password ) {
            return cb(callback)(null, 'OK');
        }
        return cb(callback)(new Error('ERR invalid password'));
    };

    redismock.echo = function (message, callback) {
        return cb(callback)(null, message);
    };

    redismock.ping = function (callback) {
        return cb(callback)(null, "PONG");
    };

    redismock.quit = function (callback) {
        return cb(callback)(null, "OK");
    };

    redismock.select = function (index, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.createClient = function () {
        return redismock.copy();
    };

    // Server Commands
    // ---------------

    redismock.bgrewriteaof = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.bgsave = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.client_kill = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.client_list = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.client_getname = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.client_pause = function (timeout, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.client_setname = function (connection_name, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.cluster_slots = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.command = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.command_count = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.command_getkeys = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.command_info = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.config_get = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.config_rewrite = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.config_set = function (parameter, value, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.config_resetstat = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.dbsize = function (callback) {
        var count = 0, key;
        for (key in cache) {
            if (key === sets || key === zsets || key === hashes) {
                continue;
            }
            if (cache.hasOwnProperty(key)) {
                count += 1;
            }
        }
        for (key in cache[sets]) {
            if (cache[sets].hasOwnProperty(key)) {
                count += 1;
            }
        }
        for (key in cache[zsets]) {
            if (cache[zsets].hasOwnProperty(key)) {
                count += 1;
            }
        }
        for (key in cache[hashes]) {
            if (cache[hashes].hasOwnProperty(key)) {
                count += 1;
            }
        }
        return cb(callback)(null, count);
    };

    redismock.debug_object = function (key, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.debug_segfault = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.flushall = function (callback) {
        // TODO: right now, just flushdb, but in the future, flush all dbs.
        return this.flushdb(callback);
    };

    redismock.flushdb = function (callback) {
        cache = {};
        cache[sets] = {};
        cache[zsets] = {};
        cache[hashes] = {};
        Object.keys(timeouts).forEach(function (key) {
            if (timeouts[key]) {
                clearTimeout(timeouts[key].timeout);
            }
        });
        timeouts = {};
        return cb(callback)(null, 'OK');
    };

    redismock.info = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.lastsave = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.monitor = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.role = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.save = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.shutdown = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.slaveof = function (host, port, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.slowlog = function (subcommand, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.sync = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.time = function (callback) {
        var now = new Date();
        var epoch = now.getTime();
        var us;
        if (root.performance) {
            if (root.performance.now) {
                now = root.performance.now();
                us = (now - Math.floor(now)) * 100000;
            }
            else if (root.performance.webkitNow) {
                now = root.performance.webkitNow();
                us = (now - Math.floor(now)) * 100000;
            }
            else {
                us = 0;
            }
        }
        else if (typeof process !== 'undefined' && process.hrtime) {
            us = process.hrtime()[1] / 1000;
        }
        else {
            us = 0;
        }
        return cb(callback)(null, [epoch, us]); 
    };

    // Modifications
    // -------------

    var modifiers = ['del', 'mset', 'msetnx', 'psetex', 'set', 'setbit', 'setex', 'setrange', 'incr', 'decr', 'incrby', 'decrby', 'incrbyfloat', 'blpop', 'brpop', 'brpoplpush', 'linsert', 'lpush', 'lpushx', 'rpush', 'rpushx', 'lpop', 'rpop', 'rpoplpush', 'ltrim', 'lset', 'lrem', 'sadd', 'smove', 'spop', 'sdiffstore', 'sinterstore', 'srem', 'sunionstore', 'zadd', 'zrem', 'zunionstore', 'zinterstore', 'zincrby', 'zremrangebylex', 'zremrangebyrank', 'zremrangebyscore', 'hdel', 'hincrby', 'hincrbyfloat', 'hset', 'hmset', 'hsetnx']; // TODO: Add the rest.
    var capture = {};
    var fkeys = [];
    for (var key in redismock) {
        if (typeof redismock[key] === "function") {
            fkeys.push(key);
            capture[key] = redismock[key];
        }
    }
    // Have each function check its formal parameter list against its argument length
    // and return an error if there are not enough arguments;
    fkeys.forEach(function (key) {
        redismock[key] = function () {
            if (arguments.length < capture[key].length - 1) {
                return cb(arguments[arguments.length - 1])(new Error('ERR wrong number of arguments for \'' + key + '\' command'));
            }
            return capture[key].apply(this, arguments);
        };
    });
    // For each function that modifies the database, splice in the watchers to get
    // the modification and potentially not execute a multi.
    modifiers.forEach(function (modifier) {
        var mod = redismock[modifier];
        redismock[modifier] = function () {
            var key = arguments[0];
            if (exists(watchers[key])) {
                watchers[key].modified = true;
            }
            // TODO: Multi-key commands.
            return mod.apply(this, arguments);
        };
    });
    function toPromise(f, context, deferFactory) {
        return function () {
            // Remove the formal callback parameter and make it a promise instead.
            var args = Array.prototype.slice.call(arguments);
            var deferred = deferFactory(), promise;
            var callback;
            while (args.length < f.length - 1) {
                args.push(undefined);
            }
            if (typeof args[args.length - 1] === 'function') {
                // Hm, someone passed in the callback, so we should probably honor it when we can.
                callback = args[args.length - 1];
                args.pop();
            }
            args.push(function (err, reply) {
                if (err) {
                    if (callback && typeof callback === 'function') {
                        callback(err);
                    }
                    return deferred.reject(err);
                }
                if (callback && typeof callback === 'function') {
                    callback(null, reply);
                }
                deferred.resolve(reply);
            });
            f.apply(context, args);
            promise = deferred.promise;
            if (typeof promise === 'function') {
                promise = promise();
            }
            return promise;
        };
    }
    redismock.toPromiseStyle = function (deferFactory) {
        var that = this;
        return Object
            .keys(this)
            .filter(function (key) {
                return typeof that[key] === 'function' && key !== 'multi';
            })
            .map(function (key) {
                return [key, toPromise(that[key], that, deferFactory)];
            })
            .reduce(function (promised, f) {
                promised[f[0]] = f[1];
                return promised;
            }, {multi: this.multi});
    };

    redismock.copy = function () {
        var copied = {};
        fkeys.forEach(function (key) {
            copied[key] = function () {
                return redismock[key].apply(copied, arguments);
            };
        });
        copied.toPromiseStyle = redismock.toPromiseStyle;
        copied.listeners = {};
        return copied;
    };

    redismock.toNodeRedis = function () {
        if (typeof require !== 'function') {
            return redismock;
        }
        var redis = require('redis');
        var client = redis.createClient.apply(redis, arguments);
        var rc = redismock.copy();
        var key, keys = [];
        for (key in client) {
            if (typeof client[key] === 'function') {
                keys.push(key);
            }
        }
        keys.forEach(function (k) {
            rc[k] = function () {
                return client[k].apply(client, arguments);
            };
        });
        rc.createClient = function () {
            return redismock.toNodeRedis.apply(rc, arguments);
        };
        return rc;
    };

    redismock.unref = function () {
      // noop, but required for API compatibility
    };

    if (typeof process !== 'undefined' && process.env.REDIS_JS_TO_NODE_REDIS === '1') {
        var asNodeRedis;
        var node_redis_args = [];
        if (process.env.REDIS_JS_NODE_REDIS_PORT) {
            node_redis_args.push(process.env.REDIS_JS_NODE_REDIS_PORT);
        }
        if (process.env.REDIS_JS_NODE_REDIS_HOST) {
            node_redis_args.push(process.env.REDIS_JS_NODE_REDIS_HOST);
        }
        if (process.env.REDIS_JS_NODE_REDIS_OPTIONS) {
            node_redis_args.push(JSON.parse(process.env.REDIS_JS_NODE_REDIS_OPTIONS));
        }
        asNodeRedis = redismock.toNodeRedis.apply(redismock, node_redis_args);
        if (typeof exports !== 'undefined') {
            if (typeof module !== 'undefined' && module.exports) {
                exports = module.exports = asNodeRedis;
            }
            exports.redismock = asNodeRedis;
        } 
        else {
            root.redismock = asNodeRedis;
        }
    }

}).call(this);
