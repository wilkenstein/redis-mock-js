var redismock = require('../../redis-mock.js');
var should = require('should');

function randkey(prefix) {
    if (!prefix) {
        prefix = 'k';
    }
    return prefix + Math.random();
}

describe('hdel', function () {
    it('should return an error for a key that is not a hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        redismock.set(k, v);
        (redismock.hdel(k, f) instanceof Error).should.be.true;
        redismock.hdel(k, f, f, f, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    xit('should hdel');
});

describe('hexists', function () {
    it('should return an error for a key that is not a hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        redismock.set(k, v);
        (redismock.hexists(k, f) instanceof Error).should.be.true;
        redismock.hexists(k, f, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return 0 for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        redismock.hexists(k, f).should.equal(0);
        redismock.hexists(k, f, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return 0 if the field does not exist in the hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f1 = 'f', f2 = 'f2';
        redismock.hset(k, f1, v);
        redismock.hexists(k, f2).should.equal(0);
        redismock.hexists(k, f2, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return 1 if the field does exist in the hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f1 = 'f', f2 = 'f2';
        redismock.hset(k, f1, v);
        redismock.hexists(k, f1).should.equal(1);
        redismock.hset(k, f2, v);
        redismock.hexists(k, f2, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(1);
            done();
        });
    });
});

describe('hget', function () {
    it('should return an error for a key that is not a hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        redismock.set(k, v);
        (redismock.hget(k, f) instanceof Error).should.be.true;
        redismock.hget(k, f, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    xit('should hget');
});

describe('hgetall', function () {
    xit('should hgetall');
});

describe('hincrby', function () {
    xit('should hincrby');
});

describe('hincrbyfloat', function () {
    xit('should hincrbyfloat');
});

describe('hkeys', function () {
    xit('should hkeys');
});

describe('hlen', function () {
    xit('should hlen');
});

describe('hmget', function () {
    xit('should hmget');
});

describe('hmset', function () {
    xit('should hmset');
});

describe('hset', function () {
    it('should return an error for a key that is not a hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        redismock.set(k, v);
        (redismock.hset(k, v, 'f') instanceof Error).should.be.true;
        redismock.hset(k, v, f, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should set a new field in a hash and return 1', function (done) {
        var k = randkey();
        var f1 = 'f1', f2 = 'f2';
        var v = 'v';
        redismock.hset(k, f1, v).should.equal(1);
        redismock.hlen(k).should.equal(1);
        redismock.hget(k, f1).should.equal(v);
        redismock.hset(k, f2, v, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(1);
            redismock.hlen(k).should.equal(2);
            redismock.hget(k, f2).should.equal(v);
            done();
        });
    });
    it('should update an existing field in a hash and return 0', function (done) {
        var k = randkey();
        var f = 'f'
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        redismock.hset(k, f, v1).should.equal(1);
        redismock.hlen(k).should.equal(1);
        redismock.hget(k, f).should.equal(v1);
        redismock.hset(k, f, v2).should.equal(0);
        redismock.hlen(k).should.equal(1);
        redismock.hget(k, f).should.equal(v2);
        redismock.hset(k, f, v3, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            redismock.hlen(k).should.equal(1);
            redismock.hget(k, f).should.equal(v3);
            done();
        });
    });
});

describe('hsetnx', function () {
    it('should return an error for a key that is not a hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        redismock.set(k, v);
        (redismock.hset(k, v, 'f') instanceof Error).should.be.true;
        redismock.hset(k, v, f, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should set a new field in a hash and return 1', function (done) {
        var k = randkey();
        var f1 = 'f1', f2 = 'f2';
        var v = 'v';
        redismock.hset(k, f1, v).should.equal(1);
        redismock.hlen(k).should.equal(1);
        redismock.hget(k, f1).should.equal(v);
        redismock.hset(k, f2, v, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(1);
            redismock.hlen(k).should.equal(2);
            redismock.hget(k, f2).should.equal(v);
            done();
        });
    });
    it('should not update an existing field in a hash and return 0', function (done) {
        var k = randkey();
        var f = 'f'
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        redismock.hsetnx(k, f, v1).should.equal(1);
        redismock.hlen(k).should.equal(1);
        redismock.hget(k, f).should.equal(v1);
        redismock.hsetnx(k, f, v2).should.equal(0);
        redismock.hlen(k).should.equal(1);
        redismock.hget(k, f).should.equal(v1);
        redismock.hsetnx(k, f, v3, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            redismock.hlen(k).should.equal(1);
            redismock.hget(k, f).should.equal(v1);
            done();
        });
    });
});

describe('hvals', function () {
    xit('should hvals');
});

describe('hscan', function () {
    xit('should hscan');
});
