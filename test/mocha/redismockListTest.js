var redismock = require('../../redis-mock.js');
var should = require('should');

function randkey(prefix) {
    if (!prefix) {
        prefix = 'k';
    }
    return prefix + Math.random();
}

describe('blpop', function () {
    xit('should blpop');
});

describe('brpop', function () {
    xit('should brpop');
});

describe('brpoplpush', function () {
    xit('should brpoplpush');
});

describe('lindex', function () {
    it('should return nothing for a key that does not exist', function (done) {
        should.not.exist(redismock.lindex(randkey(), 5));
        redismock.lindex(randkey(), 4, function (err, reply) {
            should.not.exist(err);
            should.not.exist(reply);
            done();
        });
    });
    it('should return an error for a key that is not a list', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.set(k, v);
        (redismock.lindex(k, 2) instanceof Error).should.be.true;
        redismock.lindex(k, 3, function (err, reply) {
            should.exist(err);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            should.not.exist(reply);
            done();
        });
    });
    it('should return nothing for an out of range index', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.lpush(k, v);
        should.not.exist(redismock.lindex(k, 2));
        redismock.lindex(k, -2, function (err, reply) {
            should.not.exist(err);
            should.not.exist(reply);
            done();
        });
    });
    it('should return the element at the given, in-range index', function (done) {
        var k = randkey();
        var v1 = 'value1', v2 = 'value2', v3 = 'value3';
        redismock.rpush(k, v1);
        redismock.rpush(k, v2);
        redismock.rpush(k, v3);
        redismock.lindex(k, 0).should.equal(v1);
        redismock.lindex(k, 1).should.equal(v2);
        redismock.lindex(k, 2).should.equal(v3);
        redismock.lindex(k, -1).should.equal(v3);
        redismock.lindex(k, -2).should.equal(v2);
        redismock.lindex(k, -3).should.equal(v1);
        redismock.lindex(k, 1, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(v2);
            done();
        });
    });
});

describe('linsert', function () {
    it('should return 0 for a key that does not exist', function (done) {
        redismock.linsert(randkey(), 'before', 'x', 'y').should.equal(0);
        redismock.linsert(randkey(), 'after', 'x', 'y', function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return -1 for a pivot that does not exist in the list', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.lpush(k, v);
        redismock.linsert(k, 'before', 'x', 'y').should.equal(-1);
        redismock.linsert(k, 'after', 'x', 'y', function (err, reply) {
            should.not.exist(err);
            reply.should.equal(-1);
            done();
        });
    });
    it('should return an error for a key that is not a list', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.set(k, v);
        (redismock.linsert(k, 'before', 'x', 'y') instanceof Error).should.be.true;
        redismock.linsert(k, 'after', 'x', 'y', function (err, reply) {
            should.exist(err);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            should.not.exist(reply);
            done();
        });
    });
    it('should insert the value before the pivot', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4';
        redismock.rpush(k, v2);
        redismock.rpush(k, v4);
        redismock.linsert(k, 'before', v4, v3).should.equal(3);
        redismock.lindex(k, 1).should.equal(v3);
        redismock.linsert(k, 'before', v2, v1, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(4);
            redismock.lindex(k, 0).should.equal(v1);
            done();
        });
    });
    it('should insert the value after the pivot', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4';
        redismock.rpush(k, v1);
        redismock.rpush(k, v3);
        redismock.linsert(k, 'after', v3, v4).should.equal(3);
        redismock.lindex(k, 2).should.equal(v4);
        redismock.linsert(k, 'after', v1, v2, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(4);
            redismock.lindex(k, 1).should.equal(v2);
            done();
        });
    });
});

describe('llen', function () {
    it('should return 0 for a key that does not exist', function (done) {
        redismock.llen(randkey()).should.equal(0);
        redismock.llen(randkey(), function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return an error for a key that is not a list', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.set(k, v);
        (redismock.llen(k) instanceof Error).should.be.true;
        redismock.llen(k, function (err, reply) {
            should.exist(err);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            should.not.exist(reply);
            done();
        });
    });
    it('should return the length of a list', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        redismock.llen(k).should.equal(0);
        redismock.rpush(k, v1);
        redismock.llen(k).should.equal(1);
        redismock.rpush(k, v2);
        redismock.llen(k).should.equal(2);
        redismock.rpush(k, v3);
        redismock.llen(k).should.equal(3);
        redismock.llen(k, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(3);
            done();
        });
    });
});

describe('lpop', function () {
    it('should return nothing for a key that does not exist', function (done) {
        should.not.exist(redismock.lpop(randkey()));
        redismock.lpop(randkey(), function (err, reply) {
            should.not.exist(err);
            should.not.exist(reply);
            done();
        });
    });
    it('should return an error for a key that is not a list', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.set(k, v);
        (redismock.lpop(k) instanceof Error).should.be.true;
        redismock.lpop(k, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return the left element of the list', function (done) {
        var k = randkey();
        var v1 = 'value', v2 = 'value', v3 = 'value';
        redismock.rpush(k, v1);
        redismock.rpush(k, v2);
        redismock.rpush(k, v3);
        redismock.lpop(k).should.equal(v1);
        redismock.lpop(k).should.equal(v2);
        redismock.lpop(k, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(v3);
            done();
        });
    });
});

describe('lpush', function () {
    it('should return an error for a key that is not a list', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.set(k, v);
        (redismock.lpush(k, v) instanceof Error).should.be.true;
        redismock.lpush(k, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should push into the left of a list', function (done) {
        var k = randkey();
        var v1 = 'value', v2 = 'v2', v3 = 'v3';
        redismock.lpush(k, v1, v2).should.equal(2);
        redismock.llen(k).should.equal(2);
        redismock.lindex(k, 0).should.equal(v1);
        redismock.lpush(k, v3, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(3);
            redismock.llen(k).should.equal(3);
            redismock.lindex(k, 0).should.equal(v3);
            done();
        });
    });
});

describe('lpushx', function () {
    it('should return an error for a key that is not a list', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.set(k, v);
        (redismock.lpushx(k, v) instanceof Error).should.be.true;
        redismock.lpushx(k, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should do nothing if the key does not exist', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.lpushx(k, v).should.equal(0);
        redismock.llen(k).should.equal(0);
        redismock.lpushx(k, v, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            redismock.llen(k).should.equal(0);
            done();
        });
    });
    it('should push into the left of a list if the list exists', function (done) {
        var k = randkey();
        var v1 = 'value', v2 = 'v2', v3 = 'v3';
        redismock.lpush(k, v1).should.equal(1);
        redismock.llen(k).should.equal(1);
        redismock.lindex(k, 0).should.equal(v1);
        redismock.lpushx(k, v2).should.equal(2);
        redismock.llen(k).should.equal(2);
        redismock.lindex(k, 0).should.equal(v2);
        redismock.lpushx(k, v3, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(3);
            redismock.llen(k).should.equal(3);
            redismock.lindex(k, 0).should.equal(v3);
            done();
        });
    });
});

describe('lrange', function () {
    it('should return an error for a key that is not a list', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.set(k, v);
        (redismock.lrange(k, 0, -1) instanceof Error).should.be.true;
        redismock.lrange(k, 0, -1, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return nothing for out-of-range indices', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.lpush(k, v);
        redismock.lrange(k, 1, 0).length.should.equal(0);
        redismock.lrange(k, 1, 2).length.should.equal(0);
        redismock.lrange(k, -3, -2).length.should.equal(0);
        redismock.lrange(k, -2, -3, function (err, reply) {
            should.not.exist(err);
            reply.length.should.equal(0);
            done();
        });
    });
    it('should return the range for in-range indices', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        redismock.rpush(k, v1, v2, v3);
        var l = redismock.lrange(k, 0, -1);
        l.should.have.lengthOf(3);
        l[0].should.equal(v1);
        l[1].should.equal(v2);
        l[2].should.equal(v3);
        l = redismock.lrange(k, 1, 2);
        l.should.have.lengthOf(2);
        l[0].should.equal(v2);
        l[1].should.equal(v3);
        redismock.lrange(k, -2, -3, function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(2);
            reply[0].should.equal(v1);
            reply[1].should.equal(v2);
            done();
        });
    });
});

describe('lrem', function () {
    it('should return an error for a key that is not a list', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.set(k, v);
        (redismock.lrem(k, 1, v) instanceof Error).should.be.true;
        redismock.lrem(k, 1, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return 0 for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.lrem(k, 1, v).should.equal(0);
        redismock.lrem(k, 1, v, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return 0 for a list without the element in it', function (done) {
        var k = randkey();
        var v = 'value', nv = 'nvalue';
        redismock.lpush(k, v);
        redismock.lrem(k, 1, nv).should.equal(0);
        redismock.lrem(k, 1, nv, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should remove and return the removed count for a list with the elements in it', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.lpush(k, v, v, v, v, v);
        redismock.llen(k).should.equal(5);
        redismock.lrem(k, 1, v).should.equal(1);
        redismock.llen(k).should.equal(4);
        redismock.lrem(k, 2, v).should.equal(2);
        redismock.llen(k).should.equal(2);
        redismock.lrem(k, 0, v, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(2);
            redismock.llen(k).should.equal(0);
            redismock.lpush(k, v);
            redismock.lrem(k, 3, v).should.equal(1);
            redismock.llen(k).should.equal(0);
            done();
        });
    });
});

describe('lset', function () {
    it('should return an error for a key that is not a list', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.set(k, v);
        (redismock.lset(k, 0, v) instanceof Error).should.be.true;
        redismock.lset(k, 0, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return an error for an out of range index', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.rpush(k, v);
        (redismock.lset(k, 1, v) instanceof Error).should.be.true;
        redismock.lset(k, 1, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('ERR').should.be.above(-1);
            done();
        });
    });
    it('should return an error for a non-existent key', function (done) {
        (redismock.lset(randkey(), 0, 'v') instanceof Error).should.be.true;
        redismock.lset(randkey(), 5, 'v', function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('ERR').should.be.above(-1);
            done();
        });
    });
    it('should set the element at index for an in-range index', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3', nv = 'nv', xv = 'xv';
        redismock.rpush(k, v1, v2, v3);
        redismock.lset(k, 1, nv).should.equal('OK');
        redismock.lindex(k, 1).should.equal(nv);
        redismock.lset(k, 2, xv, function (err, reply) {
            should.not.exist(err);
            reply.should.equal('OK');
            redismock.lindex(k, 2).should.equal(xv);
            done();
        });
    });
});

describe('ltrim', function () {
    it('should return an error for a key that is not a list', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.set(k, v);
        (redismock.ltrim(k, 0, 1) instanceof Error).should.be.true;
        redismock.lset(k, 0, 1, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should do nothing for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.ltrim(k, 0, 1).should.equal('OK');
        redismock.llen(k).should.equal(0);
        should.not.exist(redismock.get(k));
        redismock.ltrim(k, 0, 1, function (err, reply) {
            should.not.exist(err);
            reply.should.equal('OK');
            redismock.llen(k).should.equal(0);
            should.not.exist(redismock.get(k));
            done();
        });
    });
    it('should remove the list if start > end', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.lpush(k, v);
        redismock.llen(k).should.equal(1);
        redismock.ltrim(k, 1, 0).should.equal('OK');
        redismock.llen(k).should.equal(0);
        redismock.rpush(k, v);
        redismock.ltrim(k, -4, -5, function (err, reply) {
            should.not.exist(err);
            reply.should.equal('OK');
            redismock.llen(k).should.equal(0);
            should.not.exist(redismock.get(k));
            done();
        });
    });
    it('should remove the list if start is greater than the end of the list', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.lpush(k, v, v);
        redismock.llen(k).should.equal(2);
        redismock.ltrim(k, 3, 4).should.equal('OK');
        redismock.llen(k).should.equal(0);
        redismock.lpush(k, v, v);
        redismock.llen(k).should.equal(2);
        redismock.ltrim(k, -4, -3, function (err, reply) {
            should.not.exist(err);
            reply.should.equal('OK');
            redismock.llen(k).should.equal(0);
            should.not.exist(redismock.get(k));
            done();
        });
    });
    it('should trim the list with in-range indices', function (done) {
        var k = randkey();
        var v = 'v', v1 = 'v1';
        redismock.rpush(k, v, v1, v1, v1, v);
        redismock.llen(k).should.equal(5);
        redismock.ltrim(k, 1, 3).should.equal('OK');
        redismock.llen(k).should.equal(3);
        redismock.lindex(k, 0).should.equal(v1);
        redismock.ltrim(k, 1, 0).should.equal('OK');
        redismock.llen(k).should.equal(0);
        redismock.rpush(k, v, v1, v1, v1, v);
        redismock.ltrim(k, -4, -2, function (err, reply) {
            should.not.exist(err);
            reply.should.equal('OK');
            redismock.llen(k).should.equal(3);
            redismock.lindex(k, 0).should.equal(v1);
            done();
        });
    });
});

describe('rpop', function () {
    it('should return an error for a key that is not a list', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.set(k, v);
        (redismock.rpop(k) instanceof Error).should.be.true;
        redismock.rpop(k, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return nothing for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'value';
        should.not.exist(redismock.rpop(k));
        redismock.rpop(k, function (err, reply) {
            should.not.exist(err);
            should.not.exist(reply);
            done();
        });
    });
    it('should return the right element for a list', function (done) {
        var k = randkey();
        var v = 'value', v1 = 'v1';
        redismock.rpush(k, v, v1);
        redismock.rpop(k).should.equal(v1);
        redismock.rpop(k, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(v);
            done();
        });
    });
});

describe('rpoplpush', function () {
    it('should return an error for a source key that is not a list', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.set(k, v);
        (redismock.rpoplpush(k, randkey()) instanceof Error).should.be.true;
        redismock.rpoplpush(k, randkey(), function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return an error for a destination key that is not a list', function (done) {
        var k1 = randkey(), k2 = randkey();
        var v = 'value';
        redismock.lpush(k1, v);
        redismock.set(k2, v);
        (redismock.rpoplpush(k1, k2) instanceof Error).should.be.true;
        redismock.lpush(k1, v);
        redismock.rpoplpush(k1, k2, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should do nothing for an empty list', function (done) {
        var k1 = randkey(), k2 = randkey();
        var v = 'value';
        redismock.lpush(k2, v);
        should.not.exist(redismock.rpoplpush(k1, k2));
        redismock.rpoplpush(k1, k2, function (err, reply) {
            should.not.exist(err);
            should.not.exist(reply);
            done();
        });
    });
    it('should pop from the right and push to the left between source and destination', function (done) {
        var k1 = randkey(), k2 = randkey();
        var v = 'v', nv = 'nv';
        redismock.lpush(k1, v, nv);
        redismock.lpush(k2, v, nv);
        redismock.rpoplpush(k1, k2).should.equal(nv);
        redismock.llen(k2).should.equal(3);
        redismock.lindex(k2, 0).should.equal(nv);
        redismock.llen(k1).should.equal(1);
        redismock.lindex(k1, 0).should.equal(v);
        redismock.rpoplpush(k1, k2, function (err, reply) {
            redismock.llen(k2).should.equal(4);
            redismock.lindex(k2, 0).should.equal(v);
            redismock.llen(k1).should.equal(0);
            done();
        });
    });
});

describe('rpush', function () {
    it('should return an error for a key that is not a list', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.set(k, v);
        (redismock.rpush(k, v) instanceof Error).should.be.true;
        redismock.rpush(k, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should push into the right of a list', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        redismock.rpush(k, v1, v2);
        redismock.llen(k).should.equal(2);
        redismock.lindex(k, 0).should.equal(v1);
        redismock.rpush(k, v3, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(3);
            redismock.llen(k).should.equal(3);
            redismock.lindex(k, 0).should.equal(v1);
            redismock.lindex(k, -1).should.equal(v3);
            done();
        });
    });
});

describe('rpushx', function () {
    it('should return an error for a key that is not a list', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.set(k, v);
        (redismock.rpushx(k, v) instanceof Error).should.be.true;
        redismock.rpushx(k, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should do nothing if the key does not exist', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.rpushx(k, v).should.equal(0);
        redismock.llen(k).should.equal(0);
        redismock.rpushx(k, v, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            redismock.llen(k).should.equal(0);
            done();
        });
    });
    it('should push into the right of a list if the list exists', function (done) {
        var k = randkey();
        var v1 = 'value', v2 = 'v2', v3 = 'v3';
        redismock.lpush(k, v1).should.equal(1);
        redismock.llen(k).should.equal(1);
        redismock.lindex(k, -1).should.equal(v1);
        redismock.rpushx(k, v2).should.equal(2);
        redismock.llen(k).should.equal(2);
        redismock.lindex(k, -1).should.equal(v2);
        redismock.rpushx(k, v3, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(3);
            redismock.llen(k).should.equal(3);
            redismock.lindex(k, -1).should.equal(v3);
            done();
        });
    });
});
