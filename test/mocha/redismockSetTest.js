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
        it('should return an error for a key that is not a set', function (done) {
            var k = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.sdiff(k)).to.be.an.instanceof(Error);
            redismock.sadd(k1, v);
            redismock.set(k2, v);
            redismock.sadd(k3, v);
            redismock.sdiff(k1, k2, k3, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should diff 2 sets', function (done) {
            var k1 = randkey(), k2 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5';
            redismock.sadd(k1, v1, v3, v5);
            redismock.sadd(k2, v1, v2, v4);
            var diff = redismock.sdiff(k1, k2);
            expect(diff).to.have.lengthOf(2);
            expect(diff[0]).to.equal(v3);
            expect(diff[1]).to.equal(v5);
            redismock.sadd(k2, v5);
            redismock.sdiff(k1, k2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(1);
                expect(reply[0]).to.equal(v3);
                done();
            });
        });
        it('should diff N sets', function (done) {
            var k1 = randkey(), k2 = randkey(), k3 = randkey();
            redismock.sadd(k1, 'a', 'b', 'c', 'd');
            redismock.sadd(k2, 'c');
            redismock.sadd(k3, 'a', 'c', 'e');
            var diff = redismock.sdiff(k1, k2, k3);
            expect(diff).to.have.lengthOf(2);
            expect(diff[0]).to.equal('b');
            expect(diff[1]).to.equal('d');
            redismock.sdiff(k1, k2, k3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(2);
                expect(reply[0]).to.equal('b');
                expect(reply[1]).to.equal('d');
                done();
            });
        });
    });

    describe('sdiffstore', function () {
        it('should return an error for a key that is not a set', function (done) {
            var d = randkey(), k = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.sdiffstore(d, k, k1)).to.be.an.instanceof(Error);
            redismock.sadd(k1, v);
            redismock.set(k2, v);
            redismock.sadd(k3, v);
            redismock.sdiffstore(d, k1, k2, k3, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should diff 2 sets and store it', function (done) {
            var d = randkey(), k1 = randkey(), k2 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5';
            redismock.sadd(k1, v1, v3, v5);
            redismock.sadd(k2, v1, v2, v4);
            expect(redismock.sdiffstore(d, k1, k2)).to.equal(2);
            var members = redismock.smembers(d);
            expect(members).to.have.lengthOf(2);
            expect(members.indexOf(v3)).to.be.above(-1);
            expect(members.indexOf(v5)).to.be.above(-1);
            redismock.sadd(k2, v5);
            redismock.sdiffstore(d, k1, k2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                members = redismock.smembers(d);
                expect(members).to.have.lengthOf(1);
                expect(members[0]).to.equal(v3);
                done();
            });
        });
        it('should diff N sets and store it', function (done) {
            var d = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey();
            redismock.sadd(k1, 'a', 'b', 'c', 'd');
            redismock.sadd(k2, 'c');
            redismock.sadd(k3, 'a', 'c', 'e');
            expect(redismock.sdiffstore(d, k1, k2, k3)).to.equal(2);
            var diff = redismock.smembers(d);
            expect(diff).to.have.lengthOf(2);
            expect(diff[0]).to.equal('b');
            expect(diff[1]).to.equal('d');
            redismock.sdiffstore(d, k1, k2, k3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(2);
                diff = redismock.smembers(d);
                expect(diff).to.have.lengthOf(2);
                expect(diff[0]).to.equal('b');
                expect(diff[1]).to.equal('d');
                done();
            });
        });
    });

    describe('sinter', function () {
        it('should return an error for a key that is not a set', function (done) {
            var k = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.sinter(k)).to.be.an.instanceof(Error);
            redismock.sadd(k1, v);
            redismock.set(k2, v);
            redismock.sadd(k3, v);
            redismock.sinter(k1, k2, k3, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should inter 2 sets', function (done) {
            var k1 = randkey(), k2 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5';
            redismock.sadd(k1, v1, v3, v5);
            redismock.sadd(k2, v1, v2, v4);
            var inter = redismock.sinter(k1, k2);
            expect(inter).to.have.lengthOf(1);
            expect(inter[0]).to.equal(v1);
            redismock.sadd(k2, v5);
            redismock.sinter(k1, k2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(2);
                expect(reply.indexOf(v1)).to.be.above(-1);
                expect(reply.indexOf(v5)).to.be.above(-1);
                done();
            });
        });
        it('should inter N sets', function (done) {
            var k1 = randkey(), k2 = randkey(), k3 = randkey();
            redismock.sadd(k1, 'a', 'b', 'c', 'd');
            redismock.sadd(k2, 'c');
            redismock.sadd(k3, 'a', 'c', 'e');
            var inter = redismock.sinter(k1, k2, k3);
            expect(inter).to.have.lengthOf(1);
            expect(inter[0]).to.equal('c');
            redismock.sinter(k1, k2, k3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(1);
                expect(reply[0]).to.equal('c');
                done();
            });
        });
    });

    describe('sinterstore', function () {
        it('should return an error for a key that is not a set', function (done) {
            var d = randkey(), k = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.sinterstore(d, k)).to.be.an.instanceof(Error);
            redismock.sadd(k1, v);
            redismock.set(k2, v);
            redismock.sadd(k3, v);
            redismock.sinterstore(d, k1, k2, k3, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should inter 2 sets and store it', function (done) {
            var d = randkey(), k1 = randkey(), k2 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5';
            redismock.sadd(k1, v1, v3, v5);
            redismock.sadd(k2, v1, v2, v4);
            expect(redismock.sinterstore(d, k1, k2)).to.equal(1);
            var inter = redismock.smembers(d);
            expect(inter).to.have.lengthOf(1);
            expect(inter[0]).to.equal(v1);
            redismock.sadd(k2, v5);
            redismock.sinterstore(d, k1, k2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(2);
                reply = redismock.smembers(d);
                expect(reply.indexOf(v1)).to.be.above(-1);
                expect(reply.indexOf(v5)).to.be.above(-1);
                done();
            });
        });
        it('should inter N sets and store it', function (done) {
            var d = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey();
            redismock.sadd(k1, 'a', 'b', 'c', 'd');
            redismock.sadd(k2, 'c');
            redismock.sadd(k3, 'a', 'c', 'e');
            expect(redismock.sinterstore(d, k1, k2, k3)).to.equal(1);
            var inter = redismock.smembers(d);
            expect(inter).to.have.lengthOf(1);
            expect(inter[0]).to.equal('c');
            redismock.sinterstore(d, k1, k2, k3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                reply = redismock.smembers(d);
                expect(reply[0]).to.equal('c');
                done();
            });
        });
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
        it('should return an error for a destination key that is not a set', function (done) {
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
        it('should do nothing if the element is not in the source set', function (done) {
            var k1 = randkey(), k2 = randkey();
            var v1 = 'v1', v2 = 'v2';
            redismock.sadd(k1, v1);
            redismock.sadd(k2, v2);
            expect(redismock.smove(k1, k2, v2)).to.equal(0);
            expect(redismock.scard(k1)).to.equal(1);
            expect(redismock.sismember(k1, v1)).to.equal(1);
            expect(redismock.scard(k2)).to.equal(1);
            expect(redismock.sismember(k2, v2)).to.equal(1);
            expect(redismock.sismember(k2, v1)).to.equal(0);
            redismock.smove(k2, k1, v1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                expect(redismock.scard(k1)).to.equal(1);
                expect(redismock.sismember(k1, v1)).to.equal(1);
                expect(redismock.scard(k2)).to.equal(1);
                expect(redismock.sismember(k2, v2)).to.equal(1);
                expect(redismock.sismember(k2, v1)).to.equal(0);
                done();
            });
        });
        it('should move the element from the source to the destination', function (done) {
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
        it('should return nothing for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.srandmember(k)).to.not.exist;
            redismock.srandmember(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('should return a random member from the set', function (done) {
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
        it('should return count random members from the set', function (done) {
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
                ms = redismock.srandmember(k, 4);
                expect(ms).to.have.lengthOf(3);
                ms = redismock.srandmember(k, -4);
                expect(ms).to.have.lengthOf(4);
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
        it('should return an error for a key that is not a set', function (done) {
            var k = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.sunion(k)).to.be.an.instanceof(Error);
            redismock.sadd(k1, v);
            redismock.set(k2, v);
            redismock.sadd(k3, v);
            redismock.sunion(k1, k2, k3, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should union 2 sets', function (done) {
            var k1 = randkey(), k2 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5';
            redismock.sadd(k1, v1, v3, v5);
            redismock.sadd(k2, v1, v2, v4);
            var union = redismock.sunion(k1, k2);
            expect(union).to.have.lengthOf(5);
            expect(union.indexOf(v1)).to.be.above(-1);
            expect(union.indexOf(v2)).to.be.above(-1);
            expect(union.indexOf(v3)).to.be.above(-1);
            expect(union.indexOf(v4)).to.be.above(-1);
            expect(union.indexOf(v5)).to.be.above(-1);
            redismock.sadd(k2, v5);
            redismock.sunion(k1, k2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(5);
                expect(reply.indexOf(v1)).to.be.above(-1);
                expect(reply.indexOf(v2)).to.be.above(-1);
                expect(reply.indexOf(v3)).to.be.above(-1);
                expect(reply.indexOf(v4)).to.be.above(-1);
                expect(reply.indexOf(v5)).to.be.above(-1);
                done();
            });
        });
        it('should union N sets', function (done) {
            var k1 = randkey(), k2 = randkey(), k3 = randkey();
            redismock.sadd(k1, 'a', 'b', 'c', 'd');
            redismock.sadd(k2, 'c');
            redismock.sadd(k3, 'a', 'c', 'e');
            var union = redismock.sunion(k1, k2, k3);
            expect(union).to.have.lengthOf(5);
            expect(union.indexOf('a')).to.be.above(-1);
            expect(union.indexOf('b')).to.be.above(-1);
            expect(union.indexOf('c')).to.be.above(-1);
            expect(union.indexOf('d')).to.be.above(-1);
            expect(union.indexOf('e')).to.be.above(-1);
            redismock.sunion(k1, k2, k3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(5);
                expect(reply.indexOf('a')).to.be.above(-1);
                expect(reply.indexOf('b')).to.be.above(-1);
                expect(reply.indexOf('c')).to.be.above(-1);
                expect(reply.indexOf('d')).to.be.above(-1);
                expect(reply.indexOf('e')).to.be.above(-1);
                done();
            });
        });
    });

    describe('sunionstore', function () {
        it('should return an error for a key that is not a set', function (done) {
            var d = randkey(), k = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.sunionstore(d, k)).to.be.an.instanceof(Error);
            redismock.sadd(k1, v);
            redismock.set(k2, v);
            redismock.sadd(k3, v);
            redismock.sunionstore(d, k1, k2, k3, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should union 2 sets and store it', function (done) {
            var d = randkey(), k1 = randkey(), k2 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5';
            redismock.sadd(k1, v1, v3, v5);
            redismock.sadd(k2, v1, v2, v4);
            expect(redismock.sunionstore(d, k1, k2)).to.equal(5);
            var union = redismock.smembers(d);
            expect(union).to.have.lengthOf(5);
            expect(union.indexOf(v1)).to.be.above(-1);
            expect(union.indexOf(v2)).to.be.above(-1);
            expect(union.indexOf(v3)).to.be.above(-1);
            expect(union.indexOf(v4)).to.be.above(-1);
            expect(union.indexOf(v5)).to.be.above(-1);
            redismock.sadd(k2, v5);
            redismock.sunionstore(d, k1, k2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(5);
                reply = redismock.smembers(d);
                expect(reply).to.have.lengthOf(5);
                expect(reply.indexOf(v1)).to.be.above(-1);
                expect(reply.indexOf(v2)).to.be.above(-1);
                expect(reply.indexOf(v3)).to.be.above(-1);
                expect(reply.indexOf(v4)).to.be.above(-1);
                expect(reply.indexOf(v5)).to.be.above(-1);
                done();
            });
        });
        it('should union N sets and store it', function (done) {
            var d = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey();
            redismock.sadd(k1, 'a', 'b', 'c', 'd');
            redismock.sadd(k2, 'c');
            redismock.sadd(k3, 'a', 'c', 'e');
            expect(redismock.sunionstore(d, k1, k2, k3)).to.equal(5);
            var union = redismock.smembers(d);
            expect(union).to.have.lengthOf(5);
            expect(union.indexOf('a')).to.be.above(-1);
            expect(union.indexOf('b')).to.be.above(-1);
            expect(union.indexOf('c')).to.be.above(-1);
            expect(union.indexOf('d')).to.be.above(-1);
            expect(union.indexOf('e')).to.be.above(-1);
            redismock.sunionstore(d, k1, k2, k3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(5);
                reply = redismock.smembers(d);
                expect(reply).to.have.lengthOf(5);
                expect(reply.indexOf('a')).to.be.above(-1);
                expect(reply.indexOf('b')).to.be.above(-1);
                expect(reply.indexOf('c')).to.be.above(-1);
                expect(reply.indexOf('d')).to.be.above(-1);
                expect(reply.indexOf('e')).to.be.above(-1);
                done();
            });
        });
    });

    describe('sscan', function () {
        it('should return an error for a key that is not a set', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.sscan(k, 0)).to.be.an.instanceof(Error);
            redismock.sscan(k, 0, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should sscan through a small set and return every element', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4';
            redismock.sadd(k, v1, v2, v3);
            var scan = redismock.sscan(k, 0);
            expect(scan).to.have.lengthOf(2);
            expect(scan[0]).to.equal(3);
            expect(scan[1][0]).to.equal(v1);
            expect(scan[1][1]).to.equal(v2);
            expect(scan[1][2]).to.equal(v3);
            redismock.sadd(k, v4);
            redismock.sscan(k, 0, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(2);
                expect(reply[0]).to.equal(4);
                expect(reply[1][0]).to.equal(v1);
                expect(reply[1][1]).to.equal(v2);
                expect(reply[1][2]).to.equal(v3);
                expect(reply[1][3]).to.equal(v4);
                done();
            });
        });
        it('should sscan through a large set with cursoring', function (done) {
            var k = randkey();
            var set = [];
            for (var idx = 0; idx < 62; idx += 1) {
                set.push(idx.toString());
            }
            redismock.sadd.apply(redismock, [k].concat(set));
            var scan, cursor = 0, scanned = [];
            while (true) {
                scan = redismock.sscan(k, cursor);
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
            scan = redismock.sscan(k, cursor);
            expect(scan[1]).to.have.lengthOf(0);
            scanned = [];
            var f;
            f = function (cursor, callback) {
                redismock.sscan(k, cursor, function (err, reply) {
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
        it('should sscan through a large set with cursoring and a count', function (done) {
            var k = randkey();
            var set = [];
            for (var idx = 0; idx < 62; idx += 1) {
                set.push(idx.toString());
            }
            redismock.sadd.apply(redismock, [k].concat(set));
            var scan, cursor = 0, scanned = [], count = 5;
            while (true) {
                scan = redismock.sscan(k, cursor, 'count', count);
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
            scan = redismock.sscan(k, cursor, 'count', count);
            expect(scan[1]).to.have.lengthOf(0);
            scanned = [];
            var f;
            f = function (cursor, count, callback) {
                redismock.sscan(k, cursor, 'count', count, function (err, reply) {
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
        it('should sscan through a large set with cursoring and a match', function (done) {
            var k = randkey();
            var set = [];
            for (var idx = 0; idx < 62; idx += 1) {
                set.push(idx.toString());
            }
            redismock.sadd.apply(redismock, [k].concat(set));
            var scan, cursor = 0, scanned = [], match = '[0-9]'; // All single digit #s
            while (true) {
                scan = redismock.sscan(k, cursor, 'match', match);
                if (scan instanceof Error) {
                    return done(scan);
                }
                if (!scan[1] || !scan[1].length) {
                    break;
                }
                scanned = scanned.concat(scan[1]);
                cursor = scan[0];
            }
            expect(scanned).to.have.lengthOf(10);
            expect(scanned.every(function (i) {
                return i.toString().length === 1 && set.indexOf(i) !== -1;
            })).to.be.true;
            scan = redismock.sscan(k, cursor, 'match', match);
            expect(scan[1]).to.have.lengthOf(0);
            scanned = [];
            var f;
            f = function (cursor, match, callback) {
                redismock.sscan(k, cursor, 'match', match, function (err, reply) {
                    if (err) {
                        return callback(err);
                    }
                    if (!reply[1] || !reply[1].length) {
                        expect(scanned).to.have.lengthOf(52);
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
        it('should sscan through a large set with cursoring, a count, and a match', function (done) {
            var k = randkey();
            var set = [];
            for (var idx = 0; idx < 62; idx += 1) {
                set.push(idx.toString());
            }
            redismock.sadd.apply(redismock, [k].concat(set));
            var scan, cursor = 0, scanned = [], count = 4, match = '[0-9]'; // All single digit #s
            while (true) {
                scan = redismock.sscan(k, cursor, 'count', count, 'match', match);
                if (scan instanceof Error) {
                    return done(scan);
                }
                if (!scan[1] || !scan[1].length) {
                    break;
                }
                scanned = scanned.concat(scan[1]);
                cursor = scan[0];
            }
            expect(scanned).to.have.lengthOf(10);
            expect(scanned.every(function (i) {
                return i.toString().length === 1 && set.indexOf(i) !== -1;
            })).to.be.true;
            scan = redismock.sscan(k, cursor, 'match', match);
            expect(scan[1]).to.have.lengthOf(0);
            scanned = [];
            var f;
            f = function (cursor, count, match, callback) {
                redismock.sscan(k, cursor, 'count', count, 'match', match, function (err, reply) {
                    if (err) {
                        return callback(err);
                    }
                    if (!reply[1] || !reply[1].length) {
                        expect(scanned).to.have.lengthOf(52);
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
