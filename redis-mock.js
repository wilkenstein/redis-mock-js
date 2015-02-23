/* jshint unused:true, undef:true, strict:true, plusplus:true */
/* global setTimeout:false, module:false, exports:true, clearTimeout:false */

(function () {

    "use strict";

    // Establish the root object, `window` in the browser, or `exports` on the server.
    var root = this;

    // Create a safe reference to the mock object for use below.
    var redismock = function (obj) {
        if (obj instanceof redismock) {
            return obj;
        }
        if (!(this instanceof redismock)) {
            return new redismock(obj);
        }
        return this;
    };

    // Export the mock object for **Node.js**, with
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

    if (typeof setImmediate === 'undefined') {
        var setImmediate = function (f) {
            setTimeout(f, 0);
        };
    }

    if (typeof Error === 'undefined') {
        var Error = function (message) {
            this.message = message;
            return this;
        };
    }

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

    var cb = function (callback, context) {
        return function () {
            var args = arguments;
            if (callback && typeof callback === "function") {
                setImmediate(function () {
                    callback.apply(context, args);
                });
            }
            return args[1];
        };
    };

    redismock.set = function (key, value) {
        var opts = [], callback, idx, len;
        var nx = false, xx = false, ex = -1, px = -1;
        if (arguments.length >= 3) {
            len = arguments.length;
            for(idx = 2; idx < len; idx += 1) {
                if (typeof arguments[idx] === "function") {
                    callback = arguments[idx];
                }
                else {
                    opts.push(arguments[idx]);
                }
            }
        }
        if (opts.length) {
            opts.forEach(function (opt, index) {
                if (opt === 'nx') {
                    nx = true;
                }
                else if (opt === 'xx') {
                    xx = true;
                }
                else if (opt === 'ex') {
                    ex = opts[index + 1];
                }
                else if (opt === 'px') {
                    px = opts[index + 1];
                }
            });
        }
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
        cache[key] = value.toString();
        if (px !== -1) {
            redismock.pexpire(key, px);
        }
        if (ex !== -1) {
            redismock.expire(key, ex);
        }
        return cb(callback)(null, 'OK');
    };

    redismock.get = function (key, callback) {
        if (this.type(key) === 'string') {
            return cb(callback)(null, cache[key]);
        }
        return cb(callback)(null, null);
    };

    redismock.getset = function (key, value, callback) {
        var prev = this.get(key);
        this.set(key, value);
        return cb(callback)(null, prev);
    };

    redismock.expire = function (key, seconds, callback) {
        return this.pexpire(key, seconds*1000, callback);
    };

    redismock.pexpire = function (key, milliseconds, callback) {
        if (this.exists(key)) {
            if (key in timeouts) {
                clearTimeout(timeouts[key]);
            }
            timeouts[key] = setTimeout(function () {
                if (key in cache) {
                    delete cache[key];
                }
                else if (key in cache[sets]) {
                    delete cache[sets][key];
                }
                else if (key in cache[zsets]) {
                    delete cache[zsets][key];
                }
                else if (key in cache[hashes]) {
                    delete cache[hashes][key];
                }
            }, milliseconds);
            return cb(callback)(null, 1);
        }
        return cb(callback)(null, 0);
    };

    redismock.psetex = function (key, milliseconds, value, callback) {
        this.set(key, value);
        this.pexpire(key, milliseconds);
        return cb(callback)(null, 'OK');
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

    redismock.strlen = function (key, callback) {
        var msg;
        if (!this.exists(key)) {
            return cb(callback)(null, 0);
        }
        if (this.type(key) !== 'string') {
            msg = key + ' not a string';
            return cb(callback)(new Error(msg));
        }
        return cb(callback)(null, cache[key].length);
    };

    redismock.exists = function (key, callback) {
        return cb(callback)(null, key in cache || key in cache[sets] || key in cache[zsets] || key in cache[hashes]);
    };

    redismock.del = function (key, callback) {
        var that = this;
        var keys = [key.toString()];
        var count = 0;
        var idx, len = arguments.length;
        if (len >= 2) {
            for (idx = 1; idx < len; idx += 1) {
                if (typeof arguments[idx] === "function") {
                    callback = arguments[idx];
                }
                else if (arguments[idx]) {
                    keys.push(arguments[idx].toString());
                }
            }
        }
        keys.forEach(function (key) {
            if (that.exists(key)) {
                if (key in cache) {
                    delete cache[key];
                }
                else if (key in cache[sets]) {
                    delete cache[sets][key];
                }
                else if (key in cache[zsets]) {
                    delete cache[zsets][key];
                }
                else if (key in cache[hashes]) {
                    delete cache[hashes][key];
                }
                count += 1;
            }
        });
        return cb(callback)(null, count);
    };

    redismock.lpush = function (key, element, callback) {
        var elements = [element];
        var idx, len = arguments.length;
        if (len >= 3) {
            for(idx = 2; idx < len; idx += 1) {
                if (typeof arguments[idx] === "function") {
                    callback = arguments[idx];
                }
                else {
                    elements.push(arguments[idx]);
                }
            }
        }
        if (this.exists(key)) {
            if (this.type(key) !== 'list') {
                this.del(key);
                cache[key] = [];
            }
        }
        else {
            cache[key] = [];
        }
        cache[key] = elements.concat(cache[key]);
        return cb(callback)(null, cache[key].length);
    };

    redismock.rpush = function (key, element, callback) {
        var elements = [element];
        var idx, len = arguments.length;
        if (len >= 3) {
            for(idx = 2; idx < len; idx += 1) {
                if (typeof arguments[idx] === "function") {
                    callback = arguments[idx];
                }
                else {
                    elements.push(arguments[idx]);
                }
            }
        }
        if (this.exists(key)) {
            if (this.type(key) !== 'list') {
                this.del(key);
                cache[key] = [];
            }
        }
        else {
            cache[key] = [];
        }
        cache[key] = cache[key].concat(elements);
        return cb(callback)(null, cache[key].length);
    };

    redismock.lpop = function (key, callback) {
        if (this.type(key) === 'list') {
            return cb(callback)(null, cache[key].shift());
        }
        return cb(callback)(null, null);
    };

    redismock.rpop = function (key, callback) {
        if (this.type(key) === 'list') {
            return cb(callback)(null, cache[key].pop());
        }
        return cb(callback)(null, null);
    };

    redismock.lindex = function (key, i, callback) {
        var elem = null;
        if (this.exists(key)) {
            if (this.type(key) !== 'list') {
                return cb(callback)(new Error('WRONGTYPE'));
            }
            if (i >= 0 && i < cache[key].length) {
                elem = cache[key][i];
            }
            else if (i < 0 && cache[key].length + 1 >= 0) {
                elem = cache[key][cache[key].length + i];
            }
        }
        return cb(callback)(null, elem);
    };

    redismock.ltrim = function (key, start, end, callback) {
        var tmpS, tmpE;
        if (this.exists(key) && this.type(key) === 'list') {
            if (start > cache[key].length - 1 || start > end) {
                delete cache[key];
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
        }
        return cb(callback)(null, 'OK');
    };

    redismock.lrange = function (key, start, end, callback) {
        var l = [];
        if (this.exists(key) && this.type(key) === 'list') {
            if (start > cache[key].length - 1) {
                l = [];
            }
            else {
                if (end > cache[key].length) {
                    end = cache[key].length;
                }
                if (start >= 0 && end < 0) {
                    end = cache[key].length - end + 1;
                }
                l = cache[key].slice(start, end);
            }
        }
        return cb(callback)(null, l);
    };

    redismock.llen = function (key, callback) {
        if (this.exists(key)) {
            if (this.type(key) !== 'list') {
                return cb(callback)(new Error('WRONGTYPE'));
            }
            return cb(callback)(null, cache[key].length);
        }
        return cb(callback)(null, 0);
    };

    redismock.rpoplpush = function (source, dest, callback) {
        var element = this.rpop(source);
        this.lpush(dest, element);
        return cb(callback)(null, element);
    };

    redismock.lrem = function (key, count, element, callback) {
        var cnt = 0, idx;
        if (this.exists(key) && this.type(key) === 'list') {
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
        }
        return cb(callback)(null, cnt);
    };

    redismock.sadd = function (key, member, callback) {
        // TODO: Multiple members.
        if (this.exists(key)) {
            if (this.type(key) !== 'set') {
                return cb(callback)(new Error('WRONGTYPE'));
            }
        }
        else {
            cache[sets][key] = {};
        }
        cache[sets][key][member.toString()] = member;
        return cb(callback)(null, 1);
    };

    redismock.srandmember = function (key, callback) {
        if (this.type(key) === 'set') {
            var k = Object.keys(cache[sets][key]);
            return cb(callback)(null, cache[sets][key][k[Math.floor(Math.random() * k.length)]]);
        }
        return cb(callback)(null, null);
    };

    redismock.srem = function (key, member, callback) {
        // TODO: Multiple members.
        var k = member.toString();
        if (this.type(key) === 'set') {
            delete cache[sets][key][k];
            return cb(callback)(null, 1);
        }
        return cb(callback)(null, 0);
    };

    redismock.smove = function (source, dest, member, callback) {
        var r = redismock.srem(source, member);
        redismock.sadd(dest, member);
        return cb(callback)(null, r);
    };

    redismock.zadd = function (key, score, member, callback) {
        // TODO: Multiple score member pairs.
        if (this.exists(key)) {
            if (this.type(key) !== 'zset') {
                // Uh-oh, not a zset.
                return cb(callback)(new Error('WRONGTYPE'));
            }
        }
        else {
            cache[zsets][key] = {};
        }
        if (!(score in cache[zsets][key])) {
            cache[zsets][key][score] = [];
        }
        cache[zsets][key][score].push(member);
        return cb(callback)(null, 1);
    };

    redismock.zrangebyscore = function (key, min, max, callback) {
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

    redismock.unsubscribe = function (channel) {
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
    };

    redismock.publish = function (channel, message) {
        if (channel in mySubscriptions) {
            mySubscriptions[channel].forEach(function (callback) {
                cb(callback)(channel, message);
            });
        }
    };

    redismock.type = function (key, callback) {
        if (this.exists(key)) {
            var type = typeof cache[key];
            if (type === 'object') {
                if (cache[key] instanceof Array) {
                    type = 'list';
                }
                else {
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
            }
            return cb(callback)(null, type);
        }
        return cb(callback)(null, 'none');
    };

    redismock.info = function (callback) {
        // TODO
        return cb(callback)(null, '');
    };
    
    redismock.debug = function (logger) {
        if (!logger) {
            logger = console;
        }
        logger.log(cache);
    };
}).call(this);
