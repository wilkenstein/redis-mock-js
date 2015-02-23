var redismock = require('../../redis-mock.js');
var should = require('should');

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
                should.not.exist(err);
                replies.should.have.lengthOf(3);
                replies[0].should.equal(1);
                replies[1].should.equal(2);
                replies[2].should.equal(3);
                redismock.llen(k).should.equal(3);
                done();
            });
    });
    it('should fail if a key in a multi command is being watched and changes', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        var multi = redismock
            .watch(k)
            .multi()
            .lpush(k, v1)
            .rpush(k, v2)
            .lpush(k, v3);
        redismock.lpush(k, 'v');
        multi.exec(function (err, replies) {
            should.not.exist(err);
            should.not.exist(replies);
            done();
        });
    });
    xit('should multi');
});
