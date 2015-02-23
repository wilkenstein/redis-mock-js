var redismock = require('../../redis-mock.js');
var should = require('should');

function randkey(prefix) {
    if (!prefix) {
        prefix = 'k';
    }
    return prefix + Math.random();
}

describe('sadd', function () {
    it('should return an error for a key that is not a set', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.set(k, v);
        (redismock.sadd(k, v) instanceof Error).should.be.true;
        redismock.sadd(k, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should add a new set member', function (done) {
        var k = randkey();
        var v = 'v', v1 = 'v1', v2 = 'v2';
        redismock.sadd(k, v).should.equal(1);
        redismock.type(k).should.equal('set');
        redismock.sadd(k, v).should.equal(0);
        redismock.sadd(k, v1, v2, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(2);
            done();
        });
    });
});

describe('scard', function () {
    it('should return an error for a key that is not a set', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.set(k, v);
        (redismock.scard(k) instanceof Error).should.be.true;
        redismock.scard(k, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return 0 for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.scard(k, v).should.equal(0);
        redismock.scard(k, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return the set cardinality', function (done) {
        var k = randkey();
        var v = 'v', v1 = 'v1';
        redismock.sadd(k, v);
        redismock.scard(k, v).should.equal(1);
        redismock.sadd(k, v1);
        redismock.scard(k, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(2);
            done();
        });
    });
});

describe('sdiff', function () {
    xit('should sdiff');
});

describe('sdiffstore', function () {
    xit('should sdiffstore');
});

describe('sinter', function () {
    xit('should sinter');
});

describe('sinterstore', function () {
    xit('should sinterstore');
});

describe('sismember', function () {
    xit('should sismember');
});

describe('smembers', function () {
    xit('should smembers');
});

describe('smove', function () {
    it('should return an error for a source key that is not a set', function (done) {
        var k1 = randkey(), k2 = randkey();
        var v = 'v';
        redismock.set(k1, v);
        (redismock.smove(k1, k2, v) instanceof Error).should.be.true;
        redismock.smove(k1, k2, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return an error for a destination key that is not a set', function (done) {
        var k1 = randkey(), k2 = randkey();
        var v = 'v';
        redismock.sadd(k1, v);
        redismock.set(k2, v);
        (redismock.smove(k1, k2, v) instanceof Error).should.be.true;
        redismock.smove(k1, k2, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should do nothing if the element is not in the source set', function (done) {
        var k1 = randkey(), k2 = randkey();
        var v = 'v';
        redismock.smove(k1, k2, v).should.equal(0);
        redismock.smove(k1, k2, v, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should move the element from the source to the destination', function (done) {
        var k1 = randkey(), k2 = randkey();
        var v = 'v', v1 = 'v1';
        redismock.sadd(k1, v);
        redismock.smove(k1, k2, v).should.equal(1);
        redismock.scard(k1).should.equal(0);
        redismock.scard(k2).should.equal(1);
        redismock.sismember(k1, v).should.equal(0);
        redismock.sismember(k2, v).should.equal(1);
        redismock.sadd(k2, v1);
        redismock.smove(k2, k1, v1, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(1);
            redismock.scard(k1).should.equal(1);
            redismock.scard(k2).should.equal(1);
            redismock.sismember(k2, v1).should.equal(0);
            redismock.sismember(k1, v1).should.equal(1);
            done();
        });
    });
});

describe('spop', function () {
    xit('should spop');
});

describe('srandmember', function () {
    xit('should srandmember');
});

describe('srem', function () {
    xit('should srem');
});

describe('sunion', function () {
    xit('should sunion');
});

describe('sunionstore', function () {
    xit('should sunionstore');
});

describe('sscan', function () {
    xit('should sscan');
});
