(function() {
    var redismock = typeof require === 'function' ? require('../../redis-mock.js') : window.redismock;
    if (typeof chai === 'undefined') {
        var chai = typeof require === 'function' ? require('chai') : window.chai;
    }
    chai.config.includeStack = true;
    var expect = chai.expect;

    function randkey(prefix) {
        if (!prefix) {
            prefix = 'k';
        }
        return prefix + Math.random();
    }

    describe('zadd', function () {
        it('to return an error for a key that is not a zset', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.zadd(k, v)).to.be.an.instanceof(Error);
            redismock.zadd(k, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('to add new zset members with scores', function (done) {
            var k = randkey();
            var v = 'v', v1 = 'v1', v2 = 'v2';
            expect(redismock.zadd(k, 0, v)).to.equal(1);
            expect(redismock.zcard(k)).to.equal(1);
            expect(redismock.type(k)).to.equal('zset');
            expect(redismock.zadd(k, 0, v)).to.equal(0);
            expect(redismock.zcard(k)).to.equal(1);
            redismock.zadd(k, 1, v1, 2, v2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(2);
                expect(redismock.zcard(k)).to.equal(3);
                done();
            });
        });
        it('to update member scores', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.zadd(k, 0, v)).to.equal(1);
            expect(redismock.type(k)).to.equal('zset');
            expect(redismock.zcard(k)).to.equal(1);
            expect(redismock.zadd(k, 1, v)).to.equal(1);
            expect(redismock.zcard(k)).to.equal(1);
            redismock.zadd(k, 2, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.zcard(k)).to.equal(1);
                done();
            });
        });
        it('should add multiple elements with the same score', function () {
            var k = randkey();
            var v1 = 'v1', v11 = 'v11', v12 = 'v12', v5 = 'v5', v51 = 'v51';
            expect(redismock.zadd(k, 1, v1, 1, v11, 1, v12, 5, v5, 5, v51)).to.equal(5);
            expect(redismock.type(k)).to.equal('zset');
            expect(redismock.zcard(k)).to.equal(5);
            var r = redismock.zrange(k, 0, 2);
            expect(r).to.have.lengthOf(3);
            expect(r[0]).to.equal(v1);
            expect(r[1]).to.equal(v11);
            expect(r[2]).to.equal(v12);
            var r = redismock.zrange(k, 0, 2, 'withscores');
            expect(r).to.have.lengthOf(3*2);
            expect(r[1]).to.equal(1);
            expect(r[3]).to.equal(1);
            expect(r[5]).to.equal(1);
            r = redismock.zrange(k, 3, 6, 'withscores');
            expect(r).to.have.lengthOf(2*2);
            expect(r[1]).to.equal(5);
            expect(r[3]).to.equal(5);
        });
    });

    describe('zcard', function () {
        it('to return an error for a key that is not a zset', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.zcard(k)).to.be.an.instanceof(Error);
            redismock.zcard(k, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('to return 0 for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.zcard(k)).to.equal(0);
            redismock.zcard(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('to return the zset cardinality', function (done) {
            var k = randkey();
            var v = 'v', v1 = 'v1', v2 = 'v2';
            expect(redismock.zadd(k, 0, v)).to.equal(1);
            expect(redismock.zcard(k)).to.equal(1);
            expect(redismock.type(k)).to.equal('zset');
            expect(redismock.zadd(k, 0, v)).to.equal(0);
            expect(redismock.zcard(k)).to.equal(1);
            redismock.zadd(k, 1, v1, 2, v2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(2);
                expect(redismock.zcard(k)).to.equal(3);
                done();
            });
        });
    });

    describe('zcount', function () {
        it('should return an error for a key that is not a zset', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.zcount(k, 0, 1)).to.be.an.instanceof(Error);
            redismock.zcount(k, 5, 10, function (err, reply) {           
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('to return 0 for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.zcount(k, 0, 1)).to.equal(0);
            redismock.zcount(k, 0, 1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('to return the count of elements with scores between min and max all inclusive', function (done) {
            var k = randkey();
            var v = 'v', v1 = 'v1', v2 = 'v2';
            expect(redismock.zadd(k, 0, v)).to.equal(1);
            expect(redismock.type(k)).to.equal('zset');
            expect(redismock.zcount(k, 0, 1)).to.equal(1);
            redismock.zadd(k, 1, v1, 2, v2);
            expect(redismock.zcount(k, 0, 1)).to.equal(2);
            expect(redismock.zcount(k, 1, 2)).to.equal(2);
            expect(redismock.zcount(k, 2, 3)).to.equal(1);
            expect(redismock.zcount(k, 5, 10)).to.equal(0);
            redismock.zcount(k, 0, 2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(3);
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
            expect(redismock.zrange(k, 0, 1)).to.be.an.instanceof(Error);
            redismock.zrange(k, 5, 10, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('to return an empty array for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.zrange(k, 0, 1)).to.have.lengthOf(0);
            redismock.zrange(k, 5, 10, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(0);
                done();
            });
        });
        it('to return the range', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            redismock.zadd(k, 1, v1, 2, v2, 3, v3);
            expect(redismock.zrange(k, 0, 1)).to.have.lengthOf(2);
            expect(redismock.zrange(k, 1, 3)).to.have.lengthOf(2);
            expect(redismock.zrange(k, 4, 5)).to.have.lengthOf(0);
            redismock.zrange(k, 0, 2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(3);
                expect(reply[0]).to.equal(v1);
                expect(reply[1]).to.equal(v2);
                expect(reply[2]).to.equal(v3);
                done();
            });
        });
        it('to return the range for negative numbers', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            redismock.zadd(k, 1, v1, 2, v2, 3, v3);
            expect(redismock.zrange(k, -3, -2)).to.have.lengthOf(2);
            expect(redismock.zrange(k, -2, 3)).to.have.lengthOf(2);
            expect(redismock.zrange(k, 4, 5)).to.have.lengthOf(0);
            redismock.zrange(k, 0, -1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(3);
                expect(reply[0]).to.equal(v1);
                expect(reply[1]).to.equal(v2);
                expect(reply[2]).to.equal(v3);
                done();
            });
        });
        it('to return the range withscores', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            redismock.zadd(k, 1, v1, 2, v2, 3, v3);
            expect(redismock.zrange(k, 1, 3, 'withscores')).to.have.lengthOf(2*2);
            redismock.zrange(k, 0, 2, 'withscores', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(3*2);
                expect(reply[0]).to.equal(v1);
                expect(reply[1]).to.equal(1);
                expect(reply[2]).to.equal(v2);
                expect(reply[3]).to.equal(2);
                expect(reply[4]).to.equal(v3);
                expect(reply[5]).to.equal(3);
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
            expect(redismock.zrangebyscore(k, 0, 1)).to.be.an.instanceof(Error);
            redismock.zrangebyscore(k, 5, 10, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('to return an empty array for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.zrangebyscore(k, 0, 1)).to.have.lengthOf(0);
            redismock.zrangebyscore(k, 5, 10, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(0);
                done();
            });
        });
        it('to return the range', function (done) {
            var k = randkey();
            var v1 = 'v1', v11 = 'v11', v2 = 'v2', v5 = 'v5', v7 = 'v7';
            redismock.zadd(k, 1, v1, 1, v11, 2, v2, 5, v5, 7, v7);
            var r = redismock.zrangebyscore(k, 1, 3);
            expect(r).to.have.lengthOf(3);
            expect(r[0]).to.equal(v1);
            expect(r[1]).to.equal(v11);
            expect(r[2]).to.equal(v2);
            redismock.zrangebyscore(k, 4, 8, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(2);
                expect(reply[0]).to.equal(v5);
                expect(reply[1]).to.equal(v7);
                done();
            });
        });
        it('to return the range with scores', function (done) {
            var k = randkey();
            var v1 = 'v1', v11 = 'v11', v2 = 'v2', v5 = 'v5', v7 = 'v7';
            redismock.zadd(k, 1, v1, 1, v11, 2, v2, 5, v5, 7, v7);
            var r = redismock.zrangebyscore(k, 1, 3, 'withscores');
            expect(r).to.have.lengthOf(3*2);
            expect(r[0]).to.equal(v1);
            expect(r[1]).to.equal(1);
            expect(r[2]).to.equal(v11);
            expect(r[3]).to.equal(1);
            expect(r[4]).to.equal(v2);
            expect(r[5]).to.equal(2);
            redismock.zrangebyscore(k, 4, 8, 'withscores', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(2*2);
                expect(reply[0]).to.equal(v5);
                expect(reply[1]).to.equal(5);
                expect(reply[2]).to.equal(v7);
                expect(reply[3]).to.equal(7);
                done();
            });
        });
        xit('to return the range from offset with count', function (done) {
            var k = randkey();
            var v1 = 'v1', v11 = 'v11', v2 = 'v2', v5 = 'v5', v7 = 'v7';
            redismock.zadd(k, 1, v1, 1, v11, 2, v2, 5, v5, 7, v7);
            var r = redismock.zrangebyscore(k, 1, 3, 'limit', 1, 1);
            expect(r).to.have.lengthOf(1);
            expect(r[0]).to.equal(v11);
            redismock.zrangebyscore(k, 2, 8, 'limit', 3, 2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(2*2);
                expect(reply[0]).to.equal(v5);
                expect(reply[1]).to.equal(5);
                expect(reply[2]).to.equal(v7);
                expect(reply[3]).to.equal(7);
                done();
            });
        });
        xit('to return the range for -inf and +inf min/max');
        it('to return the range for exclusive min/max', function () {
            var k = randkey();
            var v1 = 'v1', v11 = 'v11', v2 = 'v2', v5 = 'v5', v7 = 'v7';
            redismock.zadd(k, 1, v1, 1, v11, 2, v2, 5, v5, 7, v7);
            var r = redismock.zrangebyscore(k, '(1', 5);
            expect(r).to.have.lengthOf(2);
            expect(r[0]).to.equal(v2);
            expect(r[1]).to.equal(v5);
            r = redismock.zrangebyscore(k, 1, '(7');
            expect(r).to.have.have.lengthOf(4);
            expect(r[0]).to.equal(v1);
            expect(r[1]).to.equal(v11);
            expect(r[2]).to.equal(v2);
            expect(r[3]).to.equal(v5);
            r = redismock.zrangebyscore(k, '(2', '(5');
            expect(r).to.have.lengthOf(0);
        });
    });

    describe('zrank', function () {
        it('to return an error for a key that is not a zset', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.zrank(k, v)).to.be.an.instanceof(Error);
            redismock.zrank(k, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('to return nothing for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.zrank(k, v)).to.not.exist;
            redismock.zrank(k, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('to get the rank of a member', function (done) {
            var k = randkey();
            var v = 'v', v1 = 'v1', v2 = 'v2';
            expect(redismock.zadd(k, 0, v, 2, v1, 4, v2)).to.equal(3);
            expect(redismock.type(k)).to.equal('zset');
            expect(redismock.zrank(k, v)).to.equal(0);
            expect(redismock.zrank(k, v1)).to.equal(1);
            redismock.zrank(k, v2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(2);
                done();
            });
        });
    });

    describe('zrem', function () {
        it('should return an error for a key that is not a zset', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.zrem(k, v)).to.be.an.instanceof(Error);
            redismock.zrem(k, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('to return 0 for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.zrem(k, v)).to.equal(0);
            redismock.zrem(k, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('to return 0 if the members do not exist', function (done) {
            var k = randkey();
            var v = 'v', nv = 'nv', nv2 = 'nv2';
            redismock.zadd(k, 1, v);
            expect(redismock.zrem(k, nv)).to.equal(0);
            redismock.zrem(k, nv, nv2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('to remove the members and return the removed count', function (done) {
            var k = randkey();
            var v1 = 'v1', v11 = 'v11', v2 = 'v2', v5 = 'v5', v7 = 'v7';
            redismock.zadd(k, 1, v1, 1, v11, 2, v2, 5, v5, 7, v7);
            expect(redismock.zrem(k, v1, v5)).to.equal(2);
            expect(redismock.zcard(k)).to.equal(3);
            redismock.zrem(k, v2, 'nv', v7, 'vv', v11, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(3);
                expect(redismock.zcard(k)).to.equal(0);
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
        xit('should zscan');
    });
}).call(this);