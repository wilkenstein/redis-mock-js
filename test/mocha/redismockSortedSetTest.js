var redismock = require('../../redis-mock.js');
var should = require('should');

function randkey(prefix) {
    if (!prefix) {
        prefix = 'k';
    }
    return prefix + Math.random();
}

describe('zadd', function () {
    it('should return an error for a key that is not a zset', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.set(k, v);
        (redismock.zadd(k, v) instanceof Error).should.be.true;
        redismock.zadd(k, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should add new zset members with scores', function (done) {
        var k = randkey();
        var v = 'v', v1 = 'v1', v2 = 'v2';
        redismock.zadd(k, 0, v).should.equal(1);
        redismock.zcard(k).should.equal(1);
        redismock.type(k).should.equal('zset');
        redismock.zadd(k, 0, v).should.equal(0);
        redismock.zcard(k).should.equal(1);
        redismock.zadd(k, 1, v1, 2, v2, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(2);
            redismock.zcard(k).should.equal(3);
            done();
        });
    });
    it('should update member scores', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.zadd(k, 0, v).should.equal(1);
        redismock.type(k).should.equal('zset');
        redismock.zcard(k).should.equal(1);
        redismock.zadd(k, 1, v).should.equal(1);
        redismock.zcard(k).should.equal(1);
        redismock.zadd(k, 2, v, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(1);
            redismock.zcard(k).should.equal(1);
            done();
        });
    });
});

describe('zcard', function () {
    it('should return an error for a key that is not a zset', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.set(k, v);
        (redismock.zcard(k) instanceof Error).should.be.true;
        redismock.zcard(k, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return 0 for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.zcard(k).should.equal(0);
        redismock.zcard(k, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return the zset cardinality', function (done) {
        var k = randkey();
        var v = 'v', v1 = 'v1', v2 = 'v2';
        redismock.zadd(k, 0, v).should.equal(1);
        redismock.zcard(k).should.equal(1);
        redismock.type(k).should.equal('zset');
        redismock.zadd(k, 0, v).should.equal(0);
        redismock.zcard(k).should.equal(1);
        redismock.zadd(k, 1, v1, 2, v2, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(2);
            redismock.zcard(k).should.equal(3);
            done();
        });
    });
});

describe('zcount', function () {
    it('should return an error for a key that is not a zset', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.set(k, v);
        (redismock.zcount(k, 0, 1) instanceof Error).should.be.true;
        redismock.zcount(k, 5, 10, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return 0 for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.zcount(k, 0, 1).should.equal(0);
        redismock.zcount(k, 0, 1, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return the count of elements with scores between min and max all inclusive', function (done) {
        var k = randkey();
        var v = 'v', v1 = 'v1', v2 = 'v2';
        redismock.zadd(k, 0, v).should.equal(1);
        redismock.type(k).should.equal('zset');
        redismock.zcount(k, 0, 1).should.equal(1);
        redismock.zadd(k, 1, v1, 2, v2);
        redismock.zcount(k, 0, 1).should.equal(2);
        redismock.zcount(k, 1, 2).should.equal(2);
        redismock.zcount(k, 2, 3).should.equal(1);
        redismock.zcount(k, 5, 10).should.equal(0);
        redismock.zcount(k, 0, 2, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(3);
            done();
        });
    });
});

describe('zincrby', function () {
    xit('should zincrby');
});

describe('zinterstore', function () {
    xit('should zinterstore');
});

describe('zlexcount', function () {
    xit('should zlexcount');
});

describe('zrange', function () {
    it('should return an error for a key that is not a zset', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.set(k, v);
        (redismock.zrange(k, 0, 1) instanceof Error).should.be.true;
        redismock.zrange(k, 5, 10, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return an empty array for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.zrange(k, 0, 1).should.have.lengthOf(0);
        redismock.zrange(k, 5, 10, function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(0);
            done();
        });
    });
    it('should return the range', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        redismock.zadd(k, 1, v1, 2, v2, 3, v3);
        redismock.zrange(k, 0, 1).should.have.lengthOf(2);
        redismock.zrange(k, 1, 3).should.have.lengthOf(2);
        redismock.zrange(k, 4, 5).should.have.lengthOf(0);
        redismock.zrange(k, 0, 2, function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(3);
            reply[0].should.equal(v1);
            reply[1].should.equal(v2);
            reply[2].should.equal(v3);
            done();
        });
    });
    it('should return the range for negative numbers', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        redismock.zadd(k, 1, v1, 2, v2, 3, v3);
        redismock.zrange(k, -3, -2).should.have.lengthOf(2);
        redismock.zrange(k, -2, 3).should.have.lengthOf(2);
        redismock.zrange(k, 4, 5).should.have.lengthOf(0);
        redismock.zrange(k, 0, -1, function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(3);
            reply[0].should.equal(v1);
            reply[1].should.equal(v2);
            reply[2].should.equal(v3);
            done();
        });
    });
    it('should return the range withscores', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        redismock.zadd(k, 1, v1, 2, v2, 3, v3);
        redismock.zrange(k, 1, 3, 'withscores').should.have.lengthOf(2*2);
        redismock.zrange(k, 0, 2, 'withscores', function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(3*2);
            reply[0].should.equal(v1);
            reply[1].should.equal(1);
            reply[2].should.equal(v2);
            reply[3].should.equal(2);
            reply[4].should.equal(v3);
            reply[5].should.equal(3);
            done();
        });
    });
});

describe('zrank', function () {
    it('should return an error for a key that is not a zset', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.set(k, v);
        (redismock.zrank(k, v) instanceof Error).should.be.true;
        redismock.zrank(k, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return nothing for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'v';
        should.not.exist(redismock.zrank(k, v));
        redismock.zrank(k, v, function (err, reply) {
            should.not.exist(err);
            should.not.exist(reply);
            done();
        });
    });
    it('should get the rank of a member', function (done) {
        var k = randkey();
        var v = 'v', v1 = 'v1', v2 = 'v2';
        redismock.zadd(k, 0, v, 2, v1, 4, v2).should.equal(3);
        redismock.type(k).should.equal('zset');
        redismock.zrank(k, v).should.equal(0);
        redismock.zrank(k, v1).should.equal(1);
        redismock.zrank(k, v2, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(2);
            done();
        });
    });
});
