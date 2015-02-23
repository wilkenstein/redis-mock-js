var redismock = require('../../redis-mock.js');
var should = require('should');

function randkey(prefix) {
    if (!prefix) {
        prefix = 'k';
    }
    return prefix + Math.random();
}

describe('append', function () {
    xit('should append');
});

describe('bitcount', function () {
    xit('should bitcount');
});

describe('bitop', function () {
    xit('should bitop');
});

describe('bitpos', function () {
    xit('should bitpos');
});

describe('decr', function () {
    xit('should decr');
});

describe('decrby', function () {
    xit('should decrby');
});

describe('get', function () {
    it('should return nothing for a key that does not exist', function (done) {
        should.not.exist(redismock.get(randkey()));
        redismock.get(randkey(), function (err, reply) {
            should.not.exist(err);
            should.not.exist(reply);
            done();
        });
    });
    it('should return the value for an existing key', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.set(k, v);
        redismock.get(k).should.equal(v);
        redismock.get(k, function (err, reply) {
            should.not.exist(err);
            should.exist(reply);
            reply.should.equal(v);
            done();
        });
    });
    it('should not return the value for a key that does not map to a string', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.lpush(k, v);
        should.not.exist(redismock.get(k));
        redismock.get(k, function (err, reply) {
            should.not.exist(err);
            should.not.exist(reply);
            done();
        });
    });
});

describe('getbit', function () {
    xit('should getbit');
});

describe('getrange', function () {
    xit('should getrange');
});

describe('getset', function () {
    it('should return nothing for a key that did not exist and set the key', function (done) {
        var k1 = randkey(), k2 = randkey();
        var v = 'value';
        should.not.exist(redismock.getset(k1, v));
        redismock.exists(k1).should.be.true;
        redismock.type(k1).should.equal('string');
        redismock.getset(k2, v, function (err, reply) {
            should.not.exist(err);
            should.not.exist(reply);
            redismock.exists(k2).should.be.true;
            redismock.type(k2).should.equal('string');
            done();
        });
    });
    it('should return the previous value for an existing key', function (done) {
        var k = randkey();
        var v1 = 'value', v2 = 'value2', v3 = 'value3';
        redismock.set(k, v1);
        redismock.getset(k, v2).should.equal(v1);
        redismock.getset(k, v3, function (err, reply) {
            should.not.exist(err);
            should.exist(reply);
            reply.should.equal(v2);
            redismock.exists(k).should.be.true;
            redismock.get(k).should.equal(v3);
            done();
        });
    });
    it('should not return a previous value for a key that did not map to a string', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.lpush(k, v);
        should.not.exist(redismock.getset(k, v));
        redismock.get(k).should.equal(v);
        redismock.del(k);
        redismock.lpush(k, v);
        redismock.getset(k, v, function (err, reply) {
            should.not.exist(err);
            should.not.exist(reply);
            redismock.get(k).should.equal(v);
            done();
        });
    });
});

describe('incr', function () {
    xit('should incr');
});

describe('incrby', function () {
    xit('should incrby');
});

describe('incrbyfloat', function () {
    xit('should incrbyfloat');
});

describe('mget', function () {
    xit('should mget');
});

describe('mset', function () {
    xit('should mset');
});

describe('msetnx', function () {
    xit('should msetnx');
});

describe('psetex', function () {
    it('should set and expire a key in milliseconds', function (done) {
        this.timeout(5000);
        var k = randkey();
        var v = 'value';
        redismock.psetex(k, 1500, v);
        redismock.get(k).should.equal(v);
        setTimeout(function () {
            redismock.get(k).should.equal(v);
        }, 800);
        setTimeout(function () {
            redismock.exists(k).should.be.false;
            done();
        }, 1700);
    });
    xit('should override a previous mapping with the new key-value mapping');
});

describe('set', function () {
    it('should set a key', function (done) {
        var k1 = randkey(), k2 = randkey();
        var v = 'value';
        redismock.set(k1, v).should.equal('OK');
        redismock.exists(k1).should.be.true;
        redismock.get(k1).should.equal(v);
        redismock.set(k2, v, function (err, reply) {
            should.not.exist(err);
            should.exist(reply);
            reply.should.equal('OK');
            redismock.exists(k2).should.be.true;
            redismock.get(k2).should.equal(v);
            done();
        });
    });
    it('should override a previous mapping with the new key-value mapping', function (done) {
        var k1 = randkey(), k2 = randkey();
        var v = 'value';
        redismock.lpush(k1, v);
        redismock.set(k1, v).should.equal('OK');
        redismock.exists(k1).should.be.true;
        redismock.get(k1).should.equal(v);
        redismock.sadd(k2, v);
        redismock.set(k2, v, function (err, reply) {
            should.not.exist(err);
            should.exist(reply);
            reply.should.equal('OK');
            redismock.exists(k2).should.be.true;
            redismock.get(k2).should.equal(v);
            done();
        });
    });
});

describe('setbit', function () {
    xit('should setbit');
});

describe('setex', function () {
    it('should set and expire a key in seconds', function (done) {
        this.timeout(5000);
        var k = randkey();
        var v = 'value';
        redismock.setex(k, 1, v);
        redismock.get(k).should.equal(v);
        setTimeout(function () {
            redismock.get(k).should.equal(v);
        }, 500);
        setTimeout(function () {
            redismock.exists(k).should.be.false;
            done();
        }, 1200);
    });
    xit('should override a previous mapping with the new key-value mapping');
});

describe('setnx', function () {
    it('should set a key if the key does not exist', function (done) {
        var k1 = randkey(), k2 = randkey();
        var v = 'value';
        redismock.setnx(k1, v).should.equal(1);
        redismock.exists(k1).should.be.true;
        redismock.get(k1).should.equal(v);
        redismock.setnx(k2, v, function (err, reply) {
            should.not.exist(err);
            should.exist(reply);
            reply.should.equal(1);
            redismock.exists(k2).should.be.true;
            redismock.get(k2).should.equal(v);
            done();
        });
    });
    it('should not set a key if the key exists', function (done) {
        var k1 = randkey(), k2 = randkey();
        var v = 'value';
        redismock.set(k1, v).should.equal('OK');
        redismock.setnx(k1, v).should.equal(0);
        redismock.lpush(k2, v);
        redismock.setnx(k2, v, function (err, reply) {
            should.not.exist(err);
            should.exist(reply);
            reply.should.equal(0);
            done();
        });
    });
});

describe('setrange', function () {
    xit('should setrange');
});

describe('strlen', function () {
    it('should return 0 for a key that does not exist', function (done) {
        redismock.strlen(randkey()).should.equal(0);
        redismock.strlen(randkey(), function (err, reply) {
            should.not.exist(err);
            reply.should.equal(0);
            done();
        });
    });
    it('should return the length for a key that exists', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.set(k, v);
        redismock.strlen(k).should.equal(v.length);
        redismock.strlen(k, function (err, reply) {
            should.not.exist(err);
            reply.should.equal(v.length);
            done();
        });
    });
    it('should return an error for a key that is not a string', function (done) {
        var k = randkey();
        var v = 'value';
        redismock.lpush(k, v);
        (redismock.strlen(k) instanceof Error).should.equal(true);
        redismock.strlen(k, function (err, reply) {
            should.exist(err);
            should.exist(err.message);
            should.not.exist(reply);
            done();
        });
    });
});
