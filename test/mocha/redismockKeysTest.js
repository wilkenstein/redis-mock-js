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
        it('should delete a zset', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.zadd(k, 1, v);
            expect(redismock.exists(k)).to.equal(1);
            expect(redismock.zcard(k)).to.equal(1);
            expect(redismock.del(k)).to.equal(1);
            expect(redismock.exists(k)).to.equal(0);
            expect(redismock.zcard(k)).to.equal(0);
            redismock.zadd(k, 1, v);
            expect(redismock.exists(k)).to.equal(1);
            expect(redismock.zscore(k, v)).to.equal(1);
            redismock.del(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.exists(k)).to.equal(0);
                expect(redismock.zcard(k)).to.equal(0);
                done();
            });
        });
        it('should delete a hash', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.hset(k, v, v);
            expect(redismock.exists(k)).to.equal(1);
            expect(redismock.hlen(k)).to.equal(1);
            expect(redismock.del(k)).to.equal(1);
            expect(redismock.exists(k)).to.equal(0);
            expect(redismock.hlen(k)).to.equal(0);
            redismock.hset(k, v, v);
            expect(redismock.exists(k)).to.equal(1);
            expect(redismock.hlen(k)).to.equal(1);
            redismock.del(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.exists(k)).to.equal(0);
                expect(redismock.hlen(k)).to.equal(0);
                done();
            });
        });
        it('should delete multiple mixed keys', function (done) {
            var k1 = randkey(), k2 = randkey(), k3 = randkey(), k4 = randkey(), k5 = randkey();
            var v = 'v';
            redismock.set(k1, v);
            redismock.lpush(k2, v);
            redismock.sadd(k3, v);
            redismock.zadd(k4, 1, v);
            redismock.hset(k5, v, v);
            expect(redismock.exists(k1)).to.equal(1);
            expect(redismock.exists(k2)).to.equal(1);
            expect(redismock.exists(k3)).to.equal(1);
            expect(redismock.exists(k4)).to.equal(1);
            expect(redismock.exists(k5)).to.equal(1);
            expect(redismock.del(k1, k2, k3, k4, k5)).to.equal(5);
            expect(redismock.exists(k1)).to.equal(0);
            expect(redismock.exists(k2)).to.equal(0);
            expect(redismock.exists(k3)).to.equal(0);
            expect(redismock.exists(k4)).to.equal(0);
            expect(redismock.exists(k5)).to.equal(0);
            redismock.set(k1, v);
            redismock.lpush(k2, v);
            redismock.sadd(k3, v);
            redismock.zadd(k4, 1, v);
            redismock.hset(k5, v, v);
            expect(redismock.exists(k1)).to.equal(1);
            expect(redismock.exists(k2)).to.equal(1);
            expect(redismock.exists(k3)).to.equal(1);
            expect(redismock.exists(k4)).to.equal(1);
            expect(redismock.exists(k5)).to.equal(1);
            redismock.del(k5, k3, k1, k4, k2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(5);
                expect(redismock.exists(k1)).to.equal(0);
                expect(redismock.exists(k2)).to.equal(0);
                expect(redismock.exists(k3)).to.equal(0);
                expect(redismock.exists(k4)).to.equal(0);
                expect(redismock.exists(k5)).to.equal(0);
                done();
            });
        });
        it('should delete an array of keys', function (done) {
            var k1 = randkey(), k2 = randkey(), k3 = randkey(), k4 = randkey(), k5 = randkey();
            var v = 'v';
            redismock.set(k1, v);
            redismock.lpush(k2, v);
            redismock.sadd(k3, v);
            redismock.zadd(k4, 1, v);
            redismock.hset(k5, v, v);
            expect(redismock.exists(k1)).to.equal(1);
            expect(redismock.exists(k2)).to.equal(1);
            expect(redismock.exists(k3)).to.equal(1);
            expect(redismock.exists(k4)).to.equal(1);
            expect(redismock.exists(k5)).to.equal(1);
            expect(redismock.del([k1, k2, k3, k4, k5])).to.equal(5);
            expect(redismock.exists(k1)).to.equal(0);
            expect(redismock.exists(k2)).to.equal(0);
            expect(redismock.exists(k3)).to.equal(0);
            expect(redismock.exists(k4)).to.equal(0);
            expect(redismock.exists(k5)).to.equal(0);
            redismock.set(k1, v);
            redismock.lpush(k2, v);
            redismock.sadd(k3, v);
            redismock.zadd(k4, 1, v);
            redismock.hset(k5, v, v);
            expect(redismock.exists(k1)).to.equal(1);
            expect(redismock.exists(k2)).to.equal(1);
            expect(redismock.exists(k3)).to.equal(1);
            expect(redismock.exists(k4)).to.equal(1);
            expect(redismock.exists(k5)).to.equal(1);
            redismock.del([k5, k3, k1, k4, k2], function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(5);
                expect(redismock.exists(k1)).to.equal(0);
                expect(redismock.exists(k2)).to.equal(0);
                expect(redismock.exists(k3)).to.equal(0);
                expect(redismock.exists(k4)).to.equal(0);
                expect(redismock.exists(k5)).to.equal(0);
                done();
            });
        });
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
        it('should update the expiry time on subsequent expire calls', function (done) {
            this.timeout(5000);
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.expire(k, 1)).to.equal(1);
            setTimeout(function () {
                expect(redismock.get(k)).to.equal(v);
                expect(redismock.expire(k, 1)).to.equal(1);
            }, 750);
            setTimeout(function () {
                expect(redismock.get(k)).to.equal(v);
            }, 1200);
            setTimeout(function () {
                expect(redismock.get(k)).to.not.exist;
                done();
            }, 2500);
        });
        it('should delete the key if the specified timeout is less than or equal to 0', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.expire(k, 0)).to.equal(1);
            expect(redismock.get(k)).to.not.exist;
            expect(redismock.exists(k)).to.equal(0);
            redismock.set(k, v);
            redismock.expire(k, -1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.get(k)).to.not.exist;
                expect(redismock.exists(k)).to.equal(0);
                done();
            });
        });
    });

    describe('expireat', function () {
        it('should return 0 for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            var now = (new Date()).getTime()/1000;
            expect(redismock.expireat(k, now + 1)).to.equal(0);
            redismock.expireat(k, now + 2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return 1 and expire a key at the specified timestamp', function (done) {
            this.timeout(5000);
            var k = randkey();
            var v = 'v';
            var now = (new Date()).getTime()/1000;
            redismock.set(k, v);
            expect(redismock.expireat(k, now + 1)).to.equal(1);
            setTimeout(function () {
                expect(redismock.get(k)).to.equal(v);
            }, 750);
            setTimeout(function () {
                expect(redismock.get(k)).to.not.exist;
                redismock.set(k, v);
                now = (new Date()).getTime()/1000;
                redismock.expireat(k, now + 1, function (err, reply) {
                    expect(err).to.not.exist;
                    expect(reply).to.equal(1);
                    setTimeout(function () {
                        expect(redismock.get(k)).to.not.exist;
                        done();
                    }, 1200);
                });
            }, 1700);
        });
        it('should update the expiry time on subsequent expireat calls', function (done) {
            this.timeout(5000);
            var k = randkey();
            var v = 'v';
            var now = (new Date()).getTime()/1000;
            redismock.set(k, v);
            expect(redismock.expireat(k, now + 1)).to.equal(1);
            setTimeout(function () {
                expect(redismock.get(k)).to.equal(v);
                expect(redismock.expireat(k, now + 1 + 2)).to.equal(1);
            }, 750);
            setTimeout(function () {
                expect(redismock.get(k)).to.equal(v);
            }, 1200);
            setTimeout(function () {
                expect(redismock.get(k)).to.not.exist;
                done();
            }, 3500);
        });
        it('should delete the key if the specified timeout is less than or equal to 0', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.expireat(k, 0)).to.equal(1);
            expect(redismock.get(k)).to.not.exist;
            expect(redismock.exists(k)).to.equal(0);
            redismock.set(k, v);
            redismock.expireat(k, -1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.get(k)).to.not.exist;
                expect(redismock.exists(k)).to.equal(0);
                done();
            });
        });
    });

    describe('persist', function () {
        it('should return 0 for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.persist(k)).to.equal(0);
            redismock.persist(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return 0 for a key that does not have a timeout', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.persist(k)).to.equal(0);
            redismock.persist(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should persist a key with an associated timeout', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            redismock.expire(k, 1);
            setTimeout(function () {
                expect(redismock.get(k)).to.equal(v);
                expect(redismock.persist(k)).to.equal(1);
                expect(redismock.ttl(k)).to.equal(-1);
            }, 750);
            setTimeout(function () {
                expect(redismock.get(k)).to.equal(v);
                expect(redismock.ttl(k)).to.equal(-1);
                done();
            }, 1300);
        });
    });

    describe('pexpire', function () {
        it('should return 0 for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            expect(redismock.pexpire(k, 1000)).to.equal(0);
            redismock.pexpire(k, 1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return 1 and expire a key in milliseconds', function (done) {
            this.timeout(5000);
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.pexpire(k, 1175)).to.equal(1);
            setTimeout(function () {
                expect(redismock.get(k)).to.equal(v);
            }, 750);
            setTimeout(function () {
                expect(redismock.get(k)).to.not.exist;
                redismock.set(k, v);
                redismock.pexpire(k, 567, function (err, reply) {
                    expect(err).to.not.exist;
                    expect(reply).to.equal(1);
                    setTimeout(function () {
                        expect(redismock.get(k)).to.not.exist;
                        done();
                    }, 850);
                });
            }, 1500);
        });
        it('should update the expiry time on subsequent pexpire calls', function (done) {
            this.timeout(5000);
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.pexpire(k, 1111)).to.equal(1);
            setTimeout(function () {
                expect(redismock.get(k)).to.equal(v);
                expect(redismock.pexpire(k, 483)).to.equal(1);
            }, 750);
            setTimeout(function () {
                expect(redismock.get(k)).to.equal(v);
            }, 1200);
            setTimeout(function () {
                expect(redismock.get(k)).to.not.exist;
                done();
            }, 1900);
        });
        it('should delete the key if the specified timeout is less than or equal to 0', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.pexpire(k, 0)).to.equal(1);
            expect(redismock.get(k)).to.not.exist;
            expect(redismock.exists(k)).to.equal(0);
            redismock.set(k, v);
            redismock.pexpire(k, -1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.get(k)).to.not.exist;
                expect(redismock.exists(k)).to.equal(0);
                done();
            });
        });
    });

    describe('pexpireat', function () {
        it('should return 0 for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'v';
            var now = (new Date()).getTime();
            expect(redismock.pexpireat(k, now + 1111)).to.equal(0);
            redismock.pexpireat(k, now + 2222, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return 1 and expire a key at the specified timestamp', function (done) {
            this.timeout(5000);
            var k = randkey();
            var v = 'v';
            var now = (new Date()).getTime();
            redismock.set(k, v);
            expect(redismock.pexpireat(k, now + 999)).to.equal(1);
            setTimeout(function () {
                expect(redismock.get(k)).to.equal(v);
            }, 750);
            setTimeout(function () {
                expect(redismock.get(k)).to.not.exist;
                redismock.set(k, v);
                now = (new Date()).getTime();
                redismock.pexpireat(k, now + 1682, function (err, reply) {
                    expect(err).to.not.exist;
                    expect(reply).to.equal(1);
                    setTimeout(function () {
                        expect(redismock.get(k)).to.not.exist;
                        done();
                    }, 1900);
                });
            }, 1200);
        });
        it('should update the expiry time on subsequent pexpireat calls', function (done) {
            this.timeout(5000);
            var k = randkey();
            var v = 'v';
            var now = (new Date()).getTime();
            redismock.set(k, v);
            expect(redismock.pexpireat(k, now + 888)).to.equal(1);
            setTimeout(function () {
                expect(redismock.get(k)).to.equal(v);
                expect(redismock.pexpireat(k, now + 888 + 1555)).to.equal(1);
            }, 750);
            setTimeout(function () {
                expect(redismock.get(k)).to.equal(v);
            }, 1200);
            setTimeout(function () {
                expect(redismock.get(k)).to.not.exist;
                done();
            }, 2700);
        });
        it('should delete the key if the specified timeout is less than or equal to 0', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.pexpireat(k, 0)).to.equal(1);
            expect(redismock.get(k)).to.not.exist;
            expect(redismock.exists(k)).to.equal(0);
            redismock.set(k, v);
            redismock.pexpireat(k, -1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.get(k)).to.not.exist;
                expect(redismock.exists(k)).to.equal(0);
                done();
            });
        });
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

    describe('randomkey', function () {
        it('should return nothing for an empty database', function (done) {
            redismock.flushdb();
            expect(redismock.randomkey()).to.not.exist;
            redismock.randomkey(function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('should return a key from the database', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.flushdb();
            redismock.set(k, v);
            expect(redismock.randomkey()).to.equal(k);
            redismock.randomkey(function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(k);
                done();
            });
        });
        it('should return a random key from the database', function (done) {
            var keys = [randkey(), randkey(), randkey(), randkey(), randkey()];
            var values = ['v1', 'v2', 'v3', 'v4', 'v5'];
            var idx, len;
            var rk;
            redismock.flushdb();
            redismock.set(keys[0], values[0]);
            redismock.sadd(keys[1], values[1]);
            redismock.zadd(keys[2], 0.0, values[2]);
            redismock.hset(keys[3], values[3], values[3]);
            redismock.set(keys[4], values[4]);
            len = keys.length;
            for (idx = 0; idx < len; ++idx) {
                rk = redismock.randomkey();
                expect(rk).to.exist;
                expect(keys.indexOf(rk)).to.be.above(-1);
            }
            redismock.randomkey(function (err, rando) {
                expect(err).to.not.exist;
                expect(rando).to.exist;
                expect(keys.indexOf(rando)).to.be.above(-1);
                done();
            });
        });
    });

    describe('rename', function () {
        it('should return an error if the key does not exist', function (done) {
            expect(redismock.rename(randkey(), randkey())).to.be.an.instanceof(Error);
            redismock.rename(randkey(), randkey(), function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err.message.indexOf('no such key')).to.be.above(-1);
                done();
            });
        });
        it('should return OK if the new name is equal to the old', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.rename(k, k)).to.equal('OK');
            expect(redismock.get(k)).to.equal(v);
            redismock.rename(k, k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                expect(redismock.get(k)).to.equal(v);
                done();
            });
        });
        it('should rename a string key', function (done) {
            var k = randkey(), nk = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.rename(k, nk)).to.equal('OK');
            expect(redismock.get(nk)).to.equal(v);
            expect(redismock.exists(k)).to.equal(0);
            redismock.del(nk);
            redismock.set(k, v);
            redismock.rename(k, nk, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                expect(redismock.get(nk)).to.equal(v);
                expect(redismock.exists(k)).to.equal(0);
                done();
            });
        });
        it('should rename a set key', function (done) {
            var k = randkey(), nk = randkey();
            var v = 'v';
            redismock.sadd(k, v);
            expect(redismock.rename(k, nk)).to.equal('OK');
            expect(redismock.sismember(nk, v)).to.equal(1);
            expect(redismock.exists(k)).to.equal(0);
            redismock.del(nk);
            redismock.sadd(k, v);
            redismock.rename(k, nk, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                expect(redismock.sismember(nk, v)).to.equal(1);
                expect(redismock.exists(k)).to.equal(0);
                done();
            });
        });
        it('should rename a zset key', function (done) {
            var k = randkey(), nk = randkey();
            var v = 'v';
            redismock.zadd(k, 1.0, v);
            expect(redismock.rename(k, nk)).to.equal('OK');
            expect(redismock.zscore(nk, v)).to.equal(1.0);
            expect(redismock.exists(k)).to.equal(0);
            redismock.del(nk);
            redismock.zadd(k, 1.0, v);
            redismock.rename(k, nk, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                expect(redismock.zscore(nk, v)).to.equal(1.0);
                expect(redismock.exists(k)).to.equal(0);
                done();
            });
        });
        it('should rename a hash key', function (done) {
            var k = randkey(), nk = randkey();
            var v = 'v';
            redismock.hset(k, v, v);
            expect(redismock.rename(k, nk)).to.equal('OK');
            expect(redismock.hexists(nk, v)).to.equal(1);
            expect(redismock.exists(k)).to.equal(0);
            redismock.del(nk);
            redismock.hset(k, v, v);
            redismock.rename(k, nk, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                expect(redismock.hexists(nk, v)).to.equal(1);
                expect(redismock.exists(k)).to.equal(0);
                done();
            });
        });
    });

    describe('renamenx', function () {
        it('should return an error if the key does not exist', function (done) {
            expect(redismock.renamenx(randkey(), randkey())).to.be.an.instanceof(Error);
            redismock.renamenx(randkey(), randkey(), function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err.message.indexOf('no such key')).to.be.above(-1);
                done();
            });
        });
        it('should rename a string key', function (done) {
            var k = randkey(), nk = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.renamenx(k, nk)).to.equal(1);
            expect(redismock.get(nk)).to.equal(v);
            expect(redismock.exists(k)).to.equal(0);
            redismock.del(nk);
            redismock.set(k, v);
            redismock.renamenx(k, nk, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.get(nk)).to.equal(v);
                expect(redismock.exists(k)).to.equal(0);
                done();
            });
        });
        it('should rename a set key', function (done) {
            var k = randkey(), nk = randkey();
            var v = 'v';
            redismock.sadd(k, v);
            expect(redismock.renamenx(k, nk)).to.equal(1);
            expect(redismock.sismember(nk, v)).to.equal(1);
            expect(redismock.exists(k)).to.equal(0);
            redismock.del(nk);
            redismock.sadd(k, v);
            redismock.renamenx(k, nk, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.sismember(nk, v)).to.equal(1);
                expect(redismock.exists(k)).to.equal(0);
                done();
            });
        });
        it('should rename a zset key', function (done) {
            var k = randkey(), nk = randkey();
            var v = 'v';
            redismock.zadd(k, 1.0, v);
            expect(redismock.renamenx(k, nk)).to.equal(1);
            expect(redismock.zscore(nk, v)).to.equal(1.0);
            expect(redismock.exists(k)).to.equal(0);
            redismock.del(nk);
            redismock.zadd(k, 1.0, v);
            redismock.renamenx(k, nk, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.zscore(nk, v)).to.equal(1.0);
                expect(redismock.exists(k)).to.equal(0);
                done();
            });
        });
        it('should rename a hash key', function (done) {
            var k = randkey(), nk = randkey();
            var v = 'v';
            redismock.hset(k, v, v);
            expect(redismock.renamenx(k, nk)).to.equal(1);
            expect(redismock.hexists(nk, v)).to.equal(1);
            expect(redismock.exists(k)).to.equal(0);
            redismock.del(nk);
            redismock.hset(k, v, v);
            redismock.renamenx(k, nk, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.hexists(nk, v)).to.equal(1);
                expect(redismock.exists(k)).to.equal(0);
                done();
            });
        });
        it('should not rename a key if the key exists', function (done) {
            var k = randkey(), nk = randkey();
            var v = 'v';
            redismock.set(k, v);
            redismock.sadd(nk, v);
            expect(redismock.renamenx(k, nk)).to.equal(0);
            redismock.renamenx(nk, k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.exist;
                expect(reply).to.equal(0);
                done();
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
            expect(ret[0]).to.equal(0);
            expect(ret[1]).to.have.lengthOf(0);
            done();
        });
        xit('should scan through a large db');
        xit('should scan through a db with the count option');
        xit('should scan through a db with the match option');
        xit('should scan through a db with both the count and match options');
    });

}).call(this);
