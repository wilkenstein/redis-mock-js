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

    describe('discard', function () {
        it('should return an error if we are not in an exec', function (done) {
            expect(redismock.discard()).to.be.an.instanceof(Error);
            redismock.discard(function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err.message.indexOf('ERR')).to.be.above(-1);
                done();
            });
        });
        it('should discard previously queued commands on an exec', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            var multi = redismock
                .multi()
                .lpush(k, v1)
                .rpush(k, v2)
                .lpush(k, v3);
            multi.discard();
            multi
                .sadd(k, v1)
                .sadd(k, v2)
                .exec(function (err, replies) {
                    expect(err).to.not.exist;
                    expect(replies).to.exist;
                    expect(replies).to.have.lengthOf(2);
                    expect(redismock.type(k)).to.equal("set");
                    expect(redismock.scard(k)).to.equal(2);
                    done();
                });
        });
        xit('should unwatch all watched keys', function (done) {
        });
    });

    describe('watch', function () {
        it('should watch a key and fail a multi command if the key changes', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            var v = 'v';
            expect(redismock.watch(k)).to.equal('OK');
            var multi = redismock
                .multi()
                .lpush(k, v1)
                .rpush(k, v2)
                .lpush(k, v3);
            redismock.lpush(k, v);
            multi.exec(function (err, replies) {
                expect(err).to.not.exist;
                expect(replies).to.not.exist;
                expect(redismock.llen(k)).to.equal(1);
                expect(redismock.lindex(k, 0)).to.equal(v);
                done();
            });
        });
        it('should stop watching all keys for that client after an exec command', function (done) {
            var k1 = randkey(), k2 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            var v = 'v';
            expect(redismock.watch(k1)).to.equal('OK');
            expect(redismock.watch(k2)).to.equal('OK');
            var multi = redismock
                .multi()
                .lpush(k1, v1)
                .rpush(k2, v2)
                .lpush(k1, v3);
            redismock.lpush(k1, v);
            multi.exec(function (err, replies) {
                expect(err).to.not.exist;
                expect(replies).to.not.exist;
                multi = redismock
                    .multi()
                    .lpush(k1, v1)
                    .rpush(k2, v2)
                    .lpush(k1, v3);
                redismock.lpush(k2, 'v');
                multi.exec(function (err, replies) {
                    expect(err).to.not.exist;
                    expect(replies).to.exist;
                    expect(replies).to.have.lengthOf(3);
                    done();
                });
            });
        });
        xit('should watch a key and fail a multi command that takes in multiple keys if one of the keys changes');
        xit('should be watching on every modification command');
        it('should fail all client execs that are watching the same key if the key changes', function (done) {
            var c1 = redismock.createClient(), c2 = redismock.createClient(), c3 = redismock.createClient();
            var k = randkey();
            var v = 'v';
            expect(c1.watch(k)).to.equal('OK');
            expect(c2.watch(k)).to.equal('OK');
            expect(c3.watch(k)).to.equal('OK');
            redismock.lpush(k, 'v');
            var m1 = c1.multi().set(k, 'v');
            var m2 = c2.multi().sadd(k, 'v');
            var m3 = c3.multi().zadd(k, 1, 'v');
            m1.exec(function (err, replies) {
                expect(err).to.not.exist;
                expect(replies).to.not.exist;
                expect(redismock.type(k)).to.equal('list');
                expect(redismock.llen(k)).to.equal(1);
                expect(redismock.lindex(k, 0)).to.equal(v);
                m2.exec(function (err, replies) {
                    expect(err).to.not.exist;
                    expect(replies).to.not.exist;
                    expect(redismock.type(k)).to.equal('list');
                    expect(redismock.llen(k)).to.equal(1);
                    expect(redismock.lindex(k, 0)).to.equal(v);
                    m3.exec(function (err, replies) {
                        expect(err).to.not.exist;
                        expect(replies).to.not.exist;
                        expect(redismock.type(k)).to.equal('list');
                        expect(redismock.llen(k)).to.equal(1);
                        expect(redismock.lindex(k, 0)).to.equal(v);
                        done();
                    });
                });
            });
        });
    });

    describe('multi', function () {
        it('should execute a multi command', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            redismock
                .multi()
                .lpush(k, v1)
                .rpush(k, v2)
                .lpush(k, v3)
                .exec(function (err, replies) {
                    expect(err).to.not.exist;
                    expect(replies).to.have.lengthOf(3);
                    expect(replies[0]).to.equal(1);
                    expect(replies[1]).to.equal(2);
                    expect(replies[2]).to.equal(3);
                    expect(redismock.llen(k)).to.equal(3);
                    done();
                });
        });
        it('should fail if a key in a multi command is being watched and changes', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            expect(redismock.watch(k)).to.equal('OK');
            var multi = redismock
                .multi()
                .lpush(k, v1)
                .rpush(k, v2)
                .lpush(k, v3);
            redismock.lpush(k, 'v');
            multi.exec(function (err, replies) {
                expect(err).to.not.exist;
                expect(replies).to.not.exist;
                expect(redismock.llen(k)).to.equal(1);
                expect(redismock.lindex(k, 0)).to.equal('v');
                done();
            });
        });
        it('should not fail if the keys are not being watched', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            var multi = redismock
                .multi()
                .lpush(k, v1)
                .rpush(k, v2)
                .lpush(k, v3);
            redismock.lpush(k, 'v');
            multi.exec(function (err, replies) {
                expect(err).to.not.exist;
                expect(replies).to.exist;
                expect(replies).to.have.lengthOf(3);
                done();
            });
        });
        xit('should be able to execute any command');
    });

    describe('unwatch', function () {
        xit('should unwatch');
    });

}).call(this);