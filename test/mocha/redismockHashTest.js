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

    describe('hdel', function () {
        it('should return an error for a key that is not a hash', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f'
            redismock.set(k, v);
            expect(redismock.hdel(k, f)).to.be.an.instanceof(Error);
            redismock.hdel(k, f, f, f, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return 0 for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f'
            expect(redismock.hdel(k, f)).to.equal(0);
            redismock.hdel(k, f, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return 0 if the field does not exist', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f', f1 = 'f1', f2 = 'f2';
            redismock.hset(k, f, v);
            expect(redismock.hdel(k, f1)).to.equal(0);
            redismock.hdel(k, f1, f2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return 1 when deleting a single field', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f';
            redismock.hset(k, f, v);
            expect(redismock.hdel(k, f)).to.equal(1);
            redismock.hset(k, f, v);
            redismock.hdel(k, f, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
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
            expect(redismock.hdel(k, f1, f2)).to.equal(2);
            redismock.hset(k, f1, v);
            redismock.hset(k, f2, v);
            redismock.hset(k, f3, v);
            redismock.hdel(k, f1, f2, f3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(3);
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
            expect(redismock.hexists(k, f)).to.be.an.instanceof(Error);
            redismock.hexists(k, f, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return 0 for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f'
            expect(redismock.hexists(k, f)).to.equal(0);
            redismock.hexists(k, f, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return 0 if the field does not exist in the hash', function (done) {
            var k = randkey();
            var v = 'value';
            var f1 = 'f', f2 = 'f2';
            redismock.hset(k, f1, v);
            expect(redismock.hexists(k, f2)).to.equal(0);
            redismock.hexists(k, f2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return 1 if the field does exist in the hash', function (done) {
            var k = randkey();
            var v = 'value';
            var f1 = 'f', f2 = 'f2';
            redismock.hset(k, f1, v);
            expect(redismock.hexists(k, f1)).to.equal(1);
            redismock.hset(k, f2, v);
            redismock.hexists(k, f2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
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
            expect(redismock.hget(k, f)).to.be.an.instanceof(Error);
            redismock.hget(k, f, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return nothing for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f'
            expect(redismock.hget(k, f)).to.not.exist;
            redismock.hget(k, f, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('should return nothing for a field in a key that does not exist', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f', f1 = 'f1';
            redismock.hset(k, f, v);
            expect(redismock.hget(k, f1)).to.not.exist;
            redismock.hget(k, f1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('should return the value for a field', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f';
            redismock.hset(k, f, v);
            expect(redismock.hget(k, f)).to.equal(v);
            redismock.hget(k, f, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v);
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
            expect(redismock.hgetall(k)).to.be.an.instanceof(Error);
            redismock.hgetall(k, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return an null for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f'
            redismock.hgetall(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.be.null;
                done();
            });
        });
        it('should return an object with all the keys and values in a hash', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            var f1 = 'f1', f2 = 'f2', f3 = 'f3';
            redismock.hmset(k, f1, v1, f2, v2, f3, v3);
            expect(Object.keys(redismock.hgetall(k))).to.have.lengthOf(3);
            redismock.hgetall(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.property(f1, v1)
                expect(reply).to.have.property(f2, v2)
                expect(reply).to.have.property(f3, v3)
                done();
            });
        });
    });

    describe('hincrby', function () {
        it('should return an error for a key that is not a hash', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f'
            redismock.set(k, v);
            expect(redismock.hincrby(k, f, 1)).to.be.an.instanceof(Error);
            redismock.hincrby(k, f, 2, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should set the key & field if neither exist to the increment', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f';
            expect(redismock.hincrby(k, f, 1)).to.equal(1);
            expect(redismock.hget(k, f)).to.equal(1);
            redismock.del(k);
            redismock.hincrby(k, f, -4, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(-4);
                expect(redismock.hget(k, f)).to.equal(-4);
                done();
            });
        });
        it('should return an error for a field that is not an integer', function (done) {
            var k = randkey();
            var f1 = 'f1', f2 = 'f2';
            var v1 = 'Five', v2 = 'Yo Momma';
            redismock.hmset(k, f1, v1, f2, v2);
            expect(redismock.hincrby(k, f1, 1)).to.be.an.instanceof(Error);
            expect(redismock.hget(k, f1)).to.equal(v1);
            redismock.hincrby(k, f2, -4, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('ERR')).to.be.above(-1);
                expect(redismock.hget(k, f2)).to.equal(v2);
                done();
            });
        });
        it('should incr the value at field by the given increment', function (done) {
            var k = randkey();
            var f = 'f';
            var v = 123;
            redismock.hset(k, f, v);
            expect(redismock.hincrby(k, f, 2)).to.equal(v + 2);
            expect(redismock.hget(k, f)).to.equal(v + 2);
            redismock.hincrby(k, f, -4, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v - 2);
                expect(redismock.hget(k, f)).to.equal(v - 2);
                done();
            });
        });
    });

    describe('hincrbyfloat', function () {
        it('should return an error for a key that is not a hash', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f'
            redismock.set(k, v);
            expect(redismock.hincrbyfloat(k, f, 1.1)).to.be.an.instanceof(Error);
            redismock.hincrbyfloat(k, f, 3.1415, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should set the key & field if neither exist to the increment', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f';
            expect(redismock.hincrbyfloat(k, f, 1.1)).to.equal(1.1);
            expect(redismock.hget(k, f)).to.equal(1.1);
            redismock.del(k);
            redismock.hincrbyfloat(k, f, -3.1415, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(-3.1415);
                expect(redismock.hget(k, f)).to.equal(-3.1415);
                done();
            });
        });
        it('should return an error for a field that is not an integer', function (done) {
            var k = randkey();
            var f1 = 'f1', f2 = 'f2';
            var v1 = 'Five', v2 = 'Yo Momma';
            redismock.hmset(k, f1, v1, f2, v2);
            expect(redismock.hincrbyfloat(k, f1, 1.1)).to.be.an.instanceof(Error);
            expect(redismock.hget(k, f1)).to.equal(v1);
            redismock.hincrbyfloat(k, f2, -3.1415, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('ERR')).to.be.above(-1);
                expect(redismock.hget(k, f2)).to.equal(v2);
                done();
            });
        });
        it('should incr the value at field by the given increment', function (done) {
            var k = randkey();
            var f = 'f';
            var v = 123.456;
            redismock.hset(k, f, v);
            expect(redismock.hincrbyfloat(k, f, 2.22)).to.equal(v + 2.22);
            expect(redismock.hget(k, f)).to.equal(v + 2.22);
            redismock.hincrbyfloat(k, f, -3.1415, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v + 2.22 - 3.1415);
                expect(redismock.hget(k, f)).to.equal(v + 2.22 - 3.1415);
                done();
            });
        });
    });

    describe('hkeys', function () {
        it('should return an error for a key that is not a hash', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f'
            redismock.set(k, v);
            expect(redismock.hkeys(k)).to.be.an.instanceof(Error);
            redismock.hkeys(k, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return an empty array for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f'
            expect(redismock.hkeys(k)).to.have.lengthOf(0);
            redismock.hkeys(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(0);
                done();
            });
        });
        it('should return all the keys in a hash', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            var f1 = 'f1', f2 = 'f2', f3 = 'f3';
            redismock.hmset(k, f1, v1, f2, v2, f3, v3);
            expect(redismock.hkeys(k)).to.have.lengthOf(3);
            redismock.hkeys(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(3);
                expect(reply.indexOf(f1)).to.be.above(-1);
                expect(reply.indexOf(f2)).to.be.above(-1);
                expect(reply.indexOf(f3)).to.be.above(-1);
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
            expect(redismock.hlen(k)).to.be.an.instanceof(Error);
            redismock.hlen(k, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return 0 for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f'
            expect(redismock.hlen(k)).to.equal(0);
            redismock.hlen(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return the length of the hash', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            var f1 = 'f1', f2 = 'f2', f3 = 'f3';
            redismock.hmset(k, f1, v1, f2, v2, f3, v3);
            expect(redismock.hlen(k)).to.equal(3);
            redismock.hlen(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(3);
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
            expect(redismock.hmget(k, f)).to.be.an.instanceof(Error);
            redismock.hmget(k, f, f, f, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return an empty array for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f';
            expect(redismock.hmget(k, f, f)).to.have.lengthOf(0);
            redismock.hmget(k, f, f, f, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(0);
                done();
            });
        });
        it('should return the fields in the hash, and nils when a field is not in the hash', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            var f1 = 'f1', f2 = 'f2', f3 = 'f3';
            redismock.hmset(k, f1, v1, f2, v2, f3, v3);
            expect(redismock.hmget(k, f1, f2, f3)).to.have.lengthOf(3);
            redismock.hmget(k, f1, f2, f3, f2, 'na', f2, 'na', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(7);
                expect(reply[0]).to.equal(redismock.hget(k, f1));
                expect(reply[1]).to.equal(redismock.hget(k, f2));
                expect(reply[2]).to.equal(redismock.hget(k, f3));
                expect(reply[3]).to.equal(redismock.hget(k, f2));
                expect(reply[4]).to.not.exist;
                expect(reply[5]).to.equal(redismock.hget(k, f2));
                expect(reply[6]).to.not.exist;
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
            expect(redismock.hmset(k, 'f', v)).to.be.an.instanceof(Error);
            redismock.hmset(k, f, v, f, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should set new fields in the hash and return the count', function (done) {
            var k = randkey();
            var f1 = 'f1', f2 = 'f2', f3 = 'f3', f4 = 'f4', f5 = 'f5';
            var v = 'v', v1 = 'v1';
            expect(redismock.hmset(k, f1, v, f2, v)).to.equal('OK');
            expect(redismock.hlen(k)).to.equal(2);
            expect(redismock.hget(k, f1)).to.equal(v);
            expect(redismock.hget(k, f2)).to.equal(v);
            redismock.hmset(k, f3, v, f4, v, f5, v, f1, v1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                expect(redismock.hlen(k)).to.equal(5);
                expect(redismock.hget(k, f3)).to.equal(v);
                expect(redismock.hget(k, f4)).to.equal(v);
                expect(redismock.hget(k, f5)).to.equal(v);
                expect(redismock.hget(k, f1)).to.equal(v1);
                done();
            });
        });
        it('should set new fields in the hash as object and return the count', function (done) {
            var k = randkey();
            var f1 = 'f1', f2 = 'f2', f3 = 'f3', f4 = 'f4', f5 = 'f5';
            var v = 'v', v1 = 'v1';
            var o = {}; o[f1]=v; o[f2]=v;
            expect(redismock.hmset(k, o)).to.equal('OK');
            expect(redismock.hlen(k)).to.equal(2);
            expect(redismock.hget(k, f1)).to.equal(v);
            expect(redismock.hget(k, f2)).to.equal(v);
            var o2 = {}; o2[f3]=v; o2[f4]=v; o2[f5]=v; o2[f1]=v1;
            redismock.hmset(k, o2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                expect(redismock.hlen(k)).to.equal(5);
                expect(redismock.hget(k, f3)).to.equal(v);
                expect(redismock.hget(k, f4)).to.equal(v);
                expect(redismock.hget(k, f5)).to.equal(v);
                expect(redismock.hget(k, f1)).to.equal(v1);
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
            expect(redismock.hset(k, v, 'f')).to.be.an.instanceof(Error);
            redismock.hset(k, v, f, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should set a new field in a hash and return 1', function (done) {
            var k = randkey();
            var f1 = 'f1', f2 = 'f2';
            var v = 'v';
            expect(redismock.hset(k, f1, v)).to.equal(1);
            expect(redismock.hlen(k)).to.equal(1);
            expect(redismock.hget(k, f1)).to.equal(v);
            redismock.hset(k, f2, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.hlen(k)).to.equal(2);
                expect(redismock.hget(k, f2)).to.equal(v);
                done();
            });
        });
        it('should update an existing field in a hash and return 0', function (done) {
            var k = randkey();
            var f = 'f'
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            expect(redismock.hset(k, f, v1)).to.equal(1);
            expect(redismock.hlen(k)).to.equal(1);
            expect(redismock.hget(k, f)).to.equal(v1);
            expect(redismock.hset(k, f, v2)).to.equal(0);
            expect(redismock.hlen(k)).to.equal(1);
            expect(redismock.hget(k, f)).to.equal(v2);
            redismock.hset(k, f, v3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                expect(redismock.hlen(k)).to.equal(1);
                expect(redismock.hget(k, f)).to.equal(v3);
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
            expect(redismock.hset(k, v, 'f')).to.be.an.instanceof(Error);
            redismock.hset(k, v, f, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should set a new field in a hash and return 1', function (done) {
            var k = randkey();
            var f1 = 'f1', f2 = 'f2';
            var v = 'v';
            expect(redismock.hset(k, f1, v)).to.equal(1);
            expect(redismock.hlen(k)).to.equal(1);
            expect(redismock.hget(k, f1)).to.equal(v);
            redismock.hset(k, f2, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.hlen(k)).to.equal(2);
                expect(redismock.hget(k, f2)).to.equal(v);
                done();
            });
        });
        it('should not update an existing field in a hash and return 0', function (done) {
            var k = randkey();
            var f = 'f'
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            expect(redismock.hsetnx(k, f, v1)).to.equal(1);
            expect(redismock.hlen(k)).to.equal(1);
            expect(redismock.hget(k, f)).to.equal(v1);
            expect(redismock.hsetnx(k, f, v2)).to.equal(0);
            expect(redismock.hlen(k)).to.equal(1);
            expect(redismock.hget(k, f)).to.equal(v1);
            redismock.hsetnx(k, f, v3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                expect(redismock.hlen(k)).to.equal(1);
                expect(redismock.hget(k, f)).to.equal(v1);
                done();
            });
        });
    });

    describe('hstrlen', function () {
        it('should return an error for a key that is not a hash', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f'
            redismock.set(k, v);
            expect(redismock.hstrlen(k, f)).to.be.an.instanceof(Error);
            redismock.hstrlen(k, f, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return 0 for a key or field that does not exist', function (done) {
            var k = randkey();
            var f1 = 'f1', f2 = 'f2';
            var v1 = 'v1';
            expect(redismock.hstrlen(k, f1)).to.equal(0);
            redismock.hset(k, f1, v1);
            redismock.hstrlen(k, f2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return the length of the string at field', function (done) {
            var k = randkey();
            var f1 = 'f1', f2 = 'f2';
            var v1 = 'v1', v2 = 123;
            redismock.hmset(k, f1, v1, f2, v2);
            expect(redismock.hstrlen(k, f1)).to.equal(v1.length);
            redismock.hstrlen(k, f2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal((v2.toString()).length);
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
            expect(redismock.hvals(k)).to.be.an.instanceof(Error);
            redismock.hvals(k, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return an empty array for a key that does not exist', function (done) {
            var k = randkey();
            var v = 'value';
            var f = 'f'
            expect(redismock.hvals(k)).to.have.lengthOf(0);
            redismock.hvals(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(0);
                done();
            });
        });
        it('should return all the values in a hash', function (done) {
            var k = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            var f1 = 'f1', f2 = 'f2', f3 = 'f3';
            redismock.hmset(k, f1, v1, f2, v2, f3, v3);
            expect(redismock.hvals(k)).to.have.lengthOf(3);
            redismock.hvals(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(3);
                expect(reply.indexOf(v1)).to.be.above(-1);
                expect(reply.indexOf(v2)).to.be.above(-1);
                expect(reply.indexOf(v3)).to.be.above(-1);
                done();
            });
        });
    });

    describe('hscan', function () {
        it('should return an error for a key that is not a hash', function (done) {
            var k = randkey();
            var v = 'v';
            redismock.set(k, v);
            expect(redismock.hscan(k, 0)).to.be.an.instanceof(Error);
            redismock.hscan(k, 0, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should hscan through a small set and return every element', function (done) {
            var k = randkey();
            var f1 = 'f1', f2 = 'f2', f3 = 'f3', f4 = 'f4';
            var v1 = 'v1', v2 = 'v2', v3 = 'v3', v4 = 'v4';
            redismock.hmset(k, f1, v1, f2, v2, f3, v3);
            var scan = redismock.hscan(k, 0);
            expect(scan).to.have.lengthOf(2);
            expect(scan[0]).to.equal(3);
            expect(scan[1]).to.have.lengthOf(3*2);
            expect(scan[1][0]).to.equal(f1);
            expect(scan[1][1]).to.equal(v1);
            expect(scan[1][2]).to.equal(f2);
            expect(scan[1][3]).to.equal(v2);
            expect(scan[1][4]).to.equal(f3);
            expect(scan[1][5]).to.equal(v3);
            redismock.hset(k, f4, v4);
            redismock.hscan(k, 0, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(2);
                expect(reply[0]).to.equal(4);
                expect(reply[1]).to.have.lengthOf(4*2);
                expect(reply[1][0]).to.equal(f1);
                expect(reply[1][1]).to.equal(v1);
                expect(reply[1][2]).to.equal(f2);
                expect(reply[1][3]).to.equal(v2);
                expect(reply[1][4]).to.equal(f3);
                expect(reply[1][5]).to.equal(v3);
                expect(reply[1][6]).to.equal(f4);
                expect(reply[1][7]).to.equal(v4);
                done();
            });
        });
        it('should hscan through a large set with cursoring', function (done) {
            var k = randkey();
            var hashes = [];
            for (var idx = 0; idx < 62; idx += 1) {
                hashes.push(idx.toString());
                hashes.push(idx.toString());
            }
            redismock.hmset.apply(redismock, [k].concat(hashes));
            var scan, cursor = 0, scanned = [];
            while (true) {
                scan = redismock.hscan(k, cursor);
                if (scan instanceof Error) {
                    return done(scan);
                }
                if (!scan[1] || !scan[1].length) {
                    break;
                }
                scanned = scanned.concat(scan[1]);
                cursor = scan[0];
            }
            expect(scanned).to.have.lengthOf(hashes.length);
            expect(hashes.every(function (i) {
                return scanned.indexOf(i) !== -1;
            })).to.be.true;
            scan = redismock.hscan(k, cursor);
            expect(scan[1]).to.have.lengthOf(0);
            scanned = [];
            var f;
            f = function (cursor, callback) {
                redismock.hscan(k, cursor, function (err, reply) {
                    if (err) {
                        return callback(err);
                    }
                    if (!reply[1] || !reply[1].length) {
                        expect(scanned).to.have.lengthOf(hashes.length);
                        expect(hashes.every(function (i) {
                            return scanned.indexOf(i) !== -1;
                        })).to.be.true; 
                        return callback();
                    }
                    scanned = scanned.concat(reply[1]);
                    f(reply[0], callback);
                });
            };
            f(0, done);
        });
        it('should hscan through a large set with cursoring and a count', function (done) {
            var k = randkey();
            var set = [];
            for (var idx = 0; idx < 62; idx += 1) {
                set.push(idx.toString());
                set.push(idx.toString());
            }
            redismock.hmset.apply(redismock, [k].concat(set));
            var scan, cursor = 0, scanned = [], count = 5;
            while (true) {
                scan = redismock.hscan(k, cursor, 'count', count);
                if (scan instanceof Error) {
                    return done(scan);
                }
                if (!scan[1] || !scan[1].length) {
                    break;
                }
                scanned = scanned.concat(scan[1]);
                cursor = scan[0];
            }
            expect(scanned).to.have.lengthOf(set.length);
            expect(set.every(function (i) {
                return scanned.indexOf(i) !== -1;
            })).to.be.true;
            scan = redismock.hscan(k, cursor, 'count', count);
            expect(scan[1]).to.have.lengthOf(0);
            scanned = [];
            var f;
            f = function (cursor, count, callback) {
                redismock.hscan(k, cursor, 'count', count, function (err, reply) {
                    if (err) {
                        return callback(err);
                    }
                    if (!reply[1] || !reply[1].length) {
                        expect(scanned).to.have.lengthOf(set.length);
                        expect(set.every(function (i) {
                            return scanned.indexOf(i) !== -1;
                        })).to.be.true; 
                        return callback();
                    }
                    scanned = scanned.concat(reply[1]);
                    f(reply[0], count, callback);
                });
            };
            f(0, 6, done);
        });
        it('should hscan through a large set with cursoring and a match', function (done) {
            var k = randkey();
            var set = [];
            for (var idx = 0; idx < 62; idx += 1) {
                set.push(idx.toString());
                set.push(idx.toString());
            }
            redismock.hmset.apply(redismock, [k].concat(set));
            var scan, cursor = 0, scanned = [], match = '[0-9]'; // All single digit #s
            while (true) {
                scan = redismock.hscan(k, cursor, 'match', match);
                if (scan instanceof Error) {
                    return done(scan);
                }
                if (!scan[1] || !scan[1].length) {
                    break;
                }
                scanned = scanned.concat(scan[1]);
                cursor = scan[0];
            }
            expect(scanned).to.have.lengthOf(10*2);
            expect(scanned.every(function (i) {
                return i.toString().length === 1 && set.indexOf(i) !== -1;
            })).to.be.true;
            scan = redismock.hscan(k, cursor, 'match', match);
            expect(scan[1]).to.have.lengthOf(0);
            scanned = [];
            var f;
            f = function (cursor, match, callback) {
                redismock.hscan(k, cursor, 'match', match, function (err, reply) {
                    if (err) {
                        return callback(err);
                    }
                    if (!reply[1] || !reply[1].length) {
                        expect(scanned).to.have.lengthOf(52*2);
                        expect(scanned.every(function (i) {
                            return i.toString().length === 2 && set.indexOf(i) !== -1;
                        })).to.be.true; 
                        return callback();
                    }
                    scanned = scanned.concat(reply[1]);
                    f(reply[0], match, callback);
                });
            };
            f(0, '[0-9]?', done); // All two digit numbers
        });
        it('should sscan through a large set with cursoring, a count, and a match', function (done) {
            var k = randkey();
            var set = [];
            for (var idx = 0; idx < 62; idx += 1) {
                set.push(idx.toString());
                set.push(idx.toString());
            }
            redismock.hmset.apply(redismock, [k].concat(set));
            var scan, cursor = 0, scanned = [], count = 4, match = '[0-9]'; // All single digit #s
            while (true) {
                scan = redismock.hscan(k, cursor, 'count', count, 'match', match);
                if (scan instanceof Error) {
                    return done(scan);
                }
                if (!scan[1] || !scan[1].length) {
                    break;
                }
                scanned = scanned.concat(scan[1]);
                cursor = scan[0];
            }
            expect(scanned).to.have.lengthOf(10*2);
            expect(scanned.every(function (i) {
                return i.toString().length === 1 && set.indexOf(i) !== -1;
            })).to.be.true;
            scan = redismock.hscan(k, cursor, 'match', match);
            expect(scan[1]).to.have.lengthOf(0);
            scanned = [];
            var f;
            f = function (cursor, count, match, callback) {
                redismock.hscan(k, cursor, 'count', count, 'match', match, function (err, reply) {
                    if (err) {
                        return callback(err);
                    }
                    if (!reply[1] || !reply[1].length) {
                        expect(scanned).to.have.lengthOf(52*2);
                        expect(scanned.every(function (i) {
                            return i.toString().length === 2 && set.indexOf(i) !== -1;
                        })).to.be.true; 
                        return callback();
                    }
                    scanned = scanned.concat(reply[1]);
                    f(reply[0], count, match, callback);
                });
            };
            f(0, 7, '[0-9]?', done); // All two digit numbers
        });
    });
}).call(this);
