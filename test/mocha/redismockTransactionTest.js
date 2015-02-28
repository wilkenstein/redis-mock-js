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

    describe('watch', function () {
        xit('should watch');
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
                done();
            });
        });
        xit('should multi');
    });
}).call(this);