# redis-mock-js
An in-memory redis-compatible implementation written in pure
javascript.

## Installation

### npm

````
npm install redis-js
````

### Browser

TODO: Add minified javascript files. Provide github link? Or other site?

## Usage

### node.js/io.js

#### Basic Usage

The below code demonstrates a toy example of using the client in
node.js/io.js. The toy example sets a key, gets it, then deletes it.

````javascript
var redisClient = require('redis-js');
var async = require('async');
var Q = require('q');

// Return blocking style.
var reply = redisClient.set('key', 'value');
if (reply === 'OK') {
    var value = redisClient.get('key');
    if (value === 'value') {
        redisClient.del('key');
    }
}

// Callback style (pyramid).
function setGetDel(callback) {
    redisClient.set('key', 'value', function (err, reply) {
        if (err || reply !== 'OK') {
            return callback(err, reply);
        }
        redisClient.get('key', function (err2, reply2) {
            if (err2 || reply2 !== 'value') {
                return callback(err2, reply2);
            }
            redisClient.del('key', function (err3, reply3) {
                if (err3) {
                    return callback(err3);
                }
                return callback(err3, reply3);
            });
        });
    });
}
setGetDel(function (err) { if (err) throw err; });

// Async style.
function setGetDelAsync(callback) {
    async.waterfall([
        function (cb) {
            redisClient.set('key', 'value', cb);
        },
        function (reply, cb) {
            if (reply !== 'OK') {
                return cb(new Error('reply not OK'));
            }
            redisClient.get('key', cb);
        },
        function (reply, cb) {
            if (reply !== 'value') {
                return cb(new Error('reply !== value'));
            }
            redisClient.del('key', cb);
        }
    ], function (err, reply) {
        callback(err, reply);
    });
}
setGetDelAsync(function (err) { if (err) throw err; });
    
// Promise style with q.
function setGetDelQ() {
    return Q
        .nfcall(redisClient.set, 'key', 'value')
        .then(function (reply) {
            if (reply !== 'OK') {
                throw new Error('reply not OK');
            }
            return Q.nfcall(redisClient.get, 'key');
        }, function (err) {
            throw err;
        })
        .then(function (reply) {
            if (reply !== 'value') {
                throw new Error('reply !== value');
            }
            return Q.nfcall(redisClient.del, 'key');
        }, function (err) {
            throw err;
        });
}
setGetDelQ()
    .fail(function (err) { throw err; })
    .done();
````

## Roadmap

* 0.1.0
  - Support for most redis commands.
  - Mocha tests for all supported commands.
  - Browser testing and compatibility determination.
* 1.0.0
  - Support for different versions of mock redis that mimic different
    redis versions.
  - Support for multiple mock redis instances.
  - Support for migrating data between mock redis instances.
* 2.0.0
  - Support for migrating data from a mock redis instance to a real
    redis instance.
  - Support for persisting a mock redis instance.
  - HyperLogLog support.

## Versions
* 0.0.4
  - Enhanced hash support.
  - Unit tests for hash commands.
* 0.0.3
  - Set, sorted set, and hash support.
  - Unit tests for implemented list, set, and sorted set commands.
  - Bug squashes.
* 0.0.2
  - Transaction support that works.
  - Bug squashes.
  - Enhanced commands.
* 0.0.1
  - DEPRECATED
  - Initial implementation.
  - Numerous bugs.
  - Incomplete commands.
