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
    var mySubscriptions = {};
    var watchers = {};
    var sets = 'sets-' + Math.random();
    var zsets = 'zsets-' + Math.random();
    var hashes = 'hashes-' + Math.random();
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

    var gather = function (f, e) {
        var end = f.length;
        if (e) {
            end = e;
        }
        return function () {
            var idx, len = arguments.length;
            var callback;
            var list = [arguments[end - 2]];
            if (len >= end) {
                for (idx = end - 1; idx < len; idx += 1) {
                    if (typeof arguments[idx] === "function") {
                        callback = arguments[idx];
                    }
                    else if (arguments[idx] !== null && arguments[idx] !== undefined) {
                        list.push(arguments[idx]);
                    }
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

    var stepthrough = function (arr1, arr2, f) {
        var idx1 = 0, idx2 = 0, r;
        while (idx1 < arr1.length && idx2 < arr2.length) {
            r = f(arr1[idx1], arr2[idx2], idx1, idx2);
            if (r < 0) {
                idx1 += 1;
            }
            else if (r > 0) {
                idx2 += 1;
            }
            else {
                idx1 += 1;
                idx2 += 1;
            }
        }
    };

    // Keys Commands
    // -------------

    // Delete a key
    redismock.del = function (key, callback) {
        var that = this;
        var count = 0;
        var g = gather(this.del).apply(this, arguments);
        callback = g.callback;
        g.list.forEach(function (key) {
            if (that.exists(key)) {
                if (key in cache) {
                    cache[key] = undefined;
                }
                else if (key in cache[sets]) {
                    cache[sets][key] = undefined;
                }
                else if (key in cache[zsets]) {
                    cache[zsets][key] = undefined;
                }
                else if (key in cache[hashes]) {
                    cache[hashes][key] = undefined;
                }
                count += 1;
            }
        });
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
        // Return the Nth key with probability 1/N.
        var n = 1;
        for (var key in cache) {
            if (cache.hasOwnProperty(key)) {
                if (Math.random() < 1/n) {
                    if (key === sets) {
                        for (var setkey in cache[sets]) {
                            return cb(callback)(null, setkey);
                        }
                        return cb(callback)(null, null);
                    }
                    if (key === zsets) {
                        for (var zsetkey in cache[zsets]) {
                            return cb(callback)(null, zsetkey);
                        }
                        return cb(callback)(null, null);
                    }
                    if (key === hashes) {
                        for (var hashkey in cache[zsets]) {
                            return cb(callback)(null, hashkey);
                        }
                        return cb(callback)(null, null);
                    }
                    return cb(callback)(null, key);
                }
                n += 1;
            }
        }
        return cb(callback)(null, null);
    };

    // Rename a key.
    redismock.rename = function (key, newkey, callback) {
        var val, type;
        if (!this.exists(key)) {
            return cb(callback)(new Error('ERR no such key'));
        }
        if (key === newkey) {
            return cb(callback)(null, 'OK');
        }
        type = this.type(key);
        if (type === 'string' || type === 'list') {
            val = cache[key];
        }
        else if (type === 'set') {
            val = cache[sets][key];
        }
        else if (type === 'zset') {
            val = cache[zsets][key];
        }
        else if (type === 'hash') {
            val = cache[hashes][key];
        }
        // else can't occur yet...
        cache[newkey] = val;
        this.del(key);
        return cb(callback)(null, 'OK');
    };
    
    // Rename a key, only if the new key does not exist.
    redismock.renamenx = function (key, newkey, callback) {
        if (this.exists(newkey)) {
            return cb(callback)(null, 0);
        }
        return this.rename(key, newkey, callback);
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
        return cb(callback)(new Error('UNIMPLEMENTED'));
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
        var g = gather(this.bitpos, 3).apply(this, arguments);
        var start, end;
        callback = g.callback;
        if (g.list.length > 1) {
            start = g.list[1];
            end = g.list[2];
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
        return cb(callback)(null, g.list.map(function (k) {
            return cache[k] || null;
        }));
    };

    // Set multiple keys to multiple values.
    redismock.mset = function (key, value, callback) {
        var kvs = [];
        var that = this;
        var g = gather(this.mset, 2).apply(this, arguments);
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
        var g = gather(this.msetnx, 2).apply(this, arguments);
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
        g.list.forEach(function (opt, index) {
            if (opt === 'nx') {
                nx = true;
            }
            else if (opt === 'xx') {
                xx = true;
            }
            else if (opt === 'ex') {
                ex = g.list[index + 1];
            }
            else if (opt === 'px') {
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
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.brpop = function (key, timeout, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.brpoplpush = function (source, destination, timeout, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
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
            .thenex(function () { return cache[key].shift(); })
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
                cache[key] = g.list.concat(cache[key]);
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
            .thenex(function () { return cache[key].pop(); })
            .thennx(function () { return null; })
            .end();
    };

    redismock.rpoplpush = function (source, dest, callback) {
        var element, reply;
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
                cache[key] = cache[key].concat(g.list);
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
                g.list.forEach(function (m) {
                    m = m ? m.toString() : '';
                    if (m.length === 0) {
                        return;
                    }
                    if (!(m in cache[sets][key])) {
                        cache[sets][key][m] = m;
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
                        var members = that.smembers(k).sort();
                        stepthrough(diff, members, function (d, m, di) {
                            if (d < m) {
                                return -1;
                            }
                            if (d > m) {
                                return 1;
                            }
                            diff.splice(di, 1);
                            return 0;
                        });
                        return diff;
                    }, this.smembers(g.list[0]).sort());
            })
            .end();
    };
    
    redismock.sdiffstore = function (destination, key, callback) {
        var g = gather(this.sdiffstore).apply(this, arguments);
        var diff = this.sdiff.apply(this, g.list);
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
                        var result = [];
                        var members = that.smembers(k).sort();
                        stepthrough(inter, members, function (i, m) {
                            if (i < m) {
                                return -1;
                            }
                            if (i > m) {
                                return 1;
                            }
                            result.push(i);
                            return 0;
                        });
                        return result;
                    }, this.smembers(g.list[0]).sort());
            })
            .end();
    };

    redismock.sinterstore = function (destination, key, callback) {
        var g = gather(this.sinterstore).apply(this, arguments);
        var inter = this.sinter.apply(this, g.list);
        callback = g.callback;
        if (inter instanceof Error) {
            return cb(callback)(inter);
        }
        if (this.exists(destination)) {
            this.del(destination);
        }
        this.sadd.apply(this, [destination].concat(inter));
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
        r = redismock.srem(source, member);
        if (r instanceof Error) {
            return cb(callback)(r);
        }
        e = redismock.sadd(dest, member);
        if (e instanceof Error) {
            return cb(callback)(e);
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
                var idx, randos;
                if (count === 0) {
                    return null;
                }
                if (count) {
                    randos = [];
                    for (idx = 0; idx < Math.abs(count); idx += 1) {
                        randos.push(cache[sets][key][k[Math.floor(Math.random() * k.length)]]);
                    }
                    return randos;
                }
                return cache[sets][key][k[Math.floor(Math.random() * k.length)]];
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
                g.list.forEach(function (m) {
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
                return g
                    .list
                    .slice(1)
                    .reduce(function (union, k) {
                        var result = [];
                        var members = that.smembers(k);
                        var dupes = [];
                        union = union.concat(members).sort();
                        stepthrough(union, union, function (u1, u2, i1, i2) {
                            if (i1 === i2) {
                                return 1;
                            }
                            if (u1 === u2) {
                                dupes.push(i2);
                            }
                            return 0;
                        });
                        if (dupes.length) {
                            stepthrough(union, dupes, function (u, du, iu) {
                                if (iu === du) {
                                    return 0;
                                }
                                result.push(u);
                                return -1;
                            });
                            result = result.concat(union.slice(dupes[dupes.length - 1] + 1));
                        }
                        return result;
                    }, this.smembers(g.list[0]).sort());
            })
            .end();
    };

    redismock.sunionstore = function (destination, key, callback) {
        var g = gather(this.sunionstore).apply(this, arguments);
        var union = this.sunion.apply(this, g.list);
        callback = g.callback;
        if (union instanceof Error) {
            return cb(callback)(union);
        }
        if (this.exists(destination)) {
            this.del(destination);
        }
        this.sadd.apply(this, [destination].concat(union));
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
                return [cursor, arr];
            })
            .end();
    };

    // Sorted Set Commands
    // -------------------

    redismock.zadd = function (key, score, member, callback) {
        var g = gather(this.zadd, 3).apply(this, arguments);
        callback = g.callback;
        return this
            .ifType(key, 'zset', callback)
            .thennx(function () { cache[zsets][key] = {scores: [], set: {}}; })
            .then(function () {
                var count = 0;
                g
                    .list
                    .map(function (elem, index) {
                        if (index % 2 === 0) {
                            return [parseFloat(g.list[index]), g.list[index + 1]];
                        }
                        return null;
                    })
                    .filter(function (elem) {
                        return elem !== null;
                    })
                    .forEach(function (sm) {
                        var score = sm[0];
                        var m = sm[1];
                        var noop = false;
                        if (!cache[zsets][key].set[score]) {
                            cache[zsets][key].scores.push(score);
                            cache[zsets][key].set[score] = new redismock.Array();
                        }
                        cache[zsets][key]
                            .scores
                            .map(function (score) {
                                return [score, cache[zsets][key].set[score].indexOf(m)];
                            })
                            .filter(function (si) {
                                return si[1] !== -1;
                            })
                            .forEach(function (si) {
                                if (si[0] !== score) {
                                    cache[zsets][key].set[si[0]].splice(si[1], 1);
                                }
                                else {
                                    noop = true;
                                }
                            });
                        if (!noop) {
                            cache[zsets][key].set[score].push(m);
                            count += 1;
                        }
                    });
                cache[zsets][key].scores.sort();
                return count;
            })
            .end();
    };

    redismock.zcard = function (key, callback) {
        return this
            .ifType(key, 'zset', callback)
            .thenex(function () { 
                return cache[zsets][key].scores.reduce(function (cnt, score) {
                    return cnt + cache[zsets][key].set[score].length;
                }, 0);
            })
            .thennx(function () { return 0; })
            .end();
    };

    redismock.zcount = function (key, min, max, callback) {
        return this
            .ifType(key, 'zset', callback)
            .thenex(function () {
                var count = cache[zsets][key]
                    .scores
                    .filter(function (score) {
                        return min <= score && score <= max;
                    })
                    .reduce(function (cnt, score) {
                        return cnt + cache[zsets][key].set[score].length;
                    }, 0);
                return count;
            })
            .thennx(function () { return 0; })
            .end();
    };

    redismock.zincrby = function (key, increment, member, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.zinterstore = function (destination, numkeys, key, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.zlexcount = function (key, min, max, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.zrange = function (key, start, stop, callback) {
        var withscores = false;
        if (typeof callback !== "function" && callback === "withscores") {
            withscores = true;
            callback = arguments[4];
        }
        if (start < 0) {
            start = this.zcard(key) + start;
        }
        if (stop < 0) {
            stop = this.zcard(key) + stop;
        }
        return this
            .ifType(key, 'zset', callback)
            .thenex(function () {
                var startScoreIdx = 0, idx = 0;
                var range = [];
                cache[zsets][key]
                    .scores
                    .some(function (score) {
                        if (idx <= start && idx + cache[zsets][key].set[score].length > start) {
                            return true;
                        }
                        idx += cache[zsets][key].set[score].length;
                        startScoreIdx += 1;
                        return false;
                    });
                cache[zsets][key]
                    .scores
                    .slice(startScoreIdx)
                    .some(function (score) {
                        var arr = [];
                        var len = cache[zsets][key].set[score].length;
                        var from = 0, to = 0;
                        if (idx > stop) {
                            return true;
                        }
                        while (idx < start) {
                            idx += 1;
                            from += 1;
                        }
                        to = from + 1;
                        while (idx <= stop && to <= len) {
                            idx += 1;
                            to += 1;
                        }
                        arr = cache[zsets][key].set[score].slice(from, to);
                        arr.sort(function (a, b) {
                            return a.localeCompare(b);
                        });
                        if (withscores) {
                            arr = arr
                                .map(function (e) {
                                    return [e, score];
                                })
                                .reduce(function (flat, es) {
                                    return flat.concat(es);
                                }, []);
                        }
                        range = range.concat(arr);
                        return false;
                    });
                return range;
            })
            .thennx(function () { return []; })
            .end();
    };

    redismock.zrangebylex = function (key, min, max, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.zrevrangebylex = function (key, max, min, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.zrangebyscore = function (key, min, max, callback) {
        var withscores = false;
        var limitOffset = -1, limitCount = -1; 
        var idx, len;
        var arr = [], offset;
        var minInclusive = true, maxInclusive = true;
        if (typeof callback !== "function") {
            len = arguments.length;
            for (idx = 3; idx < len; idx += 1) {
                if (arguments[idx] === 'withscores') {
                    withscores = true;
                }
                if (typeof arguments[idx] === "function") {
                    callback = arguments[idx];
                }
                if (arguments[idx] === "limit") {
                    limitOffset = arguments[idx + 1];
                    limitCount = arguments[idx + 2];
                }
            }
        }
        if (min === '-inf') {
            min = Number.NEGATIVE_INFINITY;
        }
        if (min === '+inf') {
            min = Number.POSITIVE_INFINITY;
        }
        if (max === '-inf') {
            max = Number.NEGATIVE_INFINITY;
        }
        if (max === '+inf') {
            max = Number.POSITIVE_INFINITY;
        }
        if (min.toString().charAt(0) === '(') {
            minInclusive = false;
            min = parseFloat(min.toString().substr(1));
        }
        if (max.toString().charAt(0) === '(') {
            maxInclusive = false;
            max = parseFloat(max.toString().substr(1));
        }
        return this
            .ifType(key, 'zset', callback)
            .thenex(function () {
                cache[zsets][key]
                    .scores
                    .some(function (score) {
                        cache[zsets][key].set[score].some(function (member) {
                            // TODO: Re-work to scan scores to the right score, then start there.
                            if (((minInclusive && min <= score) || (!minInclusive && min < score)) && ((maxInclusive && score <= max) || (!maxInclusive && score < max))) {
                                if (limitOffset !== -1 && offset >= limitOffset) {
                                    if (limitCount !== -1) {
                                        if (arr.length < limitCount) {
                                            arr.push(member);
                                            if (withscores) {
                                                arr.push(score);
                                            }
                                        }
                                        else {
                                            return true;
                                        }
                                    }
                                }
                                else {
                                    arr.push(member);
                                    if (withscores) {
                                        arr.push(score);
                                    }
                                }
                            }
                            offset += 1;
                            return false;
                        });
                        if (limitCount !== -1 && arr.length === limitCount) {
                            return true;
                        }
                        return false;
                    });
                return arr;
            })
            .thennx(function () { return []; })
            .end();
    };

    redismock.zrank = function (key, member, callback) {
        return this
            .ifType(key, 'zset', callback)
            .thenex(function () {
                var idx = 0;
                var found = cache[zsets][key]
                    .scores
                    .some(function (score) {
                        if (cache[zsets][key].set[score].indexOf(member) !== -1) {
                            return true;
                        }
                        idx += 1;
                        return false;
                    });
                if (!found) {
                    return null;
                }
                return idx;
            })
            .thennx(function () { return null; })
            .end();
    };

    redismock.zrem = function (key, member, callback) {
        var count = 0;
        var g = gather(this.zrem).apply(this, arguments);
        callback = g.callback;
        return this
            .ifType(key, 'zset', callback)
            .thenex(function () {
                g.list.forEach(function (m) {
                    cache[zsets][key]
                        .scores
                        .forEach(function (score) {
                            var idx = cache[zsets][key].set[score].indexOf(m);
                            if (idx !== -1) {
                                cache[zsets][key].set[score].splice(idx, 1);
                                count += 1;
                            }
                            if (cache[zsets][key].set[score].length === 0) {
                                cache[zsets][key].scores.splice(cache[zsets][key].scores.indexOf(score), 1);
                                cache[zsets][key].set[score] = new redismock.Array();
                            }
                        });
                });
                if (cache[zsets][key].scores.length === 0) {
                    this.del(key);
                }
            })
            .then(function () { return count; })
            .end();
    };

    redismock.zremrangebylex = function (key, min, max, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.zremrangebyscore = function (key, min, max, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.zrevrange = function (key, start, stop, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.zrevrangebyscore = function (key, max, min, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.zrevrank = function (key, member, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.zscore = function (key, member, callback) {
        return this
            .ifType(key, 'zset', callback)
            .thenex(function () {
                var score = null;
                cache[zsets][key]
                    .scores
                    .some(function (s) {
                        if (cache[zsets][key].set[s].indexOf(member) !== -1) {
                            score = s;
                            return true;
                        }
                        return false;
                    });
                return score;
            })
            .thennx(function () { return null; })
            .end();
    };

    redismock.zunionstore = function (destination, numkeys, key, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.zscan = function (key, cursor, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    // Hash Commands
    // -------------

    redismock.hdel = function (key, field, callback) {
        var count = 0;
        var g = gather(this.hdel).apply(this, arguments);
        callback = g.callback;
        return this
            .ifType(key, 'hash', callback)
            .thenex(function () {
                g.list.forEach(function (field) {
                    if (field in cache[hashes][key]) {
                        delete cache[hashes][key][field];
                        count += 1;
                    }
                });
                if (Object.keys(cache[hashes][key]).length === 0) {
                    this.del(key);
                }
            })
            .then(function () { return count; })
            .end();
    };
    
    redismock.hexists = function (key, field,  callback) {
        return this
            .ifType(key, 'hash', callback)
            .thenex(function () { return field in cache[hashes][key] ? 1 : 0; })
            .thennx(function () { return 0; })
            .end();
    };

    redismock.hget = function (key, field, callback) {
        return this
            .ifType(key, 'hash', callback)
            .thenex(function () { return cache[hashes][key][field]; })
            .thennx(function () { return null; })
            .end();
    };

    redismock.hgetall = function (key, callback) {
        return this
            .ifType(key, 'hash', callback)
            .thenex(function () {
                var arr = Object
                    .keys(cache[hashes][key])
                    .map(function (field) {
                        return [field, cache[hashes][key][field]];
                    })
                    .reduce(function (prev, fv) {
                        return prev.concat(fv);
                    }, []);
                return arr;
            })
            .thennx(function () { return []; })
            .end();
    };

    redismock.hincrby = function (key, field, increment, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.hincrbyfloat = function (key, field, increment, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.hkeys = function (key, callback) {
        return this
            .ifType(key, 'hash', callback)
            .thenex(function () { return Object.keys(cache[hashes][key]); })
            .thennx(function () { return []; })
            .end();
    };

    redismock.hlen = function (key, callback) {
        var r = this.hkeys(key);
        if (r instanceof Error) {
            return cb(callback)(r);
        }
        return cb(callback)(null, r.length);
    };

    redismock.hmget = function (key, field, callback) {
        var g = gather(this.hmget).apply(this, arguments);
        callback = g.callback;
        return this
            .ifType(key, 'hash', callback)
            .thenex(function () {
                var arr = g
                    .list
                    .map(function (f) {
                        return cache[hashes][key][f];
                    });
                return arr;
            })
            .thennx(function () { return []; })
            .end();
    };

    redismock.hmset = function (key, field, value, callback) {
        var g = gather(this.hmset, 3).apply(this, arguments);
        callback = g.callback;
        return this
            .ifType(key, 'hash', callback)
            .thennx(function () { cache[hashes][key] = {}; })
            .then(function () {
                var that = this;
                g
                    .list
                    .map(function (fv, index) {
                        if (index % 2 === 0) {
                            return [fv, g.list[index + 1]];
                        }
                        return null;
                    })
                    .filter(function (fv) {
                        return fv !== null;
                    })
                    .forEach(function (fv) {
                        that.hset(key, fv[0], fv[1]);
                    });
                return 'OK';
            })
            .end();
    };

    redismock.hset = function (key, field, value, callback) {
        var ret;
        return this
            .ifType(key, 'hash', callback)
            .thenex(function () {
                if (field in cache[hashes][key]) {
                    ret = 0;
                }
                else {
                    ret = 1;
                }
            })
            .thennx(function () {
                ret = 1;
                cache[hashes][key] = {}; 
            })
            .then(function () { 
                cache[hashes][key][field] = value;
                return ret; 
            })
            .end();
    };

    redismock.hsetnx = function (key, field, value, callback) {
        var ret;
        return this
            .ifType(key, 'hash', callback)
            .thenex(function () {
                if (field in cache[hashes][key]) {
                    ret = 0;
                    return;
                }
                ret = 1;
            })
            .thennx(function () {
                ret = 1;
                cache[hashes][key] = {};
            })
            .then(function () { 
                if (ret === 1) {
                    cache[hashes][key][field] = value;
                }
                return ret; 
            })
            .end();
    };

    redismock.hstrlen = function (key, field, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.hvals = function (key, callback) {
        var vals = [];
        return this
            .ifType(key, 'hash', callback)
            .thenex(function () {
                vals = Object
                    .keys(cache[hashes][key])
                    .map(function (field) {
                        return cache[hashes][key][field];
                    });
            })
            .then(function () { return vals; })
            .end();
    };

    redismock.hscan = function (key, cursor, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    // Pub/Sub Commands
    // ----------------

    redismock.psubscribe = function (pattern, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.pubsub = function (subcommand, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.publish = function (channel, message, callback) {
        if (channel in mySubscriptions) {
            mySubscriptions[channel].forEach(function (caller) {
                cb(caller)(channel, message);
            });
        }
        return cb(callback)(null, 'OK');
    };

    redismock.punsubscribe = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.subscribe = function (channel, callback) {
        var idx, len = arguments.length;
        var channels = [channel];
        if (len >= 2) {
            for (idx = 1; idx < len; idx += 1) {
                if (typeof arguments[idx] === "function") {
                    callback = arguments[idx];
                }
                else if (arguments[idx]) {
                    channels.push(arguments[idx]);
                }
            }
        }
        channels.forEach(function (channel) {
            if (!(channel in mySubscriptions)) {
                mySubscriptions[channel] = [];
            }
            mySubscriptions[channel].push(callback);
        });
    };

    redismock.unsubscribe = function (channel, callback) {
        var idx, len = arguments.length;
        var channels = [channel];
        if (!channel) {
            mySubscriptions = {};
        }
        else if (len >= 2) {
            for (idx = 1; idx < len; idx += 1) {
                if (arguments[idx]) {
                    channels.push(arguments[idx]);
                }
            }
            channels.forEach(function (channel) {
                if (channel in mySubscriptions) {
                    delete mySubscriptions[channel];
                }
            });
        }
        return cb(callback)(null, 'OK');
    };

    // Transactions Commands
    // ---------------------

    redismock.discard = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.multi = function () {
        var rc = {};
        var that = this;
        var err;
        var toApply = [], replies = [];
        Object.keys(this).forEach(function (key) {
            rc[key] = function () {
                var args = Array.prototype.slice.call(arguments);
                if (err) {
                    return;
                }
                args.push(function (error, reply) {
                    if (error) {
                        err = error;
                    }
                    else {
                        replies.push(reply);
                    }
                });
                toApply.push([key, that[key], that, args]);
                return this;
            };
        });
        rc.exec = function (callback) {
            if (toApply.some(function (apply) {
                if (apply[3][0] in watchers && watchers[apply[3][0]]) {
                    // FAIL! One of the keys has been modified.
                    watchers = {};
                    return true;
                }
                return false;
            })) {
                return cb(callback)(null, null);
            }
            toApply.forEach(function (apply) {
                apply[1].apply(apply[2], apply[3]);
            });
            return cb(callback)(err, replies);
        };
        return rc;
    };

    redismock.unwatch = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.watch = function (key, callback) {
        watchers[key] = false;
        return cb(callback)(null, 'OK');
    };

    // Scripting Commands
    // ------------------

    /* jshint ignore:start */
    redismock.eval = function (script, numkeys, key, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };
    /* jshint ignore:end */

    redismock.evalsha = function (sha1, numkeys, key, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.script_exists = function (script, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.script_flush = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.script_kill = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.script_load = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    // Connection Commands
    // -------------------

    redismock.auth = function (password, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.echo = function (message, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.ping = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.quit = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.select = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
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
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.flushdb = function (callback) {
        cache = {};
        cache[sets] = {};
        cache[zsets] = {};
        cache[hashes] = {};
        watchers = {};
        mySubscriptions = {};
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

    var modifiers = ['del', 'set', 'lpush', 'rpush', 'lpop', 'rpop', 'ltrim', 'lset', 'sadd', 'sdiffstore', 'sinterstore', 'srem', 'sunionstore', 'zadd', 'zrem']; // TODO: Add the rest.
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
            return capture[key].apply(capture, arguments);
        };
    });
    // For each function that modifies the database, splice in the watchers to get
    // the modification and potentially not execute a multi.
    modifiers.forEach(function (modifier) {
        var mod = redismock[modifier];
        redismock[modifier] = function () {
            var key = arguments[0];
            if (key in watchers) {
                watchers[key] = true;
            }
            return mod.apply(capture, arguments);
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
            copied[key] = redismock[key];
        });
        copied.toPromiseStyle = redismock.toPromiseStyle;
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
        return rc;
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
