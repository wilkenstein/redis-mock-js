# redis-mock-js
An in-memory redis-compatible implementation written in pure
javascript.

## Installation

### npm

````bash
$ npm install redis-js
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

## Testing

This project uses karma + mocha + chai.

To run the full test suite, issue the standard npm command:

````bash
$ npm test
````

This will run jshint against all the source files, run the full mocha suite with a coverage report, and finally run a complexity report against all the source files. Currently, the only source file is redis-mock.js.

To run the mocha tests within a particular browser using karma, issue the following npm commands:

````bash
$ npm run test-phantomjs
$ npm run test-firefox
$ npm run test-chrome
$ npm run test-safari
$ npm run test-opera
$ npm run test-ie
````

These tests use the various karma-*-launcher projects to launch the browsers. If the browser is not installed on the system, the corresponding test command will print an error and hang.

test-phantomjs is the only test command that does not rely on external dependencies. test-phantomjs will install the latest compatible version of phantomjs in a tmp directory, and use that binary to run the tests.

## Supported Commands

The goal is to have one-to-one feature parity with all redis commands, so that this implementation can simply be dropped into an existing redis-backed codebase. Redis has a lot of commands! Some of them are easy, and some are quite complex.

Version 0.1.0 should have support for almost all redis commands, minus the hyperloglog commands and the key-movement commands, such as migrate.

To find out what commands a particular version of redis-js supports, run the following commands:

````bash
$ npm run implemented
$ npm run unimplemented
````

Theses two commands will print out all the implemented and unimplemented commands, respectively.

NOTE: version 0.0.5 will have full support for implemented and unimplemented. Versions <= 0.0.4 do <i>not</i> support these commands and will be deprecated at some point.

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
  - Server support.
* 2.0.0
  - Support for migrating data from a mock redis instance to a real
    redis instance.
  - Support for persisting a mock redis instance.
  - HyperLogLog support.

## Versions
* 0.0.6
  - Implement more commands.
  - Implement more unit tests.
* 0.0.5
  - Full browser testing capabilities.
  - All redis commands "un"-implemented.
  - Added way to see implemented vs unimplemented commands.
  - More unit tests and more implementations.
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
