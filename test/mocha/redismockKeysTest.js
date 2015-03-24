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

    describe('del', function () {
        it('should return 0 if the key does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.del(k)).to.equal(0);
            redismock.del(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should delete a string', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.exists(k)).to.equal(1);
            expect(redismock.get(k)).to.equal(v);
            expect(redismock.del(k)).to.equal(1);
            expect(redismock.get(k)).to.not.exist;
            expect(redismock.exists(k)).to.equal(0);
            redismock.set(k, v);
            expect(redismock.exists(k)).to.equal(1);
            expect(redismock.get(k)).to.equal(v);
            redismock.del(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.exists(k)).to.equal(0);
                expect(redismock.get(k)).to.not.exist;
                done();
            });
        });
        it('should delete a list', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.lpush(k, v);
            expect(redismock.exists(k)).to.equal(1);
            expect(redismock.lindex(k, 0)).to.equal(v);
            expect(redismock.del(k)).to.equal(1);
            expect(redismock.exists(k)).to.equal(0);
            expect(redismock.lindex(k, 0)).to.not.exist;
            redismock.lpush(k, v);
            expect(redismock.exists(k)).to.equal(1);
            expect(redismock.lindex(k, 0)).to.equal(v);
            redismock.del(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.exists(k)).to.equal(0);
                expect(redismock.lindex(k, 0)).to.not.exist;
                done();
            });
        });
        it('should delete a set', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.sadd(k, v);
            expect(redismock.exists(k)).to.equal(1);
            expect(redismock.sismember(k, v)).to.equal(1);
            expect(redismock.del(k)).to.equal(1);
            expect(redismock.exists(k)).to.equal(0);
            expect(redismock.sismember(k, v)).to.equal(0);
            redismock.sadd(k, v);
            expect(redismock.exists(k)).to.equal(1);
            expect(redismock.sismember(k, v)).to.equal(1);
            redismock.del(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.exists(k)).to.equal(0);
                expect(redismock.sismember(k, v)).to.equal(0);
                done();
            });
        });
        xit('should delete a zset');
        xit('should delete multiple mixed keys');
    });

    describe('dump', function () {
        xit('should dump');
    });

    describe('exists', function () {
        it('should return 0 if the key does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.exists(k)).to.equal(0);
            redismock.exists(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return 1 for a string key that exists', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.exists(k)).to.equal(1);
            redismock.exists(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                done();
            });
        });
        it('should return 1 for a list key that exists', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.lpush(k, v);
            expect(redismock.exists(k)).to.equal(1);
            redismock.exists(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                done();
            });
        });
        it('should return 1 for a set key that exists', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.sadd(k, v);
            expect(redismock.exists(k)).to.equal(1);
            redismock.exists(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                done();
            });
        });
        it('should return 1 for a sorted set key that exists', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.zadd(k, 0, v);
            expect(redismock.exists(k)).to.equal(1);
            redismock.exists(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                done();
            });
        });
        it('should return 1 for a hash key that exists', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.hset(k, v, v);
            expect(redismock.exists(k)).to.equal(1);
            redismock.exists(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                done();
            });
        });
        xit('should return 0 after a key expires', function (done) {
        });
    });

    describe('expire', function () {
        it('should return 0 for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.expire(k, 1)).to.equal(0);
            redismock.expire(k, 1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return 1 and expire a key in seconds', function (done) {
            this.timeout(5000);
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.expire(k, 1)).to.equal(1);
            setTimeout(function () {
                expect(redismock.get(k)).to.equal(v);
            }, 750);
            setTimeout(function () {
                expect(redismock.get(k)).to.not.exist;
                redismock.set(k, v);
                redismock.expire(k, 1, function (err, reply) {
                    expect(err).to.not.exist;
                    expect(reply).to.equal(1);
                    setTimeout(function () {
                        expect(redismock.get(k)).to.not.exist;
                        done();
                    }, 1100);
                });
            }, 1100);
        });
        xit('should update the expiry time on subsequent expire calls');
    });

    describe('expireat', function () {
        xit('should expireat');
    });

    describe('pttl', function () {
        it('should return -2 for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.pttl(k)).to.equal(-2);
            redismock.pttl(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(-2);
                done();
            });
        });
        it('should return -1 for a key that exists but has no timeout', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.pttl(k)).to.equal(-1);
            redismock.pttl(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(-1);
                done();
            });
        });
        it('should return the ttl in milliseconds', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            redismock.pexpire(k, 1444);
            expect(redismock.pttl(k)).to.be.above(1000);
            redismock.pttl(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.be.above(1000);
                setTimeout(function () {
                    expect(redismock.pttl(k)).to.be.above(200);
                    setTimeout(function () {
                        expect(redismock.pttl(k)).to.equal(-2);
                        done();
                    }, 700);
                }, 900);
            });
        });
    });

    describe('keys', function () {
        it('should return an empty array for an empty database', function (done) {
            redismock.flushdb();
            expect(redismock.keys('*')).to.have.lengthOf(0);
            redismock.keys('h?llo', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(0);
                done();
            });
        });
        it('should return all the keys', function (done) {
            var k1 = randkey(), k2 = randkey(), k3 = randkey(), k4 = randkey(), k5 = randkey();
            var v = 'v';
            redismock.flushdb();
            redismock.set(k1, v);
            redismock.lpush(k2, v);
            redismock.sadd(k3, v);
            var keys = redismock.keys('*');
            expect(keys).to.have.lengthOf(3);
            expect(keys.indexOf(k1)).to.not.equal(-1);
            expect(keys.indexOf(k2)).to.not.equal(-1);
            expect(keys.indexOf(k3)).to.not.equal(-1);
            redismock.zadd(k4, 4, v);
            redismock.hset(k5, v, v);
            redismock.keys('*', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(5);
                expect(reply.indexOf(k4)).to.not.equal(-1);
                expect(reply.indexOf(k5)).to.not.equal(-1);
                done();
            });
        });
        it('should return the keys matching the pattern', function (done) {
            var k1 = 'hello', k2 = 'hallo', k3 = 'hxllo', k4 = 'hllo', k5 = 'heeeeello', k6 = 'hillo';
            var v = 'v';
            redismock.set(k1, v);
            redismock.lpush(k2, v);
            redismock.sadd(k3, v);
            redismock.hset(k4, v, v);
            redismock.zadd(k5, 5, v);
            var keys = redismock.keys('h?llo');
            expect(keys).to.have.lengthOf(3);
            expect(keys.indexOf(k1)).to.not.equal(-1);
            expect(keys.indexOf(k2)).to.not.equal(-1);
            expect(keys.indexOf(k3)).to.not.equal(-1);
            expect(keys.indexOf(k4)).to.equal(-1);
            expect(keys.indexOf(k5)).to.equal(-1);
            keys = redismock.keys('h*llo');
            expect(keys).to.have.lengthOf(5);
            expect(keys.indexOf(k4)).to.not.equal(-1);
            expect(keys.indexOf(k5)).to.not.equal(-1);
            redismock.set(k6, v);
            redismock.keys('h[ae]llo', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(2);
                expect(reply.indexOf(k1)).to.not.equal(-1);
                expect(reply.indexOf(k2)).to.not.equal(-1);
                expect(reply.indexOf(k6)).to.equal(-1);
                done();
            });
        });
    });

    describe('ttl', function () {
        it('should return -2 for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.ttl(k)).to.equal(-2);
            redismock.ttl(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(-2);
                done();
            });
        });
        it('should return -1 for a key that exists but has no timeout', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.ttl(k)).to.equal(-1);
            redismock.ttl(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(-1);
                done();
            });
        });
        it('should return the ttl in seconds', function (done) {
            this.timeout(5000);
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            redismock.expire(k, 2);
            expect(redismock.ttl(k)).to.be.above(1);
            redismock.ttl(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.be.above(1);
                setTimeout(function () {
                    expect(redismock.ttl(k)).to.be.above(0);
                    setTimeout(function () {
                        expect(redismock.ttl(k)).to.equal(-2);
                        done();
                    }, 1200);
                }, 900);
            });
        });
    });

    describe('scan', function () {
        it('should return an empty array for an empty db', function (done) {
            redismock.flushdb();
            var ret = redismock.scan(0);
            expect(ret).to.have.lengthOf(2);
            expect(ret[0]).to.equal(0);
            expect(ret[1]).to.have.lengthOf(0);
            redismock.scan(0, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(2);
                expect(reply[0]).to.equal(0);
                expect(reply[1]).to.have.lengthOf(0);
                done();
            });
        });
        it('should scan through a small number of keys in one pass', function (done) {
            redismock.flushdb();
            var k1 = randkey(), k2 = randkey(), k3 = randkey(), k4 = randkey(), k5 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4', v5 = 'v5';
            redismock.set(k1, v1);
            redismock.lpush(k2, v2);
            redismock.sadd(k3, v3);
            redismock.zadd(k4, 0, v4);
            redismock.hset(k5, 'f', v5);
            var ret = redismock.scan(0);
            expect(ret).to.have.lengthOf(2);
            expect(ret[0]).to.equal(5);
            expect(ret[1]).to.have.lengthOf(5);
            [k1, k2, k3, k4, k5].forEach(function (k) {
                expect(ret[1].indexOf(k)).to.be.above(-1);
            });
            ret = redismock.scan(ret[0]);
            expect(ret[0]).to.equal(5);
            expect(ret[1]).to.have.lengthOf(0);
            done();
        });
        xit('should scan through a large db');
        xit('should scan through a db with the count option');
        xit('should scan through a db with the match option');
        xit('should scan through a db with both the count and match options');
    });

}).call(this);
