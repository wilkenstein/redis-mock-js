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

    describe('blpop', function () {
        it('should return an error for a key that is not a list', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.blpop(k, 0, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
            redismock.set(k, v);
        });
        it('should call the callback when an element becomes available on a key', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.blpop(k, 0, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v);
                expect(redismock.llen(k)).to.equal(0);
                done();
            });
            setTimeout(function () {
                redismock.lpush(k, v);
            }, 1000);
        });
        it('should call the callback when an element becomes available on any key', function (done) {
            var k1 = randkey(), k2 = randkey(), k3 = randkey(), k4 = randkey(), k5 = randkey();
            var v = 'value';
            redismock.blpop(k1, k2, k3, k4, k5, 0, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v);
                expect(redismock.llen(k3)).to.equal(0);
                done();
            });
            setTimeout(function () {
                redismock.lpush(k3, v);
            }, 1000);
        });
        it('should timeout if no elements become available within the given time limit', function (done) {
            this.timeout(5000);
            var k1 = randkey(), k2 = randkey(), k3 = randkey(), k4 = randkey(), k5 = randkey();
            var v = 'value';
            redismock.blpop(k1, k2, k3, k4, k5, 2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
    });

    describe('brpop', function () {
        it('should return an error for a key that is not a list', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.brpop(k, 0, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
            redismock.set(k, v);
        });
        it('should call the callback when an element becomes available on a key', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.brpop(k, 0, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v);
                expect(redismock.llen(k)).to.equal(0);
                done();
            });
            setTimeout(function () {
                redismock.lpush(k, v);
            }, 1000);
        });
        it('should call the callback when an element becomes available on any key', function (done) {
            var k1 = randkey(), k2 = randkey(), k3 = randkey(), k4 = randkey(), k5 = randkey();
            var v = 'value';
            redismock.brpop(k1, k2, k3, k4, k5, 0, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v);
                expect(redismock.llen(k3)).to.equal(0);
                done();
            });
            setTimeout(function () {
                redismock.lpush(k3, v);
            }, 1000);
        });
        it('should timeout if no elements become available within the given time limit', function (done) {
            this.timeout(5000);
            var k1 = randkey(), k2 = randkey(), k3 = randkey(), k4 = randkey(), k5 = randkey();
            var v = 'value';
            redismock.brpop(k1, k2, k3, k4, k5, 2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
    });

    describe('brpoplpush', function () {
        it('should return an error for a source that is not a list', function (done) {
            var s = randkey(), d = randkey();
            var v = 'value';
            redismock.brpoplpush(s, d, 0, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
            redismock.set(s, v);
        });
        it('should return an error for a destination that is not a list', function (done) {
            var s = randkey(), d = randkey();
            var v = 'value';
            redismock.brpoplpush(s, d, 0, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
            redismock.set(d, v);
            redismock.lpush(s, v);
        });
        it('should call the callback when an element becomes available on source', function (done) {
            var s = randkey(), d = randkey();
            var v = 'value';
            redismock.brpoplpush(s, d, 0, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v);
                expect(redismock.llen(s)).to.equal(0);
                expect(redismock.llen(d)).to.equal(1);
                expect(redismock.lindex(d, 0)).to.equal(v);
                done();
            });
            setTimeout(function () {
                redismock.lpush(s, v);
            }, 1000);
        });
        it('should timeout if no elements become available within the given time limit', function (done) {
            this.timeout(5000);
            var s = randkey(), d = randkey();
            var v = 'value';
            redismock.brpoplpush(s, d, 2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
    });

    describe('lindex', function () {
        it('should return nothing for a key that does not exist', function (done) {
            expect(redismock.lindex(randkey(), 5)).to.not.exist;
            redismock.lindex(randkey(), 4, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('should return an error for a key that is not a list', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.lindex(k, 2)).to.be.an.instanceof(Error);
            redismock.lindex(k, 3, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return nothing for an out of range index', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v);
            expect(redismock.lindex(k, 2)).to.not.exst;
            redismock.lindex(k, -2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('should return the element at the given, in-range index', function (done) {
            var k = randkey();
            var v1 = 'value1', v2 = 'value2', v3 = 'value3';
            redismock.rpush(k, v1);
            redismock.rpush(k, v2);
            redismock.rpush(k, v3);
            expect(redismock.lindex(k, 0)).to.equal(v1);
            expect(redismock.lindex(k, 1)).to.equal(v2);
            expect(redismock.lindex(k, 2)).to.equal(v3);
            expect(redismock.lindex(k, -1)).to.equal(v3);
            expect(redismock.lindex(k, -2)).to.equal(v2);
            expect(redismock.lindex(k, -3)).to.equal(v1);
            redismock.lindex(k, 1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v2);
                done();
            });
        });
    });

    describe('linsert', function () {
        it('should return 0 for a key that does not exist', function (done) {
            expect(redismock.linsert(randkey(), 'before', 'x', 'y')).to.equal(0);
            redismock.linsert(randkey(), 'after', 'x', 'y', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return -1 for a pivot that does not exist in the list', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v);
            expect(redismock.linsert(k, 'before', 'x', 'y')).to.equal(-1);
            redismock.linsert(k, 'after', 'x', 'y', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(-1);
                done();
            });
        });
        it('should return an error for a key that is not a list', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.linsert(k, 'before', 'x', 'y')).to.be.an.instanceof(Error);
            redismock.linsert(k, 'after', 'x', 'y', function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should insert the value before the pivot', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4';
            redismock.rpush(k, v2);
            redismock.rpush(k, v4);
            expect(redismock.linsert(k, 'before', v4, v3)).to.equal(3);
            expect(redismock.lindex(k, 1)).to.equal(v3);
            redismock.linsert(k, 'before', v2, v1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(4);
                expect(redismock.lindex(k, 0)).to.equal(v1);
                done();
            });
        });
        it('should insert the value after the pivot', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4';
            redismock.rpush(k, v1);
            redismock.rpush(k, v3);
            expect(redismock.linsert(k, 'after', v3, v4)).to.equal(3);
            expect(redismock.lindex(k, 2)).to.equal(v4);
            redismock.linsert(k, 'after', v1, v2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(4);
                expect(redismock.lindex(k, 1)).to.equal(v2);
                done();
            });
        });
    });

    describe('llen', function () {
        it('should return 0 for a key that does not exist', function (done) {
            expect(redismock.llen(randkey())).to.equal(0);
            redismock.llen(randkey(), function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return an error for a key that is not a list', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.llen(k)).to.be.an.instanceof(Error);
            redismock.llen(k, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return the length of a list', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            expect(redismock.llen(k)).to.equal(0);
            redismock.rpush(k, v1);
            expect(redismock.llen(k)).to.equal(1);
            redismock.rpush(k, v2);
            expect(redismock.llen(k)).to.equal(2);
            redismock.rpush(k, v3);
            expect(redismock.llen(k)).to.equal(3);
            redismock.llen(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(3);
                done();
            });
        });
    });

    describe('lpop', function () {
        it('should return nothing for a key that does not exist', function (done) {
            expect(redismock.lpop(randkey())).to.not.exist;
            redismock.lpop(randkey(), function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('should return an error for a key that is not a list', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.lpop(k)).to.be.an.instanceof(Error);
            redismock.lpop(k, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return the left element of the list', function (done) {
            var k = randkey();
            var v1 = 'value', v2 = 'value', v3 = 'value';
            redismock.rpush(k, v1);
            redismock.rpush(k, v2);
            redismock.rpush(k, v3);
            expect(redismock.lpop(k)).to.equal(v1);
            expect(redismock.lpop(k)).to.equal(v2);
            redismock.lpop(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v3);
                done();
            });
        });
    });

    describe('lpush', function () {
        it('should return an error for a key that is not a list', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.lpush(k, v)).to.be.an.instanceof(Error);
            redismock.lpush(k, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should push into the left of a list', function (done) {
            var k = randkey();
            var v1 = 'value', v2 = 'v2', v3 = 'v3';
            expect(redismock.lpush(k, v1, v2)).to.equal(2);
            expect(redismock.llen(k)).to.equal(2);
            expect(redismock.lindex(k, 0)).to.equal(v2);
            expect(redismock.lindex(k, 1)).to.equal(v1);
            redismock.lpush(k, v3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(3);
                expect(redismock.llen(k)).to.equal(3);
                expect(redismock.lindex(k, 0)).to.equal(v3);
                done();
            });
        });
    });

    describe('lpushx', function () {
        it('should return an error for a key that is not a list', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.lpushx(k, v)).to.be.an.instanceof(Error);
            redismock.lpushx(k, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should do nothing if the key does not exist', function (done) {
            var k = randkey();
            var v = 'value';
            expect(redismock.lpushx(k, v)).to.equal(0);
            expect(redismock.llen(k)).to.equal(0);
            redismock.lpushx(k, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                expect(redismock.llen(k)).to.equal(0);
                done();
            });
        });
        it('should push into the left of a list if the list exists', function (done) {
            var k = randkey();
            var v1 = 'value', v2 = 'v2', v3 = 'v3';
            expect(redismock.lpush(k, v1)).to.equal(1);
            expect(redismock.llen(k)).to.equal(1);
            expect(redismock.lindex(k, 0)).to.equal(v1);
            expect(redismock.lpushx(k, v2)).to.equal(2);
            expect(redismock.llen(k)).to.equal(2);
            expect(redismock.lindex(k, 0)).to.equal(v2);
            redismock.lpushx(k, v3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(3);
                expect(redismock.llen(k)).to.equal(3);
                expect(redismock.lindex(k, 0)).to.equal(v3);
                done();
            });
        });
    });

    describe('lrange', function () {
        it('should return an error for a key that is not a list', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.lrange(k, 0, -1)).to.be.an.instanceof(Error);
            redismock.lrange(k, 0, -1, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return nothing for out-of-range indices', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v);
            expect(redismock.lrange(k, 1, 0).length).to.equal(0);
            expect(redismock.lrange(k, 1, 2).length).to.equal(0);
            expect(redismock.lrange(k, -3, -2).length).to.equal(0);
            redismock.lrange(k, -2, -3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply.length).to.equal(0);
                done();
            });
        });
        it('should return the range for in-range indices', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            redismock.rpush(k, v1, v2, v3);
            var l = redismock.lrange(k, 0, -1);
            expect(l).to.have.lengthOf(3);
            expect(l[0]).to.equal(v1);
            expect(l[1]).to.equal(v2);
            expect(l[2]).to.equal(v3);
            l = redismock.lrange(k, 1, 2);
            expect(l).to.have.lengthOf(2);
            expect(l[0]).to.equal(v2);
            expect(l[1]).to.equal(v3);
            redismock.lrange(k, -3, -2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(2);
                expect(reply[0]).to.equal(v1);
                expect(reply[1]).to.equal(v2);
                done();
            });
        });
    });

    describe('lrem', function () {
        it('should return an error for a key that is not a list', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.lrem(k, 1, v)).to.be.an.instanceof(Error);
            redismock.lrem(k, 1, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return 0 for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'value';
            expect(redismock.lrem(k, 1, v)).to.equal(0);
            redismock.lrem(k, 1, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return 0 for a list without the element in it', function (done) {
            var k = randkey();
            var v = 'value', nv = 'nvalue';
            redismock.lpush(k, v);
            expect(redismock.lrem(k, 1, nv)).to.equal(0);
            redismock.lrem(k, 1, nv, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should remove and return the removed count for a list with the elements in it', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v, v, v, v, v);
            expect(redismock.llen(k)).to.equal(5);
            expect(redismock.lrem(k, 1, v)).to.equal(1);
            expect(redismock.llen(k)).to.equal(4);
            expect(redismock.lrem(k, 2, v)).to.equal(2);
            expect(redismock.llen(k)).to.equal(2);
            redismock.lrem(k, 0, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(2);
                expect(redismock.llen(k)).to.equal(0);
                redismock.lpush(k, v);
                expect(redismock.lrem(k, 3, v)).to.equal(1);
                expect(redismock.llen(k)).to.equal(0);
                done();
            });
        });
    });

    describe('lset', function () {
        it('should return an error for a key that is not a list', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.lset(k, 0, v)).to.be.an.instanceof(Error);
            redismock.lset(k, 0, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return an error for an out of range index', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.rpush(k, v);
            expect(redismock.lset(k, 1, v)).to.be.an.instanceof(Error);
            redismock.lset(k, 1, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('ERR')).to.be.above(-1);
                done();
            });
        });
        it('should return an error for a non-existent key', function (done) {
            expect(redismock.lset(randkey(), 0, 'v')).to.be.an.instanceof(Error);
            redismock.lset(randkey(), 5, 'v', function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('ERR')).to.be.above(-1);
                done();
            });
        });
        it('should set the element at index for an in-range index', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', nv = 'nv', xv = 'xv';
            redismock.rpush(k, v1, v2, v3);
            expect(redismock.lset(k, 1, nv)).to.equal('OK');
            expect(redismock.lindex(k, 1)).to.equal(nv);
            redismock.lset(k, 2, xv, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                expect(redismock.lindex(k, 2)).to.equal(xv);
                done();
            });
        });
    });

    describe('ltrim', function () {
        it('should return an error for a key that is not a list', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.ltrim(k, 0, 1)).to.be.an.instanceof(Error);
            redismock.lset(k, 0, 1, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should do nothing for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'value';
            expect(redismock.ltrim(k, 0, 1)).to.equal('OK');
            expect(redismock.llen(k)).to.equal(0);
            expect(redismock.get(k)).to.not.exist;
            redismock.ltrim(k, 0, 1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                expect(redismock.llen(k)).to.equal(0);
                expect(redismock.get(k)).to.not.exist;
                done();
            });
        });
        it('should remove the list if start > end', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v);
            expect(redismock.llen(k)).to.equal(1);
            expect(redismock.ltrim(k, 1, 0)).to.equal('OK');
            expect(redismock.llen(k)).to.equal(0);
            redismock.rpush(k, v);
            redismock.ltrim(k, -4, -5, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                expect(redismock.llen(k)).to.equal(0);
                expect(redismock.get(k)).to.not.exist;
                done();
            });
        });
        it('should remove the list if start is greater than the end of the list', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v, v);
            expect(redismock.llen(k)).to.equal(2);
            expect(redismock.ltrim(k, 3, 4)).to.equal('OK');
            expect(redismock.llen(k)).to.equal(0);
            redismock.lpush(k, v, v);
            expect(redismock.llen(k)).to.equal(2);
            redismock.ltrim(k, -4, -3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                expect(redismock.llen(k)).to.equal(0);
                expect(redismock.get(k)).to.not.exist;
                done();
            });
        });
        it('should trim the list with in-range indices', function (done) {
            var k = randkey();
            var v = 'v', v1 = 'v1';
            redismock.rpush(k, v, v1, v1, v1, v);
            expect(redismock.llen(k)).to.equal(5);
            expect(redismock.ltrim(k, 1, 3)).to.equal('OK');
            expect(redismock.llen(k)).to.equal(3);
            expect(redismock.lindex(k, 0)).to.equal(v1);
            expect(redismock.ltrim(k, 1, 0)).to.equal('OK');
            expect(redismock.llen(k)).to.equal(0);
            redismock.rpush(k, v, v1, v1, v1, v);
            redismock.ltrim(k, -4, -2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                expect(redismock.llen(k)).to.equal(3);
                expect(redismock.lindex(k, 0)).to.equal(v1);
                done();
            });
        });
        it('should be okay if end > the list size', function (done) {
            var k = randkey();
            var v = 'v', v1 = 'v1';
            redismock.rpush(k, v1, v1, v1, v);
            expect(redismock.llen(k)).to.equal(4);
            expect(redismock.ltrim(k, 0, 5)).to.equal('OK');
            expect(redismock.llen(k)).to.equal(4);
            redismock.ltrim(k, 2, 80, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                expect(redismock.llen(k)).to.equal(2);
                expect(redismock.lindex(k, 0)).to.equal(v1);
                expect(redismock.lindex(k, 1)).to.equal(v);
                done();
            });
        });
    });

    describe('rpop', function () {
        it('should return an error for a key that is not a list', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.rpop(k)).to.be.an.instanceof(Error);
            redismock.rpop(k, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return nothing for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'value';
            expect(redismock.rpop(k)).to.not.exist;
            redismock.rpop(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('should return the right element for a list', function (done) {
            var k = randkey();
            var v = 'value', v1 = 'v1';
            redismock.rpush(k, v, v1);
            expect(redismock.rpop(k)).to.equal(v1);
            redismock.rpop(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v);
                done();
            });
        });
    });

    describe('rpoplpush', function () {
        it('should return an error for a source key that is not a list', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.rpoplpush(k, randkey())).to.be.an.instanceof(Error);
            redismock.rpoplpush(k, randkey(), function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return an error for a destination key that is not a list', function (done) {
            var k1 = randkey(), k2 = randkey();
            var v = 'value';
            redismock.lpush(k1, v);
            redismock.set(k2, v);
            expect(redismock.rpoplpush(k1, k2)).to.be.an.instanceof(Error);
            redismock.lpush(k1, v);
            redismock.rpoplpush(k1, k2, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should do nothing for an empty list', function (done) {
            var k1 = randkey(), k2 = randkey();
            var v = 'value';
            redismock.lpush(k2, v);
            expect(redismock.rpoplpush(k1, k2)).to.not.exist;
            redismock.rpoplpush(k1, k2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('should pop from the right and push to the left between source and destination', function (done) {
            var k1 = randkey(), k2 = randkey();
            var v = 'v', nv = 'nv';
            redismock.rpush(k1, v, nv);
            redismock.lpush(k2, v, nv);
            expect(redismock.rpoplpush(k1, k2)).to.equal(nv);
            expect(redismock.llen(k2)).to.equal(3);
            expect(redismock.lindex(k2, 0)).to.equal(nv);
            expect(redismock.llen(k1)).to.equal(1);
            expect(redismock.lindex(k1, 0)).to.equal(v);
            redismock.rpoplpush(k1, k2, function (err, reply) {
                expect(redismock.llen(k2)).to.equal(4);
                expect(redismock.lindex(k2, 0)).to.equal(v);
                expect(redismock.llen(k1)).to.equal(0);
                done();
            });
        });
    });

    describe('rpush', function () {
        it('should return an error for a key that is not a list', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.rpush(k, v)).to.be.an.instanceof(Error);
            redismock.rpush(k, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should push into the right of a list', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            redismock.rpush(k, v1, v2);
            expect(redismock.llen(k)).to.equal(2);
            expect(redismock.lindex(k, 0)).to.equal(v1);
            redismock.rpush(k, v3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(3);
                expect(redismock.llen(k)).to.equal(3);
                expect(redismock.lindex(k, 0)).to.equal(v1);
                expect(redismock.lindex(k, -1)).to.equal(v3);
                done();
            });
        });
    });

    describe('rpushx', function () {
        it('should return an error for a key that is not a list', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.rpushx(k, v)).to.be.an.instanceof(Error);
            redismock.rpushx(k, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should do nothing if the key does not exist', function (done) {
            var k = randkey();
            var v = 'value';
            expect(redismock.rpushx(k, v)).to.equal(0);
            expect(redismock.llen(k)).to.equal(0);
            redismock.rpushx(k, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                expect(redismock.llen(k)).to.equal(0);
                done();
            });
        });
        it('should push into the right of a list if the list exists', function (done) {
            var k = randkey();
            var v1 = 'value', v2 = 'v2', v3 = 'v3';
            expect(redismock.lpush(k, v1)).to.equal(1);
            expect(redismock.llen(k)).to.equal(1);
            expect(redismock.lindex(k, -1)).to.equal(v1);
            expect(redismock.rpushx(k, v2)).to.equal(2);
            expect(redismock.llen(k)).to.equal(2);
            expect(redismock.lindex(k, -1)).to.equal(v2);
            redismock.rpushx(k, v3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(3);
                expect(redismock.llen(k)).to.equal(3);
                expect(redismock.lindex(k, -1)).to.equal(v3);
                done();
            });
        });
    });
}).call(this);
