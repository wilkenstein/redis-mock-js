var redismock = require('../../redis-mock.js');
var should = require('should');

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
        (redismock.sadd(k, v) instanceof Error).should.be.true;
        redismock.sadd(k, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should add a new set member', function (done) {
        var k = randkey();
        var v = 'v', v1 = 'v1', v2 = 'v2';
        redismock.sadd(k, v).should.equal(1);
        redismock.type(k).should.equal('set');
        redismock.sadd(k, v).should.equal(0);
        redismock.sadd(k, v1, v2, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(2);
            done();
        });
    });
});

describe('scard', function () {
    it('should return an error for a key that is not a set', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.set(k, v);
        (redismock.scard(k) instanceof Error).should.be.true;
        redismock.scard(k, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return 0 for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.scard(k, v).should.equal(0);
        redismock.scard(k, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return the set cardinality', function (done) {
        var k = randkey();
        var v = 'v', v1 = 'v1';
        redismock.sadd(k, v);
        redismock.scard(k, v).should.equal(1);
        redismock.sadd(k, v1);
        redismock.scard(k, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(2);
            done();
        });
    });
});

describe('sdiff', function () {
    xit('should sdiff');
});

describe('sdiffstore', function () {
    xit('should sdiffstore');
});

describe('sinter', function () {
    xit('should sinter');
});

describe('sinterstore', function () {
    xit('should sinterstore');
});

describe('sismember', function () {
    it('should return an error for a key that is not a set', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.set(k, v);
        (redismock.sismember(k, v) instanceof Error).should.be.true;
        redismock.sismember(k, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return 0 for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.sismember(k, v).should.equal(0);
        redismock.sismember(k, v, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return 0 for a member not in the set', function (done) {
        var k = randkey();
        var v = 'v', v1 = 'v1';
        redismock.sadd(k, v);
        redismock.sismember(k, v1).should.equal(0);
        redismock.sismember(k, v1, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return 1 for a member in the set', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.sadd(k, v);
        redismock.sismember(k, v).should.equal(1);
        redismock.sismember(k, v, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(1);
            done();
        });
    });
});

describe('smembers', function () {
    it('should return an error for a key that is not a set', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.set(k, v);
        (redismock.smembers(k) instanceof Error).should.be.true;
        redismock.smembers(k, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return an empty array for a key that does not exist', function (done) {
        var k = randkey();
        redismock.smembers(k).should.have.lengthOf(0);
        redismock.smembers(k, function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(0);
            done();
        });
    });
    it('should return the set members', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        redismock.sadd(k, v1, v2, v3);
        redismock.smembers(k).should.have.lengthOf(3);
        redismock.smembers(k, function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(3);
            reply.indexOf(v1).should.be.above(-1);
            reply.indexOf(v2).should.be.above(-1);
            reply.indexOf(v3).should.be.above(-1);
            done();
        });
    });
});

describe('smove', function () {
    it('should return an error for a source key that is not a set', function (done) {
        var k1 = randkey(), k2 = randkey();
        var v = 'v';
        redismock.set(k1, v);
        (redismock.smove(k1, k2, v) instanceof Error).should.be.true;
        redismock.smove(k1, k2, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return an error for a destination key that is not a set', function (done) {
        var k1 = randkey(), k2 = randkey();
        var v = 'v';
        redismock.sadd(k1, v);
        redismock.set(k2, v);
        (redismock.smove(k1, k2, v) instanceof Error).should.be.true;
        redismock.smove(k1, k2, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should do nothing if the element is not in the source set', function (done) {
        var k1 = randkey(), k2 = randkey();
        var v = 'v';
        redismock.smove(k1, k2, v).should.equal(0);
        redismock.smove(k1, k2, v, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should move the element from the source to the destination', function (done) {
        var k1 = randkey(), k2 = randkey();
        var v = 'v', v1 = 'v1';
        redismock.sadd(k1, v);
        redismock.smove(k1, k2, v).should.equal(1);
        redismock.scard(k1).should.equal(0);
        redismock.scard(k2).should.equal(1);
        redismock.sismember(k1, v).should.equal(0);
        redismock.sismember(k2, v).should.equal(1);
        redismock.sadd(k2, v1);
        redismock.smove(k2, k1, v1, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(1);
            redismock.scard(k1).should.equal(1);
            redismock.scard(k2).should.equal(1);
            redismock.sismember(k2, v1).should.equal(0);
            redismock.sismember(k1, v1).should.equal(1);
            done();
        });
    });
});

describe('spop', function () {
    it('should return an error for a key that is not a set', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.set(k, v);
        (redismock.spop(k) instanceof Error).should.be.true;
        redismock.spop(k, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return nothing for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'v';
        should.not.exist(redismock.spop(k));
        redismock.spop(k, function (err, reply) {
            should.not.exist(err);
            should.not.exist(reply);
            done();
        });
    });
    it('should remove a random member from the set and return it', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        var arr = [v1, v2, v3];
        redismock.sadd(k, v1, v2, v3);
        arr.indexOf(redismock.spop(k)).should.be.above(-1);
        redismock.scard(k).should.equal(2);
        arr.indexOf(redismock.spop(k)).should.be.above(-1);
        redismock.scard(k).should.equal(1);
        redismock.spop(k, function (err, reply) {
            should.not.exist(err);
            arr.indexOf(reply).should.be.above(-1);
            redismock.scard(k).should.equal(0);
            done();
        });
    });
});

describe('srandmember', function () {
    it('should return an error for a key that is not a set', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.set(k, v);
        (redismock.srandmember(k, 2) instanceof Error).should.be.true;
        redismock.srandmember(k, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return nothing for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'v';
        should.not.exist(redismock.srandmember(k));
        redismock.srandmember(k, function (err, reply) {
            should.not.exist(err);
            should.not.exist(reply);
            done();
        });
    });
    it('should return a random member from the set', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        var arr = [v1, v2, v3];
        redismock.sadd(k, v1, v2, v3);
        arr.indexOf(redismock.srandmember(k)).should.be.above(-1);
        redismock.srandmember(k, function (err, reply) {
            should.not.exist(err);
            arr.indexOf(reply).should.be.above(-1);
            done();
        });
    });
    it('should return count random members from the set', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        var arr = [v1, v2, v3];
        redismock.sadd(k, v1, v2, v3);
        var ms = redismock.srandmember(k, 2);
        ms.should.have.lengthOf(2);
        ms.forEach(function (m) {
            arr.indexOf(m).should.be.above(-1);
        });
        redismock.srandmember(k, 3, function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(3);
            reply.forEach(function (r) {
                arr.indexOf(r).should.be.above(-1);
            });
            done();
        });
    });
});

describe('srem', function () {
    it('should return an error for a key that is not a set', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.set(k, v);
        (redismock.srem(k, v) instanceof Error).should.be.true;
        redismock.srem(k, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return 0 for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.srem(k, v).should.equal(0);
        redismock.srem(k, v, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return 0 for an member not in the set', function (done) {
        var k = randkey();
        var v = 'v', v1 = 'v1';
        redismock.sadd(k, v);
        redismock.srem(k, v1).should.equal(0);
        redismock.srem(k, v1, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return 1 and remove the member from the set', function (done) {
        var k = randkey();
        var v = 'v';
        redismock.sadd(k, v);
        redismock.srem(k, v).should.equal(1);
        redismock.scard(k).should.equal(0);
        redismock.sadd(k, v);
        redismock.srem(k, v, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(1);
            redismock.scard(k).should.equal(0);
            done();
        });
    });
    it('should return count and remove count members from the set', function (done) {
        var k = randkey();
        var v = 'v', v1 = 'v1', v2 = 'v2', v3 = 'v3';
        redismock.sadd(k, v, v1, v3);
        redismock.srem(k, v1, v).should.equal(2);
        redismock.scard(k).should.equal(1);
        redismock.srem(k, v3, v2, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(1);
            redismock.scard(k).should.equal(0);
            done();
        });
    });
    xit('should srem');
});

describe('sunion', function () {
    xit('should sunion');
});

describe('sunionstore', function () {
    xit('should sunionstore');
});

describe('sscan', function () {
    xit('should sscan');
});
