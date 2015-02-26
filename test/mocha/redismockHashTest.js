var redismock = require('../../redis-mock.js');
var should = require('should');

function randkey(prefix) {
    if (!prefix) {
        prefix = 'k';
    }
    return prefix + Math.random();
}

describe('hdel', function () {
    it('should return an error for a key that is not a hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        redismock.set(k, v);
        (redismock.hdel(k, f) instanceof Error).should.be.true;
        redismock.hdel(k, f, f, f, function (err, reply) {
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
        var f = 'f'
        redismock.hdel(k, f).should.equal(0);
        redismock.hdel(k, f, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return 0 if the field does not exist', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f', f1 = 'f1', f2 = 'f2';
        redismock.hset(k, f, v);
        redismock.hdel(k, f1).should.equal(0);
        redismock.hdel(k, f1, f2, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return 1 when deleting a single field', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f';
        redismock.hset(k, f, v);
        redismock.hdel(k, f).should.equal(1);
        redismock.hset(k, f, v);
        redismock.hdel(k, f, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(1);
            done();
        });
    });
    it('should return the deleted count when deleting multiple fields', function (done) {
        var k = randkey();
        var v = 'value';
        var f1 = 'f1', f2 = 'f2', f3 = 'f3';
        redismock.hset(k, f1, v);
        redismock.hset(k, f2, v);
        redismock.hset(k, f3, v);
        redismock.hdel(k, f1, f2).should.equal(2);
        redismock.hset(k, f1, v);
        redismock.hset(k, f2, v);
        redismock.hset(k, f3, v);
        redismock.hdel(k, f1, f2, f3, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(3);
            done();
        });
    });
});

describe('hexists', function () {
    it('should return an error for a key that is not a hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        redismock.set(k, v);
        (redismock.hexists(k, f) instanceof Error).should.be.true;
        redismock.hexists(k, f, function (err, reply) {
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
        var f = 'f'
        redismock.hexists(k, f).should.equal(0);
        redismock.hexists(k, f, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return 0 if the field does not exist in the hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f1 = 'f', f2 = 'f2';
        redismock.hset(k, f1, v);
        redismock.hexists(k, f2).should.equal(0);
        redismock.hexists(k, f2, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return 1 if the field does exist in the hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f1 = 'f', f2 = 'f2';
        redismock.hset(k, f1, v);
        redismock.hexists(k, f1).should.equal(1);
        redismock.hset(k, f2, v);
        redismock.hexists(k, f2, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(1);
            done();
        });
    });
});

describe('hget', function () {
    it('should return an error for a key that is not a hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        redismock.set(k, v);
        (redismock.hget(k, f) instanceof Error).should.be.true;
        redismock.hget(k, f, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return nothing for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        should.not.exist(redismock.hget(k, f));
        redismock.hget(k, f, function (err, reply) {
            should.not.exist(err);
            should.not.exist(reply);
            done();
        });
    });
    it('should return nothing for a field in a key that does not exist', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f', f1 = 'f1';
        redismock.hset(k, f, v);
        should.not.exist(redismock.hget(k, f1));
        redismock.hget(k, f1, function (err, reply) {
            should.not.exist(err);
            should.not.exist(reply);
            done();
        });
    });
    it('should return the value for a field', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f';
        redismock.hset(k, f, v);
        redismock.hget(k, f).should.equal(v);
        redismock.hget(k, f, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(v);
            done();
        });
    });
});

describe('hgetall', function () {
    it('should return an error for a key that is not a hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        redismock.set(k, v);
        (redismock.hgetall(k) instanceof Error).should.be.true;
        redismock.hgetall(k, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return an empty array for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        redismock.hgetall(k).should.have.lengthOf(0);
        redismock.hgetall(k, function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(0);
            done();
        });
    });
    it('should return all the keys and values in a hash', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        var f1 = 'f1', f2 = 'f2', f3 = 'f3';
        redismock.hmset(k, f1, v1, f2, v2, f3, v3);
        redismock.hgetall(k).should.have.lengthOf(3*2);
        redismock.hgetall(k, function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(3*2);
            reply.indexOf(f1).should.be.above(-1);
            reply.indexOf(v1).should.equal(reply.indexOf(f1) + 1);
            reply.indexOf(f2).should.be.above(-1);
            reply.indexOf(v2).should.equal(reply.indexOf(f2) + 1);
            reply.indexOf(f3).should.be.above(-1);
            reply.indexOf(v3).should.equal(reply.indexOf(f3) + 1);
            done();
        });
    });
});

describe('hincrby', function () {
    xit('should hincrby');
});

describe('hincrbyfloat', function () {
    xit('should hincrbyfloat');
});

describe('hkeys', function () {
    it('should return an error for a key that is not a hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        redismock.set(k, v);
        (redismock.hkeys(k) instanceof Error).should.be.true;
        redismock.hkeys(k, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return an empty array for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        redismock.hkeys(k).should.have.lengthOf(0);
        redismock.hkeys(k, function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(0);
            done();
        });
    });
    it('should return all the keys in a hash', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        var f1 = 'f1', f2 = 'f2', f3 = 'f3';
        redismock.hmset(k, f1, v1, f2, v2, f3, v3);
        redismock.hkeys(k).should.have.lengthOf(3);
        redismock.hkeys(k, function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(3);
            reply.indexOf(f1).should.be.above(-1);
            reply.indexOf(f2).should.be.above(-1);
            reply.indexOf(f3).should.be.above(-1);
            done();
        });
    });
});

describe('hlen', function () {
    it('should return an error for a key that is not a hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        redismock.set(k, v);
        (redismock.hlen(k) instanceof Error).should.be.true;
        redismock.hlen(k, function (err, reply) {
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
        var f = 'f'
        redismock.hlen(k).should.equal(0);
        redismock.hlen(k, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return the length of the hash', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        var f1 = 'f1', f2 = 'f2', f3 = 'f3';
        redismock.hmset(k, f1, v1, f2, v2, f3, v3);
        redismock.hlen(k).should.equal(3);
        redismock.hlen(k, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(3);
            done();
        });
    });
});

describe('hmget', function () {
    it('should return an error for a key that is not a hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f';
        redismock.set(k, v);
        (redismock.hmget(k, f) instanceof Error).should.be.true;
        redismock.hmget(k, f, f, f, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return an empty array for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f';
        redismock.hmget(k, f, f).should.have.lengthOf(0);
        redismock.hmget(k, f, f, f, function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(0);
            done();
        });
    });
    it('should return the fields in the hash, and nils when a field is not in the hash', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        var f1 = 'f1', f2 = 'f2', f3 = 'f3';
        redismock.hmset(k, f1, v1, f2, v2, f3, v3);
        redismock.hmget(k, f1, f2, f3).should.have.lengthOf(3);
        redismock.hmget(k, f1, f2, f3, f2, 'na', f2, 'na', function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(7);
            reply[0].should.equal(redismock.hget(k, f1));
            reply[1].should.equal(redismock.hget(k, f2));
            reply[2].should.equal(redismock.hget(k, f3));
            reply[3].should.equal(redismock.hget(k, f2));
            should.not.exist(reply[4]);
            reply[5].should.equal(redismock.hget(k, f2));
            should.not.exist(reply[6]);
            done();
        });
    });
});

describe('hmset', function () {
    it('should return an error for a key that is not a hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f';
        redismock.set(k, v);
        (redismock.hmset(k, 'f', v) instanceof Error).should.be.true;
        redismock.hmset(k, f, v, f, v, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should set new fields in the hash and return the count', function (done) {
        var k = randkey();
        var f1 = 'f1', f2 = 'f2', f3 = 'f3', f4 = 'f4', f5 = 'f5';
        var v = 'v', v1 = 'v1';
        redismock.hmset(k, f1, v, f2, v).should.equal('OK');
        redismock.hlen(k).should.equal(2);
        redismock.hget(k, f1).should.equal(v);
        redismock.hget(k, f2).should.equal(v);
        redismock.hmset(k, f3, v, f4, v, f5, v, f1, v1, function (err, reply) {
            should.not.exist(err);
            reply.should.equal('OK');
            redismock.hlen(k).should.equal(5);
            redismock.hget(k, f3).should.equal(v);
            redismock.hget(k, f4).should.equal(v);
            redismock.hget(k, f5).should.equal(v);
            redismock.hget(k, f1).should.equal(v1);
            done();
        });
    });
});

describe('hset', function () {
    it('should return an error for a key that is not a hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        redismock.set(k, v);
        (redismock.hset(k, v, 'f') instanceof Error).should.be.true;
        redismock.hset(k, v, f, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should set a new field in a hash and return 1', function (done) {
        var k = randkey();
        var f1 = 'f1', f2 = 'f2';
        var v = 'v';
        redismock.hset(k, f1, v).should.equal(1);
        redismock.hlen(k).should.equal(1);
        redismock.hget(k, f1).should.equal(v);
        redismock.hset(k, f2, v, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(1);
            redismock.hlen(k).should.equal(2);
            redismock.hget(k, f2).should.equal(v);
            done();
        });
    });
    it('should update an existing field in a hash and return 0', function (done) {
        var k = randkey();
        var f = 'f'
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        redismock.hset(k, f, v1).should.equal(1);
        redismock.hlen(k).should.equal(1);
        redismock.hget(k, f).should.equal(v1);
        redismock.hset(k, f, v2).should.equal(0);
        redismock.hlen(k).should.equal(1);
        redismock.hget(k, f).should.equal(v2);
        redismock.hset(k, f, v3, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            redismock.hlen(k).should.equal(1);
            redismock.hget(k, f).should.equal(v3);
            done();
        });
    });
});

describe('hsetnx', function () {
    it('should return an error for a key that is not a hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        redismock.set(k, v);
        (redismock.hset(k, v, 'f') instanceof Error).should.be.true;
        redismock.hset(k, v, f, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should set a new field in a hash and return 1', function (done) {
        var k = randkey();
        var f1 = 'f1', f2 = 'f2';
        var v = 'v';
        redismock.hset(k, f1, v).should.equal(1);
        redismock.hlen(k).should.equal(1);
        redismock.hget(k, f1).should.equal(v);
        redismock.hset(k, f2, v, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(1);
            redismock.hlen(k).should.equal(2);
            redismock.hget(k, f2).should.equal(v);
            done();
        });
    });
    it('should not update an existing field in a hash and return 0', function (done) {
        var k = randkey();
        var f = 'f'
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        redismock.hsetnx(k, f, v1).should.equal(1);
        redismock.hlen(k).should.equal(1);
        redismock.hget(k, f).should.equal(v1);
        redismock.hsetnx(k, f, v2).should.equal(0);
        redismock.hlen(k).should.equal(1);
        redismock.hget(k, f).should.equal(v1);
        redismock.hsetnx(k, f, v3, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            redismock.hlen(k).should.equal(1);
            redismock.hget(k, f).should.equal(v1);
            done();
        });
    });
});

describe('hvals', function () {
    it('should return an error for a key that is not a hash', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        redismock.set(k, v);
        (redismock.hvals(k) instanceof Error).should.be.true;
        redismock.hvals(k, function (err, reply) {
            should.exist(err);
            should.not.exist(reply);
            should.exist(err.message);
            err.message.indexOf('WRONGTYPE').should.be.above(-1);
            done();
        });
    });
    it('should return an empty array for a key that does not exist', function (done) {
        var k = randkey();
        var v = 'value';
        var f = 'f'
        redismock.hvals(k).should.have.lengthOf(0);
        redismock.hvals(k, function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(0);
            done();
        });
    });
    it('should return all the values in a hash', function (done) {
        var k = randkey();
        var v1 = 'v1', v2 = 'v2', v3 = 'v3';
        var f1 = 'f1', f2 = 'f2', f3 = 'f3';
        redismock.hmset(k, f1, v1, f2, v2, f3, v3);
        redismock.hvals(k).should.have.lengthOf(3);
        redismock.hvals(k, function (err, reply) {
            should.not.exist(err);
            reply.should.have.lengthOf(3);
            reply.indexOf(v1).should.be.above(-1);
            reply.indexOf(v2).should.be.above(-1);
            reply.indexOf(v3).should.be.above(-1);
            done();
        });
    });
});

describe('hscan', function () {
    xit('should hscan');
});
