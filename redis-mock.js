/* jshint unused:true, undef:true, strict:true, plusplus:true */
/* global setTimeout:false, module:false, exports:true, clearTimeout:false, console:false */

(function () {

    // Baseline setup
    // --------------

    "use strict";

    // Establish the root object, `window` in the browser, or `exports` on the server.
    var root = this;

    // Create the mock object.
    var redismock = {};

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

    // The database.
    var cache = {};
    var timeouts = {};
    var mySubscriptions = {};
    var watchers = {};
    var sets = 'sets-' + Math.random();
    var zsets = 'zsets-' + Math.random();
    var hashes = 'hashes-' + Math.random();
    cache[sets] = {};
    cache[zsets] = {};
    cache[hashes] = {};

    // Utils
    // -----

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
        return cb(callback)(new Error('WRONGTYPE'));
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
                    }
                }
                else {
                    if (typeof this._ifnx === 'function') {
                        ret = this._ifnx.call(that);
                    }
                }
                if (typeof this._then === 'function') {
                    ret = this._then.call(that);
                }
                return ret;
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
        return cb(callback)(null, (cache[key] || cache[sets][key] || cache[zsets][key] || cache[hashes][key]) ? 1 : 0);
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
        return cb(callback)(new Error("UNIMPLEMENTED"));
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
        if (this.exists(key) && key in timeouts) {
            clearTimeout(timeouts[key]);
            return cb(callback)(null, 1);
        }
        return cb(callback)(null, 0);
    };

    // Set a key's time to live in milliseconds.
    redismock.pexpire = function (key, milliseconds, callback) {
        var that = this;
        if (this.exists(key)) {
            if (key in timeouts) {
                clearTimeout(timeouts[key]);
            }
            if (milliseconds <= 0) {
                this.del(key);
            }
            else {
                timeouts[key] = setTimeout(function () {
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
        return cb(callback)(new Error("UNIMPLEMENTED"));
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
                            console.log(hashkey);
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
        return cb(callback)(new Error('UNIMPLEMENTED'));
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
                if (key in cache[sets]) {
                    type = 'set';
                }
                else if (key in cache[zsets]) {
                    type = 'zset';
                }
                else if (key in cache[hashes]) {
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

    redismock.append = function (key, value, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.bitcount = function (key, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.bitop = function (operation, destkey, key, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.bitops = function (key, bit, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.decr = function (key, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.decrby = function (key, decrement, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.get = function (key, callback) {
        if (this.type(key) === 'string') {
            return cb(callback)(null, cache[key]);
        }
        return cb(callback)(null, null);
    };

    redismock.getbit = function (key, offset, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.getrange = function (key, start, end, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.getset = function (key, value, callback) {
        var prev = this.get(key);
        this.set(key, value);
        return cb(callback)(null, prev);
    };

    redismock.incr = function (key, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.incrby = function (key, increment, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.incrbyfloat = function (key, increment, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.mget = function (key, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.mset = function (key, value, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.msetnx = function (key, value, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.psetex = function (key, milliseconds, value, callback) {
        this.set(key, value);
        this.pexpire(key, milliseconds);
        return cb(callback)(null, 'OK');
    };

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
        cache[key] = value ? value.toString() : '';
        if (px !== -1) {
            redismock.pexpire(key, px);
        }
        if (ex !== -1) {
            redismock.expire(key, ex);
        }
        return cb(callback)(null, 'OK');
    };

    redismock.setbit = function (key, offset, value, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.setex = function (key, seconds, value, callback) {
        this.set(key, value);
        this.expire(key, seconds);
        return cb(callback)(null, 'OK');
    };

    redismock.setnx = function (key, value, callback) {
        if (!this.exists(key)) {
            this.set(key, value);
            return cb(callback)(null, 1);
        }
        return cb(callback)(null, 0);
    };
    
    redismock.setrange = function (key, offset, value, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.strlen = function (key, callback) {
        if (!this.exists(key)) {
            return cb(callback)(null, 0);
        }
        return this
            .ifType(key, 'string', callback)
            .thenex(function () { return cb(callback)(null, cache[key].length); })
            .thennx(function () { return cb(callback)(null, 0); })
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
            .then(function () { return cb(callback)(null, elem); })
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
                    return cb(callback)(null, cache[key].length);
                }
                return cb(callback)(null, -1);
            })
            .thennx(function () { return cb(callback)(null, 0); })
            .end();
    };

    redismock.llen = function (key, callback) {
        return this
            .ifType(key, 'list', callback)
            .thenex(function () { return cb(callback)(null, cache[key].length); })
            .thennx(function () { return cb(callback)(null, 0); })
            .end();
    };

    redismock.lpop = function (key, callback) {
        return this
            .ifType(key, 'list', callback)
            .thenex(function () { return cb(callback)(null, cache[key].shift()); })
            .thennx(function () { return cb(callback)(null, null); })
            .end();
    };

    redismock.lpush = function (key, element, callback) {
        var g = gather(this.lpush).apply(this, arguments);
        callback = g.callback;
        return this
            .ifType(key, 'list', callback)
            .thennx(function () { cache[key] = []; })
            .then(function () {
                cache[key] = g.list.concat(cache[key]);
                return cb(callback)(null, cache[key].length);
            })
            .end();
    };

    redismock.lpushx = function (key, element, callback) {
        return this
            .ifType(key, 'list', callback)
            .thenex(function () {
                cache[key].unshift(element);
                return cb(callback)(null, cache[key].length);
            })
            .thennx(function () { return cb(callback)(null, 0); })
            .end();
    };

    redismock.lrange = function (key, start, end, callback) {
        var l = [];
        return this
            .ifType(key, 'list', callback)
            .thenex(function () {
                var tmpS, tmpE;
                if (start > cache[key].length - 1) {
                    l = [];
                }
                else {
                    if (start < 0 && end < 0) {
                        tmpS = cache[key].length + end;
                        tmpE = cache[key].length + start;
                        start = tmpS;
                        end = tmpE;
                    }
                    if (start >= 0 && end < 0) {
                        end = cache[key].length + end;
                    }
                    if (end > cache[key].length - 1) {
                        end = cache[key].length - 1;
                    }
                    l = cache[key].slice(start, end + 1);
                }
            })
            .then(function () { return cb(callback)(null, l); })
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
                    delete cache[key];
                }
            })
            .then(function () { return cb(callback)(null, cnt); })
            .end();
    };

    redismock.lset = function (key, index, element, callback) {
        return this
            .ifType(key, 'list', callback)
            .thenex(function () { 
                if (index >= cache[key].length) {
                    return cb(callback)(new Error('ERR index out of range'));
                }
                cache[key][index] = element;
                return cb(callback)(null, 'OK');
            })
            .thennx(function () { return cb(callback)(new Error('ERR no such key')); })
            .end();
    };

    redismock.ltrim = function (key, start, end, callback) {
        return this
            .ifType(key, 'list', callback)
            .thenex(function () {
                var tmpS, tmpE;
                if (start > cache[key].length - 1 || start > end) {
                    cache[key] = [];
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
                    delete cache[key];
                }
                return cb(callback)(null, 'OK');
            })
            .end();
    };

    redismock.rpop = function (key, callback) {
        return this
            .ifType(key, 'list', callback)
            .thenex(function () { return cb(callback)(null, cache[key].pop()); })
            .thennx(function () { return cb(callback)(null, null); })
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
            .thennx(function () { cache[key] = []; })
            .then(function () {
                cache[key] = cache[key].concat(g.list);
                return cb(callback)(null, cache[key].length);
            })
            .end();
    };

    redismock.rpushx = function (key, element, callback) {
        return this
            .ifType(key, 'list', callback)
            .thenex(function () {
                cache[key].push(element);
                return cb(callback)(null, cache[key].length);
            })
            .thennx(function () { return cb(callback)(null, 0); })
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
                return cb(callback)(null, count);
            })
            .end();
    };

    redismock.scard = function (key, callback) {
        return this
            .ifType(key, 'set', callback)
            .thenex(function () { return cb(callback)(null, Object.keys(cache[sets][key]).length); })
            .thennx(function () { return cb(callback)(null, 0); })
            .end();
    };

    redismock.sdiff = function (key, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };
    
    redismock.sdiffstore = function (destination, key, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.sinter = function (key, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.sinterstore = function (destination, key, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.sismember = function (key, member, callback) {
        return this
            .ifType(key, 'set', callback)
            .thenex(function () { return cb(callback)(null, member in cache[sets][key] ? 1 : 0); })
            .thennx(function () { return cb(callback)(null, 0); })
            .end();
    };

    redismock.smembers = function (key, callback) {
        return this
            .ifType(key, 'set', callback)
            .thenex(function () { return cb(callback)(null, Object.keys(cache[sets][key])); })
            .thennx(function () { return cb(callback)(null, []); })
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
                    return cb(callback)(null, null);
                }
                if (count) {
                    randos = [];
                    for (idx = 0; idx < Math.abs(count); idx += 1) {
                        randos.push(cache[sets][key][k[Math.floor(Math.random() & k.length)]]);
                    }
                    return cb(callback)(null, randos);
                }
                return cb(callback)(null, cache[sets][key][k[Math.floor(Math.random() * k.length)]]);
            })
            .thennx(function () { return cb(callback)(null, null); })
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
                    delete cache[sets][key];
                }
            })
            .then(function () { return cb(callback)(null, count); })
            .end();
    };

    redismock.sunion = function (key, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.sunionstore = function (destination, key, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    redismock.sscan = function (key, cursor, callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };

    // Sorted Set Commands
    // -------------------

    redismock.zadd = function (key, score, member, callback) {
        var g = gather(this.zadd, 3).apply(this, arguments);
        callback = g.callback;
        return this
            .ifType(key, 'zset', callback)
            .thennx(function () { cache[zsets][key] = {}; })
            .then(function () {
                var count = 0;
                g
                    .list
                    .map(function (elem, index) {
                        if (index % 2 === 0) {
                            return [g.list[index], g.list[index + 1]];
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
                        if (!(score in cache[zsets][key])) {
                            cache[zsets][key][score] = [];
                        }
                        Object
                            .keys(cache[zsets][key])
                            .map(function (score) {
                                return [parseFloat(score), cache[zsets][key][score].indexOf(m)];
                            })
                            .filter(function (si) {
                                return si[1] !== -1;
                            })
                            .forEach(function (si) {
                                if (si[0] !== score) {
                                    cache[zsets][key][si[0]].splice(si[1], 1);
                                }
                                else {
                                    noop = true;
                                }
                            });
                        if (!noop) {
                            cache[zsets][key][score].push(m);
                            count += 1;
                        }
                    });
                return cb(callback)(null, count);
            })
            .end();
    };

    redismock.zcard = function (key, callback) {
        return this
            .ifType(key, 'zset', callback)
            .thenex(function () { 
                var count = Object.keys(cache[zsets][key]).reduce(function (cnt, score) {
                    return cnt + cache[zsets][key][score].length;
                }, 0);
                return cb(callback)(null, count); 
            })
            .thennx(function () { return cb(callback)(null, 0); })
            .end();
    };

    redismock.zcount = function (key, min, max, callback) {
        return this
            .ifType(key, 'zset', callback)
            .thenex(function () {
                var count = Object
                    .keys(cache[zsets][key])
                    .map(function (score) {
                        return parseFloat(score);
                    })
                    .filter(function (score) {
                        return min <= score && score <= max;
                    })
                    .reduce(function (cnt, score) {
                        return cnt + cache[zsets][key][score].length;
                    }, 0);
                return cb(callback)(null, count);
            })
            .thennx(function () { return cb(callback)(null, 0); })
            .end();
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
                var index = 0;
                var arr = [];
                Object
                    .keys(cache[zsets][key])
                    .map(function (score) {
                        return parseFloat(score);
                    })
                    .sort()
                    .some(function (score) {
                        cache[zsets][key][score].forEach(function (member) {
                            if (start <= index && index <= stop) {
                                arr.push(member);
                                if (withscores) {
                                    arr.push(score);
                                }
                            }
                            index += 1;
                        });
                        if (index > stop) {
                            return true;
                        }
                        return false;
                    });
                return cb(callback)(null, arr);
            })
            .thennx(function () { return cb(callback)(null, []); })
            .end();
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
                Object
                .keys(cache[zsets][key])
                .map(function (score) {
                    return parseFloat(score);
                })
                .sort()
                .some(function (score) {
                    cache[zsets][key][score].some(function (member) {
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
                return cb(callback)(null, arr);
            })
            .thennx(function () { return cb(callback)(null, []); })
            .end();
    };

    redismock.zrank = function (key, member, callback) {
        return this
            .ifType(key, 'zset', callback)
            .thenex(function () {
                var idx = 0;
                var found = Object
                    .keys(cache[zsets][key])
                    .map(function (score) {
                        return parseFloat(score);
                    })
                    .sort()
                    .some(function (score) {
                        if (cache[zsets][key][score].indexOf(member) !== -1) {
                            return true;
                        }
                        idx += 1;
                        return false;
                    });
                if (!found) {
                    return cb(callback)(null, null);
                }
                return cb(callback)(null, idx);
            })
            .thennx(function () { return cb(callback)(null, null); })
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
                    Object
                        .keys(cache[zsets][key])
                        .forEach(function (score) {
                            var idx = cache[zsets][key][score].indexOf(m);
                            if (idx !== -1) {
                                cache[zsets][key][score].splice(idx, 1);
                                count += 1;
                            }
                        });
                });
                if (Object.keys(cache[zsets][key]).length === 0) {
                    delete cache[zsets][key];
                }
            })
            .then(function () { return cb(callback)(null, count); })
            .end();
    };

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
                    delete cache[hashes][key];
                }
            })
            .then(function () { return cb(callback)(null, count); })
            .end();
    };
    
    redismock.hexists = function (key, field,  callback) {
        return this
            .ifType(key, 'hash', callback)
            .thenex(function () { return cb(callback)(null, field in cache[hashes][key] ? 1 : 0); })
            .thennx(function () { return cb(callback)(null, 0); })
            .end();
    };

    redismock.hget = function (key, field, callback) {
        return this
            .ifType(key, 'hash', callback)
            .thenex(function () { return cb(callback)(null, cache[hashes][key][field]); })
            .thennx(function () { return cb(callback)(null, null); })
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
                return cb(callback)(null, arr);
            })
            .thennx(function () { return cb(callback)(null, []); })
            .end();
    };

    redismock.hkeys = function (key, callback) {
        return this
            .ifType(key, 'hash', callback)
            .thenex(function () { return cb(callback)(null, Object.keys(cache[hashes][key])); })
            .thennx(function () { return cb(callback)(null, []); })
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
                return cb(callback)(null, 'OK');
            })
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
                return cb(callback)(null, arr);
            })
            .thennx(function () { return cb(callback)(null, []); })
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
                return cb(callback)(null, ret); 
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
                return cb(callback)(null, ret); 
            })
            .end();
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
            .then(function () { return cb(callback)(null, vals); })
            .end();
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

    redismock.publish = function (channel, message, callback) {
        if (channel in mySubscriptions) {
            mySubscriptions[channel].forEach(function (caller) {
                cb(caller)(channel, message);
            });
        }
        return cb(callback)(null, 'OK');
    };

    redismock.watch = function (key, callback) {
        watchers[key] = false;
        return cb(callback)(null, 'OK');
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

    redismock.info = function (callback) {
        return cb(callback)(new Error('UNIMPLEMENTED'));
    };
    
    redismock.warnings = function (logger) {
        if (!logger) {
            logger = console;
        }
        var mods = [];
        for (var key in redismock) {
            if (typeof redismock[key] === "function") {
                mods.push(redismock[key]);
            }
        }
        mods.forEach(function (mod) {
            var m = redismock[mod];
            redismock[mod] = function () {
                if (m.length >= 2 && arguments.length <= m.length - 2) {
                    logger.warn('WARN ' + key + ' passed ' + arguments.length + ' arguments, but probably expects at least ' + capture[key].length - 1 + ' arguments');
                }
                return m.apply(redismock, arguments);
            };
        });
    };

    var modifiers = ['del', 'set', 'lpush', 'rpush', 'lpop', 'rpop', 'ltrim', 'sadd', 'srem', 'zadd', 'zrem']; // TODO: Add the rest.
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
}).call(this);
