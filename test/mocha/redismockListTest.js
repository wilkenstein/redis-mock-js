var redismock = require('../../redis-mock.js');
var should = require('should');

function randkey(prefix) {
    if (!prefix) {
        prefix = 'k';
    }
    return prefix + Math.random();
}

describe('blpop', function () {
    xit('should blpop');
});

describe('brpop', function () {
    xit('should brpop');
});

describe('brpoplpush', function () {
    xit('should brpoplpush');
});

describe('lindex', function () {
    it('should return nothing for a key that does not exist', function (done) {
        should.not.exist(redismock.lindex(randkey(), 5));
        redismock.lindex(randkey(), 4, function (err, reply) {
            should.not.exist(err);
            should.not.exist(reply);
            done();
        });
    });
    it('should return an error for a key that is not a list', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.set(k, v);
        should.not.exist(redismock.lindex(k, 2));
        redismock.lindex(k, 3, function (err, reply) {
            should.exist(err);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            should.not.exist(reply);
            done();
        });
    });
    it('should return nothing for an out of range index', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.lpush(k, v);
        should.not.exist(redismock.lindex(k, 2));
        redismock.lindex(k, -2, function (err, reply) {
            should.not.exist(err);
            should.not.exist(reply);
            done();
        });
    });
    it('should return the element at the given, in-range index', function (done) {
        var k = randkey();
        var v1 = 'value1', v2 = 'value2', v3 = 'value3';
        redismock.rpush(k, v1);
        redismock.rpush(k, v2);
        redismock.rpush(k, v3);
        redismock.lindex(k, 0).should.equal(v1);
        redismock.lindex(k, 1).should.equal(v2);
        redismock.lindex(k, 2).should.equal(v3);
        redismock.lindex(k, -1).should.equal(v3);
        redismock.lindex(k, -2).should.equal(v2);
        redismock.lindex(k, -3).should.equal(v1);
        redismock.lindex(k, 1, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(v2);
            done();
        });
    });
});

describe('linsert', function () {
    xit('should linsert');
});

describe('llen', function () {
    it('should return 0 for a key that does not exist', function (done) {
        redismock.llen(randkey()).should.equal(0);
        redismock.llen(randkey(), function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return an error for a key that is not a list', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.set(k, v);
        should.not.exist(redismock.llen(k));
        redismock.llen(k, function (err, reply) {
            should.exist(err);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            should.not.exist(reply);
            done();
        });
    });
    it('should return the length of a list', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        redismock.llen(k).should.equal(0);
        redismock.rpush(k, v1);
        redismock.llen(k).should.equal(1);
        redismock.rpush(k, v2);
        redismock.llen(k).should.equal(2);
        redismock.rpush(k, v3);
        redismock.llen(k).should.equal(3);
        redismock.llen(k, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(3);
            done();
        });
    });
});

describe('lpop', function () {
    xit('should lpop');
});

describe('lpush', function () {
    xit('should lpush');
});

describe('lpushx', function () {
    xit('should lpushx');
});

describe('lrange', function () {
    xit('should lrange');
});

describe('lrem', function () {
    xit('should lrem');
});

describe('lset', function () {
    xit('should lset');
});

describe('ltrim', function () {
    xit('should ltrim');
});

describe('rpop', function () {
    xit('should rpop');
});

describe('rpoplpush', function () {
    xit('should rpoplpush');
});

describe('rpush', function () {
    xit('should rpush');
});

describe('rpushx', function () {
    xit('should rpushx');
});
