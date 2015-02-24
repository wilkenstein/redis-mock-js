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
    it('should add multiple elements with the same score', function () {
        var k = randkey();
        var v1 = 'v1', v11 = 'v11', v12 = 'v12', v5 = 'v5', v51 = 'v51';
        redismock.zadd(k, 1, v1, 1, v11, 1, v12, 5, v5, 5, v51).should.equal(5);
        redismock.type(k).should.equal('zset');
        redismock.zcard(k).should.equal(5);
        var r = redismock.zrange(k, 0, 2);
        r.should.have.lengthOf(3);
        r[0].should.equal(v1);
        r[1].should.equal(v11);
        r[2].should.equal(v12);
        var r = redismock.zrange(k, 0, 2, 'withscores');
        r.should.have.lengthOf(3*2);
        r[1].should.equal(1);
        r[3].should.equal(1);
        r[5].should.equal(1);
        r = redismock.zrange(k, 3, 6, 'withscores');
        r.should.have.lengthOf(2*2);
        r[1].should.equal(5);
        r[3].should.equal(5);
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

describe('zrangebylex', function () {
    xit('should zrangebylex');
});

describe('zrevrangebylex', function () {
    xit('should zrevrangebylex');
});

describe('zrangebyscore', function () {
    it('should return an error for a key that is not a zset', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.set(k, v);
        (redismock.zrangebyscore(k, 0, 1) instanceof Error).should.be.true;
        redismock.zrangebyscore(k, 5, 10, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return an empty array for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.zrangebyscore(k, 0, 1).should.have.lengthOf(0);
        redismock.zrangebyscore(k, 5, 10, function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(0);
            done();
        });
    });
    it('should return the range', function (done) {
        var k = randkey();
        var v1 = 'v1', v11 = 'v11', v2 = 'v2', v5 = 'v5', v7 = 'v7';
        redismock.zadd(k, 1, v1, 1, v11, 2, v2, 5, v5, 7, v7);
        var r = redismock.zrangebyscore(k, 1, 3);
        r.should.have.lengthOf(3);
        r[0].should.equal(v1);
        r[1].should.equal(v11);
        r[2].should.equal(v2);
        redismock.zrangebyscore(k, 4, 8, function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(2);
            reply[0].should.equal(v5);
            reply[1].should.equal(v7);
            done();
        });
    });
    it('should return the range with scores', function (done) {
        var k = randkey();
        var v1 = 'v1', v11 = 'v11', v2 = 'v2', v5 = 'v5', v7 = 'v7';
        redismock.zadd(k, 1, v1, 1, v11, 2, v2, 5, v5, 7, v7);
        var r = redismock.zrangebyscore(k, 1, 3, 'withscores');
        r.should.have.lengthOf(3*2);
        r[0].should.equal(v1);
        r[1].should.equal(1);
        r[2].should.equal(v11);
        r[3].should.equal(1);
        r[4].should.equal(v2);
        r[5].should.equal(2);
        redismock.zrangebyscore(k, 4, 8, 'withscores', function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(2*2);
            reply[0].should.equal(v5);
            reply[1].should.equal(5);
            reply[2].should.equal(v7);
            reply[3].should.equal(7);
            done();
        });
    });
    xit('should return the range from offset with count', function (done) {
        var k = randkey();
        var v1 = 'v1', v11 = 'v11', v2 = 'v2', v5 = 'v5', v7 = 'v7';
        redismock.zadd(k, 1, v1, 1, v11, 2, v2, 5, v5, 7, v7);
        var r = redismock.zrangebyscore(k, 1, 3, 'limit', 1, 1);
        r.should.have.lengthOf(1);
        r[0].should.equal(v11);
        redismock.zrangebyscore(k, 2, 8, 'limit', 3, 2, function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(2*2);
            reply[0].should.equal(v5);
            reply[1].should.equal(5);
            reply[2].should.equal(v7);
            reply[3].should.equal(7);
            done();
        });
    });
    xit('should return the range for -inf and +inf min/max');
    it('should return the range for exclusive min/max', function () {
        var k = randkey();
        var v1 = 'v1', v11 = 'v11', v2 = 'v2', v5 = 'v5', v7 = 'v7';
        redismock.zadd(k, 1, v1, 1, v11, 2, v2, 5, v5, 7, v7);
        var r = redismock.zrangebyscore(k, '(1', 5);
        r.should.have.lengthOf(2);
        r[0].should.equal(v2);
        r[1].should.equal(v5);
        r = redismock.zrangebyscore(k, 1, '(7');
        r.should.have.have.lengthOf(4);
        r[0].should.equal(v1);
        r[1].should.equal(v11);
        r[2].should.equal(v2);
        r[3].should.equal(v5);
        r = redismock.zrangebyscore(k, '(2', '(5');
        r.should.have.lengthOf(0);
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

describe('zrem', function () {
    it('should return an error for a key that is not a zset', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.set(k, v);
        (redismock.zrem(k, v) instanceof Error).should.be.true;
        redismock.zrem(k, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return 0 for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.zrem(k, v).should.equal(0);
        redismock.zrem(k, v, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return 0 if the members do not exist', function (done) {
        var k = randkey();
        var v = 'v', nv = 'nv', nv2 = 'nv2';
        redismock.zadd(k, 1, v);
        redismock.zrem(k, nv).should.equal(0);
        redismock.zrem(k, nv, nv2, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should remove the members and return the removed count', function (done) {
        var k = randkey();
        var v1 = 'v1', v11 = 'v11', v2 = 'v2', v5 = 'v5', v7 = 'v7';
        redismock.zadd(k, 1, v1, 1, v11, 2, v2, 5, v5, 7, v7);
        redismock.zrem(k, v1, v5).should.equal(2);
        redismock.zcard(k).should.equal(3);
        redismock.zrem(k, v2, 'nv', v7, 'vv', v11, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(3);
            redismock.zcard(k).should.equal(0);
            done();
        });
    });
});

describe('zremrangebylex', function () {
    xit('should zremrangebylex');
});

describe('zremrangebyrank', function () {
    xit('should zremrangebyrank');
});

describe('zremrangebyscore', function () {
    xit('should zremrangebyscore');
});

describe('zrevrange', function () {
    xit('should zrevrange');
});

describe('zrevrangebyscore', function () {
    xit('should zrevrangebyscore');
});

describe('zrevrank', function () {
    xit('should zrevrank');
});

describe('zscore', function () {
    xit('should zscore');
});

describe('zunionstore', function () {
    xit('should zunionstore');
});

describe('zscan', function () {
});
