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

    describe('sadd', function () {
        it('should return an error for a key that is not a set', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.sadd(k, v)).to.be.an.instanceof(Error);
            redismock.sadd(k, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should add a new set member', function (done) {
            var k = randkey();
            var v = 'v', v1 = 'v1', v2 = 'v2';
            expect(redismock.sadd(k, v)).to.equal(1);
            expect(redismock.type(k)).to.equal('set');
            expect(redismock.sadd(k, v)).to.equal(0);
            redismock.sadd(k, v1, v2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(2);
                done();
            });
        });
    });

    describe('scard', function () {
        it('should return an error for a key that is not a set', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.scard(k)).to.be.an.instanceof(Error);
            redismock.scard(k, function (err, reply) {
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
            expect(redismock.scard(k, v)).to.equal(0);
            redismock.scard(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('to return the set cardinality', function (done) {
            var k = randkey();
            var v = 'v', v1 = 'v1';
            redismock.sadd(k, v);
            expect(redismock.scard(k, v)).to.equal(1);
            redismock.sadd(k, v1);
            redismock.scard(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(2);
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
        it('to return an error for a key that is not a set', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.sismember(k, v)).to.be.an.instanceof(Error);
            redismock.sismember(k, v, function (err, reply) {
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
            expect(redismock.sismember(k, v)).to.equal(0);
            redismock.sismember(k, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('to return 0 for a member not in the set', function (done) {
            var k = randkey();
            var v = 'v', v1 = 'v1';
            redismock.sadd(k, v);
            expect(redismock.sismember(k, v1)).to.equal(0);
            redismock.sismember(k, v1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('to return 1 for a member in the set', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.sadd(k, v);
            expect(redismock.sismember(k, v)).to.equal(1);
            redismock.sismember(k, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                done();
            });
        });
    });

    describe('smembers', function () {
        it('should return an error for a key that is not a set', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.smembers(k)).to.be.an.instanceof(Error);
            redismock.smembers(k, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('to return an empty array for a key that does not exist', function (done) {
            var k = randkey();
            expect(redismock.smembers(k)).to.have.lengthOf(0);
            redismock.smembers(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(0);
                done();
            });
        });
        it('to return the set members', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            redismock.sadd(k, v1, v2, v3);
            expect(redismock.smembers(k)).to.have.lengthOf(3);
            redismock.smembers(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(3);
                expect(reply.indexOf(v1)).to.be.above(-1);
                expect(reply.indexOf(v2)).to.be.above(-1);
                expect(reply.indexOf(v3)).to.be.above(-1);
                done();
            });
        });
    });

    describe('smove', function () {
        it('should return an error for a source key that is not a set', function (done) {
            var k1 = randkey(), k2 = randkey();
            var v = 'v';
            redismock.set(k1, v);
            expect(redismock.smove(k1, k2, v)).to.be.an.instanceof(Error);
            redismock.smove(k1, k2, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('to return an error for a destination key that is not a set', function (done) {
            var k1 = randkey(), k2 = randkey();
            var v = 'v';
            redismock.sadd(k1, v);
            redismock.set(k2, v);
            expect(redismock.smove(k1, k2, v)).to.be.an.instanceof(Error);
            redismock.smove(k1, k2, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('to do nothing if the element is not in the source set', function (done) {
            var k1 = randkey(), k2 = randkey();
            var v = 'v';
            expect(redismock.smove(k1, k2, v)).to.equal(0);
            redismock.smove(k1, k2, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('to move the element from the source to the destination', function (done) {
            var k1 = randkey(), k2 = randkey();
            var v = 'v', v1 = 'v1';
            redismock.sadd(k1, v);
            expect(redismock.smove(k1, k2, v)).to.equal(1);
            expect(redismock.scard(k1)).to.equal(0);
            expect(redismock.scard(k2)).to.equal(1);
            expect(redismock.sismember(k1, v)).to.equal(0);
            expect(redismock.sismember(k2, v)).to.equal(1);
            redismock.sadd(k2, v1);
            redismock.smove(k2, k1, v1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.scard(k1)).to.equal(1);
                expect(redismock.scard(k2)).to.equal(1);
                expect(redismock.sismember(k2, v1)).to.equal(0);
                expect(redismock.sismember(k1, v1)).to.equal(1);
                done();
            });
        });
    });

    describe('spop', function () {
        it('should return an error for a key that is not a set', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.spop(k)).to.be.an.instanceof(Error);
            redismock.spop(k, function (err, reply) {
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
            expect(redismock.spop(k)).to.not.exist;
            redismock.spop(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('to remove a random member from the set and return it', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            var arr = [v1, v2, v3];
            redismock.sadd(k, v1, v2, v3);
            expect(arr.indexOf(redismock.spop(k))).to.be.above(-1);
            expect(redismock.scard(k)).to.equal(2);
            expect(arr.indexOf(redismock.spop(k))).to.be.above(-1);
            expect(redismock.scard(k)).to.equal(1);
            redismock.spop(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(arr.indexOf(reply)).to.be.above(-1);
                expect(redismock.scard(k)).to.equal(0);
                done();
            });
        });
    });

    describe('srandmember', function () {
        it('should return an error for a key that is not a set', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.srandmember(k, 2)).to.be.an.instanceof(Error);
            redismock.srandmember(k, function (err, reply) {
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
            expect(redismock.srandmember(k)).to.not.exist;
            redismock.srandmember(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('to return a random member from the set', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            var arr = [v1, v2, v3];
            redismock.sadd(k, v1, v2, v3);
            expect(arr.indexOf(redismock.srandmember(k))).to.be.above(-1);
            redismock.srandmember(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(arr.indexOf(reply)).to.be.above(-1);
                done();
            });
        });
        it('to return count random members from the set', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            var arr = [v1, v2, v3];
            redismock.sadd(k, v1, v2, v3);
            var ms = redismock.srandmember(k, 2);
            expect(ms).to.have.lengthOf(2);
            ms.forEach(function (m) {
                expect(arr.indexOf(m)).to.be.above(-1);
            });
            redismock.srandmember(k, 3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(3);
                reply.forEach(function (r) {
                    expect(arr.indexOf(r)).to.be.above(-1);
                });
                done();
            });
        });
    });

    describe('srem', function () {
        it('should return an error for a key that is not a set', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.srem(k, v)).to.be.an.instanceof(Error);
            redismock.srem(k, v, function (err, reply) {
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
            expect(redismock.srem(k, v)).to.equal(0);
            redismock.srem(k, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('to return 0 for an member not in the set', function (done) {
            var k = randkey();
            var v = 'v', v1 = 'v1';
            redismock.sadd(k, v);
            expect(redismock.srem(k, v1)).to.equal(0);
            redismock.srem(k, v1, function (err, reply) {
                expect(err).to.not.exist
                expect(reply).to.equal(0);
                done();
            });
        });
        it('to return 1 and remove the member from the set', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.sadd(k, v);
            expect(redismock.srem(k, v)).to.equal(1);
            expect(redismock.scard(k)).to.equal(0);
            redismock.sadd(k, v);
            redismock.srem(k, v, function (err, reply) {
                expect(err).to.not.exist
                expect(reply).to.equal(1);
                expect(redismock.scard(k)).to.equal(0);
                done();
            });
        });
        it('to return count and remove count members from the set', function (done) {
            var k = randkey();
            var v = 'v', v1 = 'v1', v2 = 'v2', v3 = 'v3';
            redismock.sadd(k, v, v1, v3);
            expect(redismock.srem(k, v1, v)).to.equal(2);
            expect(redismock.scard(k)).to.equal(1);
            redismock.srem(k, v3, v2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.scard(k)).to.equal(0);
                done();
            });
        });
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
}).call(this);