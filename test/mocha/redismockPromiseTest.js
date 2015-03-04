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

    describe('toPromiseStyle', function () {
        it('should convert a redismock instance from callback-style to promise-style', function (done) {
            var k = randkey(), k1 = randkey(), k2 = randkey();
            var v = 'v', v1 = 'v1', v2 = 'v2';
            var redismock_promise = redismock.toPromiseStyle(Q.defer);
            redismock_promise
                .set(k, v)
                .then(function () {
                    return redismock_promise.get(k);
                })
                .then(function (reply) {
                    expect(reply).to.equal(v);
                    return redismock_promise.del(k);
                })
                .then(function (reply) {
                    return redismock_promise.get(k);
                })
                .then(function (reply) {
                    expect(reply).to.not.exist;
                    return redismock_promise.mset(k, v, k1, v1, k2, v2);
                })   
                .then(function (reply) {
                    expect(reply).to.equal('OK');
                    return redismock_promise.mget(k, k1, k2);
                })
                .then(function (reply) {
                    expect(reply).to.have.lengthOf(3);
                    expect(reply.indexOf(v)).to.equal(0);
                    expect(reply.indexOf(v1)).to.equal(1);
                    expect(reply.indexOf(v2)).to.equal(2);
                    done();
                })
                .fail(function (err) {
                    done(new Error(err));
                })
                .done();
        });
        it('should honor callbacks if given', function (done) {
            var k = randkey();
            var v = 'v';
            var redismock_promise = redismock.toPromiseStyle(Q.defer);
            var called = false;
            redismock_promise
                .set(k, v, function (err, reply) {
                    expect(err).to.not.exist;
                    expect(reply).to.equal('OK');
                    called = true;
                })
                .then(function (reply) {
                    expect(reply).to.equal('OK');
                })
                .fail(function (err) {
                    done(new Error(err));
                })
                .fin(function () {
                    expect(called).to.be.true;
                    done();
                })
                .done();
        });
        it('should fail appropriately', function (done) {
            var k = randkey();
            var v = 'v';
            var redismock_promise = redismock.toPromiseStyle(Q.defer);
            var called = false;
            redismock.lpush(k, v);
            redismock_promise
                .getrange(k, 0, -1)
                .then(function () {
                    expect(true).to.be.false;
                }, function (err) {
                    expect(err).to.be.an.instanceof(Error);
                    expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                    throw err;
                })
                .fail(function (err) {
                    expect(err).to.be.an.instanceof(Error);
                    expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                    done();
                })
                .done();
        });
        it('should work with multi', function (done) {
            var k = randkey();
            var v = 'v';
            var redismock_promise = redismock.toPromiseStyle(Q.defer);
            redismock_promise
                .multi()
                .set(k, v)
                .get(k)
                .del(k)
                .exec(function (err, replies) {
                    expect(err).to.not.exist;
                    expect(replies).to.have.lengthOf(3);
                    done();
                });
        });
    });

}).call(this);