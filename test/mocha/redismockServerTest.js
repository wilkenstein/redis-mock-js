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

    describe('dbsize', function () {
        it('should return the number of keys in the database', function (done) {
            var k1 = randkey(), k2 = randkey(), k3 = randkey(), k4 = randkey(), k5 = randkey();
            var v = 'v';
            redismock.flushdb();
            expect(redismock.dbsize()).to.equal(0);
            redismock.set(k1, v);
            expect(redismock.dbsize()).to.equal(1);
            redismock.lpush(k2, v);
            expect(redismock.dbsize()).to.equal(2);
            redismock.sadd(k3, v);
            expect(redismock.dbsize()).to.equal(3);
            redismock.zadd(k4, 4, v);
            expect(redismock.dbsize()).to.equal(4);
            redismock.hset(k5, v, v);
            redismock.dbsize(function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(5);
                done();
            });
        });
    });

    describe('time', function () {
        it('should return the time in 2 parts: epoch and us', function (done) {
            var now = new Date();
            var t = redismock.time();
            expect(t).to.have.lengthOf(2);
            expect(t[0]).to.be.at.least(now.getTime());
            expect(t[1]).to.be.at.least(0);
            redismock.time(function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(2);
                expect(reply[0]).to.be.at.least(now.getTime());
                expect(reply[1]).to.be.at.least(0);
                done();
            });
        });
    });

}).call(this);
