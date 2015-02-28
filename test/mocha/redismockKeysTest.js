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

}).call(this);