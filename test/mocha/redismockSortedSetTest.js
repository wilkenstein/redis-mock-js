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
        it('should return an error for a key that is not a zset', function (done) {
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
        it('should add new zset members with scores', function (done) {
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
        it('should update member scores', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.zadd(k, 0, v)).to.equal(1);
            expect(redismock.type(k)).to.equal('zset');
            expect(redismock.zcard(k)).to.equal(1);
            expect(redismock.zadd(k, 1, v)).to.equal(0);
            expect(redismock.zcard(k)).to.equal(1);
            redismock.zadd(k, 2, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
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
        it('should return an error for a key that is not a zset', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.zincrby(k, 1, v)).to.be.an.instanceof(Error);
            redismock.zincrby(k, 2, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should add the member to the set with increment if the member is not in the zset', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2';
            expect(redismock.zincrby(k, 1.1, v1)).to.equal(1.1);
            expect(redismock.zscore(k, v1)).to.equal(1.1);
            redismock.zincrby(k, 2.2, v2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(2.2);
                done();
            });
        });
        it('should increment the score for the member', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            redismock.zadd(k, 1, v1, 2, v2, 3, v3);
            expect(redismock.zscore(k, v1)).to.equal(1);
            expect(redismock.zscore(k, v2)).to.equal(2);
            expect(redismock.zscore(k, v3)).to.equal(3);
            expect(redismock.zincrby(k, 1, v1)).to.equal(2);
            expect(redismock.zscore(k, v1)).to.equal(2);
            expect(redismock.zincrby(k, 2, v2)).to.equal(4);
            expect(redismock.zscore(k, v2)).to.equal(4);
            redismock.zincrby(k, 3, v3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(6);
                expect(redismock.zscore(k, v3)).to.equal(6);
                done();
            });
        });
    });

    describe('zinterstore', function () {
        it('should return an error if a key is not a zset', function (done) {
            var d = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey();
            var v = 'v';
            redismock.set(k1, v);
            redismock.zadd(k2, 0, v);
            redismock.set(k3, v);
            expect(redismock.zinterstore(d, 2, k1, k2)).to.be.an.instanceof(Error);
            redismock.zinterstore(d, 2, k2, k3, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should store an inter of 2 zsets into destination', function (done) {
            var d = randkey(), k1 = randkey(), k2 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            redismock.zadd(k1, 1, v1, 2, v2, 3, v3);
            redismock.zadd(k2, 1, v1, 3, v3);
            expect(redismock.zinterstore(d, 2, k1, k2)).to.equal(2);
            expect(redismock.exists(d)).to.equal(1);
            expect(redismock.type(d)).to.equal('zset');
            var range = redismock.zrange(d, 0, -1, 'withscores');
            expect(range).to.have.lengthOf(4);
            expect(range[0]).to.equal(v1);
            expect(range[1]).to.equal(2);
            expect(range[2]).to.equal(v3);
            expect(range[3]).to.equal(6);
            redismock.zadd(k2, 2, v2);
            redismock.zrem(k2, v1, v3);
            redismock.zinterstore(d, 2, k1, k2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                reply = redismock.zrange(d, 0, -1, 'withscores');
                expect(reply).to.have.lengthOf(2);
                expect(reply[0]).to.equal(v2);
                expect(reply[1]).to.equal(4);
                done();
            });
        });
        it('should store an inter of N zsets into destination', function (done) {
            var d = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey(), k4 = randkey(), k5 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5';
            redismock.zadd(k1, 1, v1, 3, v3, 5, v5);
            redismock.zadd(k2, 1, v1, 2, v2, 3, v3, 4, v4, 5, v5);
            redismock.zadd(k3, 0, v1, 0, v2, 0, v3, 0, v4, 0, v5);
            redismock.zadd(k4, 3, v1, 2, v3, 1, v5);
            redismock.zadd(k5, 1, v1, 1, v2, 1, v3, 1, v4, 1, v5);
            expect(redismock.zinterstore(d, 5, k1, k2, k3, k4, k5)).to.equal(3);
            expect(redismock.exists(d)).to.equal(1);
            expect(redismock.type(d)).to.equal('zset');
            var range = redismock.zrange(d, 0, -1, 'withscores');
            expect(range).to.have.lengthOf(3*2);
            expect(range[0]).to.equal(v1);
            expect(range[1]).to.equal(6);
            expect(range[2]).to.equal(v3);
            expect(range[3]).to.equal(9);
            expect(range[4]).to.equal(v5);
            expect(range[5]).to.equal(12);
            redismock.zadd(k1, 4, v4);
            redismock.zadd(k4, 0, v4);
            redismock.zinterstore(d, 5, k1, k2, k3, k4, k5, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(4);
                range = redismock.zrange(d, 0, -1, 'withscores');
                expect(range).to.have.lengthOf(4*2);
                expect(range[0]).to.equal(v1);
                expect(range[1]).to.equal(6);
                expect(range[2]).to.equal(v3);
                expect(range[3]).to.equal(9);
                expect(range[4]).to.equal(v4);
                expect(range[5]).to.equal(9);
                expect(range[6]).to.equal(v5);
                expect(range[7]).to.equal(12);
                done();
            });
        });
        it('should weight scores in keys if the weight option is given', function (done) {
            var d = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey(), k4 = randkey(), k5 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5';
            redismock.zadd(k1, 1, v1, 3, v3, 5, v5);
            redismock.zadd(k2, 1, v1, 2, v2, 3, v3, 4, v4, 5, v5);
            redismock.zadd(k3, 0, v1, 0, v2, 0, v3, 0, v4, 0, v5);
            redismock.zadd(k4, 3, v1, 2, v3, 1, v5);
            redismock.zadd(k5, 1, v1, 1, v2, 1, v3, 1, v4, 1, v5);
            expect(redismock.zinterstore(d, 5, k1, k2, k3, k4, k5, 'weights', 1, 0, 0, 0)).to.equal(3);
            expect(redismock.exists(d)).to.equal(1);
            expect(redismock.type(d)).to.equal('zset');
            var range = redismock.zrange(d, 0, -1, 'withscores');
            expect(range).to.have.lengthOf(3*2);
            expect(range[0]).to.equal(v1);
            expect(range[1]).to.equal(2);
            expect(range[2]).to.equal(v3);
            expect(range[3]).to.equal(4);
            expect(range[4]).to.equal(v5);
            expect(range[5]).to.equal(6);
            redismock.zadd(k1, 4, v4);
            redismock.zadd(k4, 0, v4);
            redismock.zinterstore(d, 5, k1, k2, k3, k4, k5, 'weights', 0, 2, 0, 3, 10, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(4);
                range = redismock.zrange(d, 0, -1, 'withscores');
                expect(range).to.have.lengthOf(4*2);
                expect(range[0]).to.equal(v4);
                expect(range[1]).to.equal(18);
                expect(range[2]).to.equal(v1);
                expect(range[3]).to.equal(21);
                expect(range[4]).to.equal(v3);
                expect(range[5]).to.equal(22);
                expect(range[6]).to.equal(v5);
                expect(range[7]).to.equal(23);
                done();
            });
        });
        it('should aggregate scores in keys if the aggregate option is given', function (done) {
            var d = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey(), k4 = randkey(), k5 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5';
            redismock.zadd(k1, 1, v1, 3, v3, 5, v5);
            redismock.zadd(k2, 1, v1, 2, v2, 3, v3, 4, v4, 5, v5);
            redismock.zadd(k3, 0, v1, 0, v2, 0, v3, 0, v4, 0, v5);
            redismock.zadd(k4, 3, v1, 2, v3, 1, v5);
            redismock.zadd(k5, 1, v1, 1, v2, 1, v3, 1, v4, 1, v5);
            expect(redismock.zinterstore(d, 5, k1, k2, k3, k4, k5, 'aggregate', 'max')).to.equal(3);
            expect(redismock.exists(d)).to.equal(1);
            expect(redismock.type(d)).to.equal('zset');
            var range = redismock.zrange(d, 0, -1, 'withscores');
            expect(range).to.have.lengthOf(3*2);
            expect(range[0]).to.equal(v1);
            expect(range[1]).to.equal(3);
            expect(range[2]).to.equal(v3);
            expect(range[3]).to.equal(3);
            expect(range[4]).to.equal(v5);
            expect(range[5]).to.equal(5);
            redismock.zadd(k1, 4, v4);
            redismock.zadd(k4, 0, v4);
            redismock.zinterstore(d, 4, k1, k2, k4, k5, 'aggregate', 'min', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(4);
                range = redismock.zrange(d, 0, -1, 'withscores');
                expect(range).to.have.lengthOf(4*2);
                expect(range[0]).to.equal(v4);
                expect(range[1]).to.equal(0);
                expect(range[2]).to.equal(v1);
                expect(range[3]).to.equal(1);
                expect(range[4]).to.equal(v3);
                expect(range[5]).to.equal(1);
                expect(range[6]).to.equal(v5);
                expect(range[7]).to.equal(1);
                done();
            });
        });
        it('should weight and aggregate if both options given', function (done) {
            var d = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey(), k4 = randkey(), k5 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5';
            redismock.zadd(k1, 1, v1, 3, v3, 5, v5);
            redismock.zadd(k2, 1, v1, 2, v2, 3, v3, 4, v4, 5, v5);
            redismock.zadd(k3, 0, v1, 0, v2, 0, v3, 0, v4, 0, v5);
            redismock.zadd(k4, 3, v1, 2, v3, 1, v5);
            redismock.zadd(k5, 1, v1, 1, v2, 1, v3, 1, v4, 1, v5);
            expect(redismock.zinterstore(d, 5, k1, k2, k3, k4, k5, 'aggregate', 'max', 'weights', 0, 4, 9)).to.equal(3);
            expect(redismock.exists(d)).to.equal(1);
            expect(redismock.type(d)).to.equal('zset');
            var range = redismock.zrange(d, 0, -1, 'withscores');
            expect(range).to.have.lengthOf(3*2);
            expect(range[0]).to.equal(v1);
            expect(range[1]).to.equal(4);
            expect(range[2]).to.equal(v3);
            expect(range[3]).to.equal(12);
            expect(range[4]).to.equal(v5);
            expect(range[5]).to.equal(20);
            redismock.zadd(k1, 4, v4);
            redismock.zadd(k4, 0, v4);
            redismock.zinterstore(d, 4, k1, k2, k4, k5, 'aggregate', 'min', 'weights', 2, 2, 2, 2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(4);
                range = redismock.zrange(d, 0, -1, 'withscores');
                expect(range).to.have.lengthOf(4*2);
                expect(range[0]).to.equal(v4);
                expect(range[1]).to.equal(0);
                expect(range[2]).to.equal(v1);
                expect(range[3]).to.equal(2);
                expect(range[4]).to.equal(v3);
                expect(range[5]).to.equal(2);
                expect(range[6]).to.equal(v5);
                expect(range[7]).to.equal(2);
                done();
            });
        });
    });

    describe('zlexcount', function () {
        it('should return an error for a key that is not a zset', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.zlexcount(k, '-', '+')).to.be.an.instanceof(Error);
            redismock.zlexcount(k, '-', '[c', function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return the count of elements in the lex range', function (done) {
            var k = randkey();
            var a = 'a', aa = 'aa', b = 'b', c = 'c', d = 'd', dd = 'dd';
            redismock.zadd(k, 0, a, 0, dd, 0, c, 0, b, 0, d, 0, aa);
            expect(redismock.zlexcount(k, '-', '+')).to.equal(6);
            expect(redismock.zlexcount(k, '-', '(c')).to.equal(3);
            expect(redismock.zlexcount(k, '-', '[c')).to.equal(4);
            expect(redismock.zlexcount(k, '(c', '+')).to.equal(2);
            expect(redismock.zlexcount(k, '[c', '+')).to.equal(3);
            redismock.zlexcount(k, '[a', '(c', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(3);
                done();
            });
        });
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
        it('should return an empty array for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.zrange(k, 0, 1)).to.have.lengthOf(0);
            redismock.zrange(k, 5, 10, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(0);
                done();
            });
        });
        it('should return the range', function (done) {
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
        it('should return the range for negative numbers', function (done) {
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
        it('should return the range withscores', function (done) {
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
        it('should return an error for a key that is not a zset', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.zrangebylex(k, '-', '+')).to.be.an.instanceof(Error);
            redismock.zrangebylex(k, '-', '[c', function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return a range from -inf up to something', function (done) {
            var k = randkey();
            var a = 'a', b = 'b', c = 'c', d = 'd', e = 'e', f = 'f', g = 'g';
            redismock.zadd(k, 0, a, 0, b, 0, c, 0, d, 0, e, 0, f, 0, g);
            var range = redismock.zrangebylex(k, '-', '(c');
            expect(range).to.have.lengthOf(2);
            expect(range[0]).to.equal(a);
            expect(range[1]).to.equal(b);
            redismock.zrangebylex(k, '-', '[c', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(3);
                expect(reply[0]).to.equal(a);
                expect(reply[1]).to.equal(b);
                expect(reply[2]).to.equal(c);
                done();
            });
        });
        it('should return all the members in order from -inf to +inf', function (done) {
            var k = randkey();
            var a = 'a', b = 'b', c = 'c', d = 'd', e = 'e', f = 'f', g = 'g';
            redismock.zadd(k, 0, a, 0, b, 0, c, 0, d, 0, e, 0, f, 0, g);
            var range = redismock.zrangebylex(k, '-', '+');
            expect(range).to.have.lengthOf(7);
            expect(range[0]).to.equal(a);
            expect(range[1]).to.equal(b);
            expect(range[2]).to.equal(c);
            expect(range[3]).to.equal(d);
            expect(range[4]).to.equal(e);
            expect(range[5]).to.equal(f);
            expect(range[6]).to.equal(g);
            redismock.zrangebylex(k, '-', '+', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(7);
                expect(reply[0]).to.equal(a);
                expect(reply[1]).to.equal(b);
                expect(reply[2]).to.equal(c);
                expect(reply[3]).to.equal(d);
                expect(reply[4]).to.equal(e);
                expect(reply[5]).to.equal(f);
                expect(reply[6]).to.equal(g);
                done();
            });
        });
        it('should return from something up to +inf', function (done) {
            var k = randkey();
            var a = 'a', b = 'b', c = 'c', d = 'd', e = 'e', f = 'f', g = 'g';
            redismock.zadd(k, 0, a, 0, b, 0, c, 0, d, 0, e, 0, f, 0, g);
            var range = redismock.zrangebylex(k, '(c', '+');
            expect(range).to.have.lengthOf(4);
            expect(range[0]).to.equal(d);
            expect(range[1]).to.equal(e);
            expect(range[2]).to.equal(f);
            expect(range[3]).to.equal(g);
            redismock.zrangebylex(k, '[c', '+', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(5);
                expect(reply[0]).to.equal(c);
                expect(reply[1]).to.equal(d);
                expect(reply[2]).to.equal(e);
                expect(reply[3]).to.equal(f);
                expect(reply[4]).to.equal(g);
                done();
            });
        });
        it('should return between a range', function (done) {
            var k = randkey();
            var a = 'a', b = 'b', c = 'c', d = 'd', e = 'e', f = 'f', g = 'g';
            redismock.zadd(k, 0, a, 0, b, 0, c, 0, d, 0, e, 0, f, 0, g);
            var range = redismock.zrangebylex(k, '[aaa', '(g');
            expect(range).to.have.lengthOf(5);
            expect(range[0]).to.equal(b);
            expect(range[1]).to.equal(c);
            expect(range[2]).to.equal(d);
            expect(range[3]).to.equal(e);
            expect(range[4]).to.equal(f);
            redismock.zrangebylex(k, '(aaa', '[g', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(6);
                expect(reply[0]).to.equal(b);
                expect(reply[1]).to.equal(c);
                expect(reply[2]).to.equal(d);
                expect(reply[3]).to.equal(e);
                expect(reply[4]).to.equal(f);
                expect(reply[5]).to.equal(g);
                done();
            });
        });
        it('should return an error for invalid string ranges', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.zadd(k, 0, v);
            expect(redismock.zrangebylex(k, 'asdf98', '23')).to.be.an.instanceof(Error);
            redismock.zrangebylex(k, '98', 'lkuoi', function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('ERR')).to.be.above(-1);
                done();
            });
        });
        it('should return an empty array for non-sensical ranges', function () {
            var k = randkey();
            var v = 'v';
            redismock.zadd(k, 0, v);
            expect(redismock.zrangebylex(k, '+', '-')).to.have.lengthOf(0);
        });
    });

    describe('zrevrangebylex', function () {
        it('should return an error for a key that is not a zset', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.zrevrangebylex(k, '+', '-')).to.be.an.instanceof(Error);
            redismock.zrevrangebylex(k, '[c', '-', function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return a range from -inf up to something', function (done) {
            var k = randkey();
            var a = 'a', b = 'b', c = 'c', d = 'd', e = 'e', f = 'f', g = 'g';
            redismock.zadd(k, 0, a, 0, b, 0, c, 0, d, 0, e, 0, f, 0, g);
            var range = redismock.zrevrangebylex(k, '(c', '-');
            expect(range).to.have.lengthOf(2);
            expect(range[0]).to.equal(b);
            expect(range[1]).to.equal(a);
            redismock.zrevrangebylex(k, '[c', '-', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(3);
                expect(reply[0]).to.equal(c);
                expect(reply[1]).to.equal(b);
                expect(reply[2]).to.equal(a);
                done();
            });
        });
        it('should return all the members in order from -inf to +inf', function (done) {
            var k = randkey();
            var a = 'a', b = 'b', c = 'c', d = 'd', e = 'e', f = 'f', g = 'g';
            redismock.zadd(k, 0, a, 0, b, 0, c, 0, d, 0, e, 0, f, 0, g);
            var range = redismock.zrevrangebylex(k, '+', '-');
            expect(range).to.have.lengthOf(7);
            expect(range[0]).to.equal(g);
            expect(range[1]).to.equal(f);
            expect(range[2]).to.equal(e);
            expect(range[3]).to.equal(d);
            expect(range[4]).to.equal(c);
            expect(range[5]).to.equal(b);
            expect(range[6]).to.equal(a);
            redismock.zrevrangebylex(k, '+', '-', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(7);
                expect(reply[0]).to.equal(g);
                expect(reply[1]).to.equal(f);
                expect(reply[2]).to.equal(e);
                expect(reply[3]).to.equal(d);
                expect(reply[4]).to.equal(c);
                expect(reply[5]).to.equal(b);
                expect(reply[6]).to.equal(a);
                done();
            });
        });
        it('should return from something up to +inf', function (done) {
            var k = randkey();
            var a = 'a', b = 'b', c = 'c', d = 'd', e = 'e', f = 'f', g = 'g';
            redismock.zadd(k, 0, a, 0, b, 0, c, 0, d, 0, e, 0, f, 0, g);
            var range = redismock.zrevrangebylex(k, '+', '(c');
            expect(range).to.have.lengthOf(4);
            expect(range[0]).to.equal(g);
            expect(range[1]).to.equal(f);
            expect(range[2]).to.equal(e);
            expect(range[3]).to.equal(d);
            redismock.zrevrangebylex(k, '+', '[c', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(5);
                expect(reply[0]).to.equal(g);
                expect(reply[1]).to.equal(f);
                expect(reply[2]).to.equal(e);
                expect(reply[3]).to.equal(d);
                expect(reply[4]).to.equal(c);
                done();
            });
        });
        it('should return between a range', function (done) {
            var k = randkey();
            var a = 'a', b = 'b', c = 'c', d = 'd', e = 'e', f = 'f', g = 'g';
            redismock.zadd(k, 0, a, 0, b, 0, c, 0, d, 0, e, 0, f, 0, g);
            var range = redismock.zrevrangebylex(k, '(g', '[aaa');
            expect(range).to.have.lengthOf(5);
            expect(range[0]).to.equal(f);
            expect(range[1]).to.equal(e);
            expect(range[2]).to.equal(d);
            expect(range[3]).to.equal(c);
            expect(range[4]).to.equal(b);
            redismock.zrevrangebylex(k, '[g', '(aaa', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(6);
                expect(reply[0]).to.equal(g);
                expect(reply[1]).to.equal(f);
                expect(reply[2]).to.equal(e);
                expect(reply[3]).to.equal(d);
                expect(reply[4]).to.equal(c);
                expect(reply[5]).to.equal(b);
                done();
            });
        });
        it('should return an error for invalid string ranges', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.zadd(k, 0, v);
            expect(redismock.zrevrangebylex(k, 'asdf98', '23')).to.be.an.instanceof(Error);
            redismock.zrevrangebylex(k, '98', 'lkuoi', function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('ERR')).to.be.above(-1);
                done();
            });
        });
        it('should return an empty array for non-sensical ranges', function () {
            var k = randkey();
            var v = 'v';
            redismock.zadd(k, 0, v);
            expect(redismock.zrevrangebylex(k, '-', '+')).to.have.lengthOf(0);
        });
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
        it('should return an empty array for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.zrangebyscore(k, 0, 1)).to.have.lengthOf(0);
            redismock.zrangebyscore(k, 5, 10, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(0);
                done();
            });
        });
        it('should return the range', function (done) {
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
        it('should return the range with scores', function (done) {
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
        it('should return the range from offset with count', function (done) {
            var k = randkey();
            var v1 = 'v1', v11 = 'v11', v2 = 'v2', v5 = 'v5', v7 = 'v7';
            redismock.zadd(k, 1, v1, 1, v11, 2, v2, 5, v5, 7, v7);
            var r = redismock.zrangebyscore(k, 1, 3, 'limit', 1, 1);
            expect(r).to.have.lengthOf(1);
            expect(r[0]).to.equal(v11);
            redismock.zrangebyscore(k, 2, 8, 'limit', 3, 2, 'withscores', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(2*2);
                expect(reply[0]).to.equal(v5);
                expect(reply[1]).to.equal(5);
                expect(reply[2]).to.equal(v7);
                expect(reply[3]).to.equal(7);
                done();
            });
        });
        xit('should return the range for -inf and +inf min/max');
        it('should return the range for exclusive min/max', function () {
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
        it('should return an error for a key that is not a zset', function (done) {
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
        it('should return nothing for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.zrank(k, v)).to.not.exist;
            redismock.zrank(k, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('should get the rank of a member', function (done) {
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
        it('should return an error for a key that is not a zset', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.zremrangebylex(k, '-', '+')).to.be.an.instanceof(Error);
            redismock.zremrangebylex(k, '-', '(c', function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should remove the range by lex', function (done) {
            var k = randkey();
            var a = 'a', aa = 'aa', b = 'b', c = 'c', cc = 'cc', ccc = 'ccc', d = 'd';
            redismock.zadd(k, 0, a, 0, d, 0, ccc, 0, b, 0, aa, 0, cc, 0, c);
            expect(redismock.zremrangebylex(k, '-', '+')).to.equal(7);
            expect(redismock.zcard(k)).to.equal(0);
            redismock.zadd(k, 0, a, 0, d, 0, ccc, 0, b, 0, aa, 0, cc, 0, c);
            expect(redismock.zremrangebylex(k, '-', '(c')).to.equal(3);
            expect(redismock.zcard(k)).to.equal(4);
            expect(redismock.zscore(k, a)).to.not.exist;
            expect(redismock.zscore(k, aa)).to.not.exist;
            expect(redismock.zscore(k, b)).to.not.exist;
            redismock.zadd(k, 0, aa, 0, b, 0, a);
            expect(redismock.zremrangebylex(k, '[cc', '+')).to.equal(3);
            expect(redismock.zcard(k)).to.equal(4);
            expect(redismock.zscore(k, cc)).to.not.exist;
            expect(redismock.zscore(k, ccc)).to.not.exist;
            expect(redismock.zscore(k, d)).to.not.exist;
            redismock.zadd(k, 0, d, 0, ccc, 0, cc);
            redismock.zremrangebylex(k, '(b', '[cc', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(2);
                expect(redismock.zcard(k)).to.equal(5);
                expect(redismock.zscore(k, b)).to.equal(0);
                expect(redismock.zscore(k, c)).to.not.exist;
                expect(redismock.zscore(k, cc)).to.not.exist;
                expect(redismock.zscore(k, ccc)).to.equal(0);
                expect(redismock.zscore(k, d)).to.equal(0);
                done();
            });
        });
    });

    describe('zremrangebyrank', function () {
        it('should return an error for a key that is not a zset', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.zremrangebyrank(k, 0, -1)).to.be.an.instanceof(Error);
            redismock.zremrangebyrank(k, 2, 3, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should remove the range by rank', function (done) {
            var k = randkey();
            var a = 'a', aa = 'aa', b = 'b', c = 'c', cc = 'cc', ccc = 'ccc', d = 'd';
            redismock.zadd(k, 0, a, 1, d, 4, ccc, 2, b, 0, aa, 0, cc, 3, c);
            expect(redismock.zremrangebyrank(k, 0, -1)).to.equal(7);
            expect(redismock.zcard(k)).to.equal(0);
            redismock.zadd(k, 0, a, 1, d, 4, ccc, 2, b, 0, aa, 0, cc, 3, c);
            expect(redismock.zremrangebyrank(k, 0, 2)).to.equal(3);
            expect(redismock.zcard(k)).to.equal(4);
            expect(redismock.zscore(k, a)).to.not.exist;
            expect(redismock.zscore(k, aa)).to.not.exist;
            expect(redismock.zscore(k, cc)).to.not.exist;
            redismock.zadd(k, 0, aa, 0, a, 0, cc);
            expect(redismock.zremrangebyrank(k, -3, -1)).to.equal(3);
            expect(redismock.zcard(k)).to.equal(4);
            expect(redismock.zscore(k, b)).to.not.exist;
            expect(redismock.zscore(k, c)).to.not.exist;
            expect(redismock.zscore(k, ccc)).to.not.exist;
            redismock.zadd(k, 2, b, 4, ccc, 3, c);
            redismock.zremrangebyrank(k, 3, 4, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(2);
                expect(redismock.zcard(k)).to.equal(5);
                expect(redismock.zscore(k, d)).to.not.exist;
                expect(redismock.zscore(k, b)).to.not.exist;
                done();
            });
        });
    });

    describe('zremrangebyscore', function () {
        it('should return an error for a key that is not a zset', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.zremrangebyscore(k, 0, 1)).to.be.an.instanceof(Error);
            redismock.zremrangebyscore(k, 2, 3, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should remove the range by score', function (done) {
            var k = randkey();
            var a = 'a', aa = 'aa', b = 'b', c = 'c', cc = 'cc', ccc = 'ccc', d = 'd';
            redismock.zadd(k, 0, a, 1, d, 4, ccc, 2, b, 0, aa, 0, cc, 3, c);
            expect(redismock.zremrangebyscore(k, 0, 5)).to.equal(7);
            expect(redismock.zcard(k)).to.equal(0);
            redismock.zadd(k, 0, a, 1, d, 4, ccc, 2, b, 0, aa, 0, cc, 3, c);
            expect(redismock.zremrangebyscore(k, 0, 0)).to.equal(3);
            expect(redismock.zcard(k)).to.equal(4);
            expect(redismock.zscore(k, a)).to.not.exist;
            expect(redismock.zscore(k, aa)).to.not.exist;
            expect(redismock.zscore(k, cc)).to.not.exist;
            redismock.zadd(k, 0, aa, 0, a, 0, cc);
            redismock.zremrangebyscore(k, 1, 4, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(4);
                expect(redismock.zcard(k)).to.equal(3);
                expect(redismock.zscore(k, d)).to.not.exist;
                expect(redismock.zscore(k, b)).to.not.exist;
                expect(redismock.zscore(k, c)).to.not.exist;
                expect(redismock.zscore(k, ccc)).to.not.exist;
                done();
            });
        });
    });

    describe('zrevrange', function () {
        it('should return an error for a key that is not a zset', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.zrevrange(k, 0, 1)).to.be.an.instanceof(Error);
            redismock.zrevrange(k, 5, 10, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return an empty array for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.zrevrange(k, 0, 1)).to.have.lengthOf(0);
            redismock.zrevrange(k, 5, 10, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(0);
                done();
            });
        });
        it('should return the range', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            redismock.zadd(k, 1, v1, 2, v2, 3, v3);
            expect(redismock.zrevrange(k, 0, 1)).to.have.lengthOf(2);
            expect(redismock.zrevrange(k, 1, 3)).to.have.lengthOf(2);
            expect(redismock.zrevrange(k, 4, 5)).to.have.lengthOf(0);
            redismock.zrevrange(k, 0, 2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(3);
                expect(reply[0]).to.equal(v3);
                expect(reply[1]).to.equal(v2);
                expect(reply[2]).to.equal(v1);
                done();
            });
        });
        it('should return the range for negative numbers', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            redismock.zadd(k, 1, v1, 2, v2, 3, v3);
            expect(redismock.zrevrange(k, -3, -2)).to.have.lengthOf(2);
            expect(redismock.zrevrange(k, -2, 3)).to.have.lengthOf(2);
            expect(redismock.zrevrange(k, 4, 5)).to.have.lengthOf(0);
            redismock.zrevrange(k, 0, -1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(3);
                expect(reply[0]).to.equal(v3);
                expect(reply[1]).to.equal(v2);
                expect(reply[2]).to.equal(v1);
                done();
            });
        });
        it('should return the range withscores', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            redismock.zadd(k, 1, v1, 2, v2, 3, v3);
            expect(redismock.zrevrange(k, 1, 3, 'withscores')).to.have.lengthOf(2*2);
            redismock.zrevrange(k, 0, 2, 'withscores', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(3*2);
                expect(reply[0]).to.equal(v3);
                expect(reply[1]).to.equal(3);
                expect(reply[2]).to.equal(v2);
                expect(reply[3]).to.equal(2);
                expect(reply[4]).to.equal(v1);
                expect(reply[5]).to.equal(1);
                done();
            });
        });
        xit('should reverse order elements with the same score');
    });

    describe('zrevrangebyscore', function () {
        it('should return an error for a key that is not a zset', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.zrevrangebyscore(k, 0, 1)).to.be.an.instanceof(Error);
            redismock.zrevrangebyscore(k, 5, 10, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return an empty array for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.zrevrangebyscore(k, 0, 1)).to.have.lengthOf(0);
            redismock.zrevrangebyscore(k, 5, 10, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(0);
                done();
            });
        });
        it('should return the range', function (done) {
            var k = randkey();
            var v1 = 'v1', v11 = 'v11', v2 = 'v2', v5 = 'v5', v7 = 'v7';
            redismock.zadd(k, 1, v1, 1, v11, 2, v2, 5, v5, 7, v7);
            var r = redismock.zrevrangebyscore(k, 3, 1);
            expect(r).to.have.lengthOf(3);
            expect(r[0]).to.equal(v2);
            expect(r[1]).to.equal(v11);
            expect(r[2]).to.equal(v1);
            redismock.zrevrangebyscore(k, 8, 4, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(2);
                expect(reply[0]).to.equal(v7);
                expect(reply[1]).to.equal(v5);
                done();
            });
        });
        it('should return the range with scores', function (done) {
            var k = randkey();
            var v1 = 'v1', v11 = 'v11', v2 = 'v2', v5 = 'v5', v7 = 'v7';
            redismock.zadd(k, 1, v1, 1, v11, 2, v2, 5, v5, 7, v7);
            var r = redismock.zrevrangebyscore(k, 3, 1, 'withscores');
            expect(r).to.have.lengthOf(3*2);
            expect(r[0]).to.equal(v2);
            expect(r[1]).to.equal(2);
            expect(r[2]).to.equal(v11);
            expect(r[3]).to.equal(1);
            expect(r[4]).to.equal(v1);
            expect(r[5]).to.equal(1);
            redismock.zrevrangebyscore(k, 8, 4, 'withscores', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(2*2);
                expect(reply[0]).to.equal(v7);
                expect(reply[1]).to.equal(7);
                expect(reply[2]).to.equal(v5);
                expect(reply[3]).to.equal(5);
                done();
            });
        });
        xit('should return the range from offset with count', function (done) {
            var k = randkey();
            var v1 = 'v1', v11 = 'v11', v2 = 'v2', v5 = 'v5', v7 = 'v7';
            redismock.zadd(k, 1, v1, 1, v11, 2, v2, 5, v5, 7, v7);
            var r = redismock.zrevrangebyscore(k, 3, 1, 'limit', 1, 1);
            expect(r).to.have.lengthOf(1);
            expect(r[0]).to.equal(v11);
            redismock.zrevrangebyscore(k, 8, 2, 'limit', 3, 2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(2*2);
                expect(reply[0]).to.equal(v7);
                expect(reply[1]).to.equal(7);
                expect(reply[2]).to.equal(v5);
                expect(reply[3]).to.equal(5);
                done();
            });
        });
        xit('should return the range for -inf and +inf min/max');
        it('should return the range for exclusive min/max', function () {
            var k = randkey();
            var v1 = 'v1', v11 = 'v11', v2 = 'v2', v5 = 'v5', v7 = 'v7';
            redismock.zadd(k, 1, v1, 1, v11, 2, v2, 5, v5, 7, v7);
            var r = redismock.zrevrangebyscore(k, 5, '(1');
            expect(r).to.have.lengthOf(2);
            expect(r[0]).to.equal(v5);
            expect(r[1]).to.equal(v2);
            r = redismock.zrevrangebyscore(k, '(7', '1');
            expect(r).to.have.have.lengthOf(4);
            expect(r[0]).to.equal(v5);
            expect(r[1]).to.equal(v2);
            expect(r[2]).to.equal(v11);
            expect(r[3]).to.equal(v1);
            r = redismock.zrevrangebyscore(k, '(5', '(2');
            expect(r).to.have.lengthOf(0);
        });
        xit('should zrevrangebyscore');
    });

    describe('zrevrank', function () {
        it('should return an error for a key that is not a zset', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.zrevrank(k, v)).to.be.an.instanceof(Error);
            redismock.zrank(k, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return nothing for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.zrevrank(k, v)).to.not.exist;
            redismock.zrank(k, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('should get the reverse rank of a member', function (done) {
            var k = randkey();
            var v = 'v', v1 = 'v1', v2 = 'v2';
            expect(redismock.zadd(k, 0, v, 2, v1, 4, v2)).to.equal(3);
            expect(redismock.type(k)).to.equal('zset');
            expect(redismock.zrevrank(k, v)).to.equal(2);
            expect(redismock.zrevrank(k, v1)).to.equal(1);
            redismock.zrevrank(k, v2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
    });

    describe('zscore', function () {
        it('should return an error for a key that is not a zset', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.zscore(k, v)).to.be.an.instanceof(Error);
            redismock.zscore(k, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return nothing for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.zscore(k, v)).to.not.exist;
            redismock.zscore(k, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('should return nothing for a member that does not exist in the sorted set', function (done) {
            var k = randkey();
            var v = 'v', na = 'na';
            redismock.zadd(k, 0, v);
            expect(redismock.zscore(k, na)).to.not.exist;
            redismock.zscore(k, na, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('should return the score for a member in the sorted set', function (done) {
            var k = randkey();
            var v1 = 'v1', v11 = 'v11', v2 = 'v2', v21 = 'v21', v3 = 'v3', v31 = 'v31', v32 = 'v32';
            redismock.zadd(k, 1, v1, 1, v11, 2, v2, 2, v21, 3, v3, 3, v31, 3, v32);
            expect(redismock.zscore(k, v1)).to.equal(1);
            expect(redismock.zscore(k, v2)).to.equal(2);
            expect(redismock.zscore(k, v3)).to.equal(3);
            expect(redismock.zscore(k, v11)).to.equal(1);
            expect(redismock.zscore(k, v21)).to.equal(2);
            expect(redismock.zscore(k, v31)).to.equal(3);
            redismock.zscore(k, v32, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(3);
                done();
            });
        });
    });

    describe('zunionstore', function () {
        it('should return an error if a key is not a zset', function (done) {
            var d = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey();
            var v = 'v';
            redismock.set(k1, v);
            redismock.zadd(k2, 0, v);
            redismock.set(k3, v);
            expect(redismock.zunionstore(d, 2, k1, k2)).to.be.an.instanceof(Error);
            redismock.zunionstore(d, 2, k2, k3, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should store a union of 2 zsets into destination', function (done) {
            var d = randkey(), k1 = randkey(), k2 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            redismock.zadd(k1, 1, v1, 2, v2, 3, v3);
            redismock.zadd(k2, 1, v1, 3, v3);
            expect(redismock.zunionstore(d, 2, k1, k2)).to.equal(3);
            expect(redismock.exists(d)).to.equal(1);
            expect(redismock.type(d)).to.equal('zset');
            var range = redismock.zrange(d, 0, -1, 'withscores');
            expect(range).to.have.lengthOf(6);
            expect(range[0]).to.equal(v1);
            expect(range[1]).to.equal(2);
            expect(range[2]).to.equal(v2);
            expect(range[3]).to.equal(2);
            expect(range[4]).to.equal(v3);
            expect(range[5]).to.equal(6);
            redismock.zadd(k2, 2, v2);
            redismock.zrem(k2, v1, v3);
            redismock.zunionstore(d, 2, k1, k2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(3);
                range = redismock.zrange(d, 0, -1, 'withscores');
                expect(range).to.have.lengthOf(6);
                expect(range[0]).to.equal(v1);
                expect(range[1]).to.equal(1);
                expect(range[2]).to.equal(v3);
                expect(range[3]).to.equal(3);
                expect(range[4]).to.equal(v2);
                expect(range[5]).to.equal(4);
                done();
            });
        });
        it('should store a union of N zsets into destination', function (done) {
            var d = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey(), k4 = randkey(), k5 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5';
            redismock.zadd(k1, 1, v1, 3, v3, 5, v5);
            redismock.zadd(k2, 1, v1, 2, v2, 3, v3, 4, v4, 5, v5);
            redismock.zadd(k3, 0, v1, 0, v2, 0, v3, 0, v4, 0, v5);
            redismock.zadd(k4, 3, v1, 2, v3, 1, v5);
            redismock.zadd(k5, 1, v1, 1, v2, 1, v3, 1, v4, 1, v5);
            expect(redismock.zunionstore(d, 5, k1, k2, k3, k4, k5)).to.equal(5);
            expect(redismock.exists(d)).to.equal(1);
            expect(redismock.type(d)).to.equal('zset');
            var range = redismock.zrange(d, 0, -1, 'withscores');
            expect(range).to.have.lengthOf(5*2);
            expect(range[0]).to.equal(v2);
            expect(range[1]).to.equal(3);
            expect(range[2]).to.equal(v4);
            expect(range[3]).to.equal(5);
            expect(range[4]).to.equal(v1);
            expect(range[5]).to.equal(6);
            expect(range[6]).to.equal(v3);
            expect(range[7]).to.equal(9);
            expect(range[8]).to.equal(v5);
            expect(range[9]).to.equal(12);
            redismock.zrem(k4, v1, v5);
            redismock.zunionstore(d, 5, k1, k2, k3, k4, k5, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(5);
                range = redismock.zrange(d, 0, -1, 'withscores');
                expect(range).to.have.lengthOf(5*2);
                expect(range[0]).to.equal(v1);
                expect(range[1]).to.equal(3);
                expect(range[2]).to.equal(v2);
                expect(range[3]).to.equal(3);
                expect(range[4]).to.equal(v4);
                expect(range[5]).to.equal(5);
                expect(range[6]).to.equal(v3);
                expect(range[7]).to.equal(9);
                expect(range[8]).to.equal(v5);
                expect(range[9]).to.equal(11);
                done();
            });
        });
        it('should weight scores in keys if the weight option is given', function (done) {
            var d = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey(), k4 = randkey(), k5 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5';
            redismock.zadd(k1, 1, v1, 3, v3, 5, v5);
            redismock.zadd(k2, 1, v1, 2, v2, 3, v3, 4, v4, 5, v5);
            redismock.zadd(k3, 0, v1, 0, v2, 0, v3, 0, v4, 0, v5);
            redismock.zadd(k4, 3, v1, 2, v3, 1, v5);
            redismock.zadd(k5, 1, v1, 1, v2, 1, v3, 1, v4, 1, v5);
            expect(redismock.zunionstore(d, 5, k1, k2, k3, k4, k5, 'weights', 1, 0, 0, 0)).to.equal(5);
            expect(redismock.exists(d)).to.equal(1);
            expect(redismock.type(d)).to.equal('zset');
            var range = redismock.zrange(d, 0, -1, 'withscores');
            expect(range).to.have.lengthOf(5*2);
            expect(range[0]).to.equal(v2);
            expect(range[1]).to.equal(1);
            expect(range[2]).to.equal(v4);
            expect(range[3]).to.equal(1);
            expect(range[4]).to.equal(v1);
            expect(range[5]).to.equal(2);
            expect(range[6]).to.equal(v3);
            expect(range[7]).to.equal(4);
            expect(range[8]).to.equal(v5);
            expect(range[9]).to.equal(6);
            redismock.zrem(k1, v1);
            redismock.zrem(k2, v1);
            redismock.zrem(k3, v1);
            redismock.zrem(k4, v1);
            redismock.zrem(k5, v1);
            redismock.zunionstore(d, 5, k1, k2, k3, k4, k5, 'weights', 0, 2, 0, 3, 10, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(4);
                range = redismock.zrange(d, 0, -1, 'withscores');
                expect(range).to.have.lengthOf(4*2);
                expect(range[0]).to.equal(v2);
                expect(range[1]).to.equal(14);
                expect(range[2]).to.equal(v4);
                expect(range[3]).to.equal(18);
                expect(range[4]).to.equal(v3);
                expect(range[5]).to.equal(22);
                expect(range[6]).to.equal(v5);
                expect(range[7]).to.equal(23);
                done();
            });
        });
        it('should aggregate scores in keys if the aggregate option is given', function (done) {
            var d = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey(), k4 = randkey(), k5 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5';
            redismock.zadd(k1, 1, v1, 3, v3, 5, v5);
            redismock.zadd(k2, 1, v1, 2, v2, 3, v3, 4, v4, 5, v5);
            redismock.zadd(k3, 0, v1, 0, v2, 0, v3, 0, v4, 0, v5);
            redismock.zadd(k4, 3, v1, 2, v3, 1, v5);
            redismock.zadd(k5, 1, v1, 1, v2, 1, v3, 1, v4, 1, v5);
            expect(redismock.zunionstore(d, 5, k1, k2, k3, k4, k5, 'aggregate', 'max')).to.equal(5);
            expect(redismock.exists(d)).to.equal(1);
            expect(redismock.type(d)).to.equal('zset');
            var range = redismock.zrange(d, 0, -1, 'withscores');
            expect(range).to.have.lengthOf(5*2);
            expect(range[0]).to.equal(v2);
            expect(range[1]).to.equal(2);
            expect(range[2]).to.equal(v1);
            expect(range[3]).to.equal(3);
            expect(range[4]).to.equal(v3);
            expect(range[5]).to.equal(3);
            expect(range[6]).to.equal(v4);
            expect(range[7]).to.equal(4);
            expect(range[8]).to.equal(v5);
            expect(range[9]).to.equal(5);
            redismock.zrem(k2, v4);
            redismock.zrem(k3, v4);
            redismock.zrem(k5, v4);
            redismock.zunionstore(d, 4, k1, k2, k4, k5, 'aggregate', 'min', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(4);
                range = redismock.zrange(d, 0, -1, 'withscores');
                expect(range).to.have.lengthOf(4*2);
                expect(range[0]).to.equal(v1);
                expect(range[1]).to.equal(1);
                expect(range[2]).to.equal(v2);
                expect(range[3]).to.equal(1);
                expect(range[4]).to.equal(v3);
                expect(range[5]).to.equal(1);
                expect(range[6]).to.equal(v5);
                expect(range[7]).to.equal(1);
                done();
            });
        });
        it('should weight and aggregate if both options given', function (done) {
            var d = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey(), k4 = randkey(), k5 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5';
            redismock.zadd(k1, 1, v1, 3, v3, 5, v5);
            redismock.zadd(k2, 1, v1, 2, v2, 3, v3, 4, v4, 5, v5);
            redismock.zadd(k3, 0, v1, 0, v2, 0, v3, 0, v4, 0, v5);
            redismock.zadd(k4, 3, v1, 2, v3, 1, v5);
            redismock.zadd(k5, 1, v1, 1, v2, 1, v3, 1, v4, 1, v5);
            expect(redismock.zunionstore(d, 5, k1, k2, k3, k4, k5, 'aggregate', 'max', 'weights', 0, 4, 9)).to.equal(5);
            expect(redismock.exists(d)).to.equal(1);
            expect(redismock.type(d)).to.equal('zset');
            var range = redismock.zrange(d, 0, -1, 'withscores');
            expect(range).to.have.lengthOf(5*2);
            expect(range[0]).to.equal(v1);
            expect(range[1]).to.equal(4);
            expect(range[2]).to.equal(v2);
            expect(range[3]).to.equal(8);
            expect(range[4]).to.equal(v3);
            expect(range[5]).to.equal(12);
            expect(range[6]).to.equal(v4);
            expect(range[7]).to.equal(16);
            expect(range[8]).to.equal(v5);
            expect(range[9]).to.equal(20);
            redismock.zunionstore(d, 4, k1, k2, k4, k5, 'aggregate', 'min', 'weights', 2, 2, 2, 2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(5);
                range = redismock.zrange(d, 0, -1, 'withscores');
                expect(range).to.have.lengthOf(5*2);
                expect(range[0]).to.equal(v1);
                expect(range[1]).to.equal(2);
                expect(range[2]).to.equal(v2);
                expect(range[3]).to.equal(2);
                expect(range[4]).to.equal(v3);
                expect(range[5]).to.equal(2);
                expect(range[6]).to.equal(v4);
                expect(range[7]).to.equal(2);
                expect(range[8]).to.equal(v5);
                expect(range[9]).to.equal(2);
                done();
            });
        });
    });

    describe('zscan', function () {
        it('should return an error for a key that is not a zset', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.zscan(k, 0)).to.be.an.instanceof(Error);
            redismock.zscan(k, 0, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should zscan through a small zset and return every element', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4';
            redismock.zadd(k, 1, v1, 2, v2, 3, v3);
            var scan = redismock.zscan(k, 0);
            expect(scan).to.have.lengthOf(2);
            expect(scan[0]).to.equal(3);
            expect(scan[1][0]).to.equal(v1);
            expect(scan[1][1]).to.equal(1);
            expect(scan[1][2]).to.equal(v2);
            expect(scan[1][3]).to.equal(2);
            expect(scan[1][4]).to.equal(v3);
            expect(scan[1][5]).to.equal(3);
            redismock.zadd(k, 4, v4);
            redismock.zscan(k, 0, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(2);
                expect(reply[0]).to.equal(4);
                expect(reply[1][0]).to.equal(v1);
                expect(reply[1][1]).to.equal(1);
                expect(reply[1][2]).to.equal(v2);
                expect(reply[1][3]).to.equal(2);
                expect(reply[1][4]).to.equal(v3);
                expect(reply[1][5]).to.equal(3);
                expect(reply[1][6]).to.equal(v4);
                expect(reply[1][7]).to.equal(4);
                done();
            });
        });
        it('should zscan through a large set with cursoring', function (done) {
            var k = randkey();
            var set = [];
            for (var idx = 0; idx < 62; idx += 1) {
                set.push(idx);
                set.push(idx.toString());
            }
            redismock.zadd.apply(redismock, [k].concat(set));
            var scan, cursor = 0, scanned = [];
            while (true) {
                scan = redismock.zscan(k, cursor);
                if (scan instanceof Error) {
                    return done(scan);
                }
                if (!scan[1] || !scan[1].length) {
                    break;
                }
                scanned = scanned.concat(scan[1]);
                cursor = scan[0];
            }
            expect(scanned).to.have.lengthOf(set.length);
            expect(set.every(function (i) {
                return scanned.indexOf(i) !== -1;
            })).to.be.true;
            scan = redismock.zscan(k, cursor);
            expect(scan[1]).to.have.lengthOf(0);
            scanned = [];
            var f;
            f = function (cursor, callback) {
                redismock.zscan(k, cursor, function (err, reply) {
                    if (err) {
                        return callback(err);
                    }
                    if (!reply[1] || !reply[1].length) {
                        expect(scanned).to.have.lengthOf(set.length);
                        expect(set.every(function (i) {
                            return scanned.indexOf(i) !== -1;
                        })).to.be.true; 
                        return callback();
                    }
                    scanned = scanned.concat(reply[1]);
                    f(reply[0], callback);
                });
            };
            f(0, done);
        });
        it('should zscan through a large set with cursoring and a count', function (done) {
            var k = randkey();
            var set = [];
            for (var idx = 0; idx < 62; idx += 1) {
                set.push(idx);
                set.push(idx.toString());
            }
            redismock.zadd.apply(redismock, [k].concat(set));
            var scan, cursor = 0, scanned = [], count = 5;
            while (true) {
                scan = redismock.zscan(k, cursor, 'count', count);
                if (scan instanceof Error) {
                    return done(scan);
                }
                if (!scan[1] || !scan[1].length) {
                    break;
                }
                scanned = scanned.concat(scan[1]);
                cursor = scan[0];
            }
            expect(scanned).to.have.lengthOf(set.length);
            expect(set.every(function (i) {
                return scanned.indexOf(i) !== -1;
            })).to.be.true;
            scan = redismock.zscan(k, cursor, 'count', count);
            expect(scan[1]).to.have.lengthOf(0);
            scanned = [];
            var f;
            f = function (cursor, count, callback) {
                redismock.zscan(k, cursor, 'count', count, function (err, reply) {
                    if (err) {
                        return callback(err);
                    }
                    if (!reply[1] || !reply[1].length) {
                        expect(scanned).to.have.lengthOf(set.length);
                        expect(set.every(function (i) {
                            return scanned.indexOf(i) !== -1;
                        })).to.be.true; 
                        return callback();
                    }
                    scanned = scanned.concat(reply[1]);
                    f(reply[0], count, callback);
                });
            };
            f(0, 6, done);
        });
        it('should zscan through a large set with cursoring and a match', function (done) {
            var k = randkey();
            var set = [];
            for (var idx = 0; idx < 62; idx += 1) {
                set.push(idx);
                set.push(idx.toString());
            }
            redismock.zadd.apply(redismock, [k].concat(set));
            var scan, cursor = 0, scanned = [], match = '[0-9]'; // All single digit #s
            while (true) {
                scan = redismock.zscan(k, cursor, 'match', match);
                if (scan instanceof Error) {
                    return done(scan);
                }
                if (!scan[1] || !scan[1].length) {
                    break;
                }
                scanned = scanned.concat(scan[1]);
                cursor = scan[0];
            }
            expect(scanned).to.have.lengthOf(10*2);
            expect(scanned.every(function (i) {
                return i.toString().length === 1 && set.indexOf(i) !== -1;
            })).to.be.true;
            scan = redismock.zscan(k, cursor, 'match', match);
            expect(scan[1]).to.have.lengthOf(0);
            scanned = [];
            var f;
            f = function (cursor, match, callback) {
                redismock.zscan(k, cursor, 'match', match, function (err, reply) {
                    if (err) {
                        return callback(err);
                    }
                    if (!reply[1] || !reply[1].length) {
                        expect(scanned).to.have.lengthOf(52*2);
                        expect(scanned.every(function (i) {
                            return i.toString().length === 2 && set.indexOf(i) !== -1;
                        })).to.be.true; 
                        return callback();
                    }
                    scanned = scanned.concat(reply[1]);
                    f(reply[0], match, callback);
                });
            };
            f(0, '[0-9]?', done); // All two digit numbers
        });
        ('should zscan through a large set with cursoring, a count, and a match', function (done) {
            var k = randkey();
            var set = [];
            for (var idx = 0; idx < 62; idx += 1) {
                set.push(idx);
                set.push(idx.toString());
            }
            redismock.zadd.apply(redismock, [k].concat(set));
            var scan, cursor = 0, scanned = [], count = 4, match = '[0-9]'; // All single digit #s
            while (true) {
                scan = redismock.zscan(k, cursor, 'count', count, 'match', match);
                if (scan instanceof Error) {
                    return done(scan);
                }
                if (!scan[1] || !scan[1].length) {
                    break;
                }
                scanned = scanned.concat(scan[1]);
                cursor = scan[0];
            }
            expect(scanned).to.have.lengthOf(10*2);
            expect(scanned.every(function (i) {
                return i.toString().length === 1 && set.indexOf(i) !== -1;
            })).to.be.true;
            scan = redismock.zscan(k, cursor, 'match', match);
            expect(scan[1]).to.have.lengthOf(0);
            scanned = [];
            var f;
            f = function (cursor, count, match, callback) {
                redismock.zscan(k, cursor, 'count', count, 'match', match, function (err, reply) {
                    if (err) {
                        return callback(err);
                    }
                    if (!reply[1] || !reply[1].length) {
                        expect(scanned).to.have.lengthOf(52*2);
                        expect(scanned.every(function (i) {
                            return i.toString().length === 2 && set.indexOf(i) !== -1;
                        })).to.be.true; 
                        return callback();
                    }
                    scanned = scanned.concat(reply[1]);
                    f(reply[0], count, match, callback);
                });
            };
            f(0, 7, '[0-9]?', done); // All two digit numbers
        });
    });
}).call(this);
