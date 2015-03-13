(function() {
    var redismock = typeof require === 'function' ? require('../../redis-mock.js') : window.redismock;
    if (typeof chai === 'undefined') {
        var chai = typeof require === 'function' ? require('chai') : window.chai;
    }
    if (typeof Q === 'undefined') {
        var Q = typeof require === 'function' ? require('q') : window.Q;
    }
    chai.config.includeStack = true;
    var expect = chai.expect;

    function randkey(prefix) {
        if (!prefix) {
            prefix = 'k';
        }
        return prefix + Math.random();
    }

    describe('toNodeRedis', function () {
        redismock = redismock.toNodeRedis();
        it('should convert redismock into a node redis client', function (done) {
            var k = randkey();
            var v = 'v';
            if (typeof require !== 'function') {
                return done();
            }
            var ret = redismock.set(k, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                var ret2 = redismock.get(k, function (err, reply) {
                    expect(err).to.not.exist;
                    expect(reply).to.equal(v);
                    var ret3 = redismock.del(k, function (err, reply) {
                        expect(err).to.not.exist;
                        expect(reply).to.equal(1);
                        done();
                    });
                    expect(ret3).to.not.equal(1);
                });
                expect(ret2).to.not.equal(v);
            });
            expect(ret).to.not.equal('OK');
        });
        it('should be able to be converted to promise style', function (done) {
            var k = randkey();
            var v = 'v';
            var prc = redismock.toPromiseStyle(Q.defer);
            prc
                .set(k, v)
                .then(function (reply) {
                    expect(reply).to.equal('OK');
                    return prc.get(k);
                })
                .then(function (reply) {
                    expect(reply).to.equal(v);
                    return prc.del(k);
                })
                .then(function (reply) {
                    expect(reply).to.equal(1);
                    done();
                })
                .fail(function (err) {
                    done(err);
                })
                .done();
        });
    });

}).call(this);
