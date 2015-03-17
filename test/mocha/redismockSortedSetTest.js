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
        xit('should store an inter of N zsets into destination', function (done) {
        });
        xit('should weight scores in keys if the weight option is given', function (done) {
        });
        xit('should aggregate scores in keys if the aggregate option is given', function (done) {
        });
        xit('should weight and aggregate if both options given', function (done) {
        });
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
        xit('should return the range from offset with count', function (done) {
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
        it('to return an empty array for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.zrevrange(k, 0, 1)).to.have.lengthOf(0);
            redismock.zrevrange(k, 5, 10, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(0);
                done();
            });
        });
        it('to return the range', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            redismock.zadd(k, 1, v1, 2, v2, 3, v3);
            expect(redismock.zrevrange(k, 0, 1)).to.have.lengthOf(2);
            expect(redismock.zrevrange(k, 1, 3)).to.have.lengthOf(2);
            expect(redismock.zrevrange(k, 4, 5)).to.have.lengthOf(0);
            redismock.zrevrange(k, 0, 2, function (err, reply) {
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
            expect(redismock.zrevrange(k, -3, -2)).to.have.lengthOf(2);
            expect(redismock.zrevrange(k, -2, 3)).to.have.lengthOf(2);
            expect(redismock.zrevrange(k, 4, 5)).to.have.lengthOf(0);
            redismock.zrevrange(k, 0, -1, function (err, reply) {
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
            expect(redismock.zrevrange(k, 1, 3, 'withscores')).to.have.lengthOf(2*2);
            redismock.zrevrange(k, 0, 2, 'withscores', function (err, reply) {
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
        xit('should zrevrank');
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
        xit('should zunionstore');
    });

    describe('zscan', function () {
        xit('should zscan');
    });
}).call(this);
