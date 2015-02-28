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
        it('to return nothing for a key that does not exist', function (done) {
            expect(redismock.get(randkey())).to.not.exist;
            redismock.get(randkey(), function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('to return the value for an existing key', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.get(k)).to.equal(v);
            redismock.get(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v);
                done();
            });
        });
        it('to not return the value for a key that does not map to a string', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v);
            expect(redismock.get(k)).to.not.exist;
            redismock.get(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
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
        it('to return nothing for a key that did not exist and set the key', function (done) {
            var k1 = randkey(), k2 = randkey();
            var v = 'value';
            expect(redismock.getset(k1, v)).to.not.exist;
            expect(redismock.exists(k1)).to.be.ok;
            expect(redismock.type(k1)).to.equal('string');
            redismock.getset(k2, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                expect(redismock.exists(k2)).to.be.ok;
                expect(redismock.type(k2)).to.equal('string');
                done();
            });
        });
        it('to return the previous value for an existing key', function (done) {
            var k = randkey();
            var v1 = 'value', v2 = 'value2', v3 = 'value3';
            redismock.set(k, v1);
            expect(redismock.getset(k, v2)).to.equal(v1);
            redismock.getset(k, v3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v2);
                expect(redismock.exists(k)).to.be.ok;
                expect(redismock.get(k)).to.equal(v3);
                done();
            });
        });
        it('to not return a previous value for a key that did not map to a string', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v);
            expect(redismock.getset(k, v)).to.not.exist;
            expect(redismock.get(k)).to.equal(v);
            redismock.del(k);
            redismock.lpush(k, v);
            redismock.getset(k, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                expect(redismock.get(k)).to.equal(v);
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
            expect(redismock.get(k)).to.equal(v);
            setTimeout(function () {
                expect(redismock.get(k)).to.equal(v);
            }, 800);
            setTimeout(function () {
                expect(redismock.exists(k)).to.be.not.ok;
                done();
            }, 1700);
        });
        xit('to override a previous mapping with the new key-value mapping');
    });

    describe('set', function () {
        it('to set a key', function (done) {
            var k1 = randkey(), k2 = randkey();
            var v = 'value';
            expect(redismock.set(k1, v)).to.equal('OK');
            expect(redismock.exists(k1)).to.be.ok;
            expect(redismock.get(k1)).to.equal(v);
            redismock.set(k2, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                expect(redismock.exists(k2)).to.be.ok;
                expect(redismock.get(k2)).to.equal(v);
                done();
            });
        });
        it('to override a previous mapping with the new key-value mapping', function (done) {
            var k1 = randkey(), k2 = randkey();
            var v = 'value';
            redismock.lpush(k1, v);
            expect(redismock.set(k1, v)).to.equal('OK');
            expect(redismock.exists(k1)).to.be.ok;
            expect(redismock.get(k1)).to.equal(v);
            redismock.sadd(k2, v);
            redismock.set(k2, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                expect(redismock.exists(k2)).to.be.ok;
                expect(redismock.get(k2)).to.equal(v);
                done();
            });
        });
        it('to not set a key if the key exists and the nx option is given', function (done) {
            var k = randkey();
            var v = 'value', nv = 'nvalue';
            redismock.set(k, v);
            expect(redismock.get(k, v)).to.equal(v);
            expect(redismock.set(k, nv, 'nx')).to.not.exist;
            expect(redismock.get(k, v)).to.equal(v);
            redismock.set(k, nv, 'nx', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                expect(redismock.get(k, v)).to.equal(v);
                done();
            });
        });
        it('to set a key if the key does not exist and the nx option is given', function (done) {
            var k = randkey(), k2 = randkey();
            var v = 'value', v2 = 'v2';
            expect(redismock.set(k, v, 'nx')).to.equal('OK');
            expect(redismock.get(k)).to.equal(v);
            redismock.set(k2, v2, 'nx', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                expect(redismock.get(k2)).to.equal(v2);
                done();
            });
        });
        it('to not set a key if the key does not exist and the xx option is given', function (done) {
            var k = randkey();
            var v = 'value';
            expect(redismock.set(k, v, 'xx')).to.not.exist;
            redismock.set(k, v, 'xx', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('to set a key if the key does exist and the xx option is given', function (done) {
            var k = randkey();
            var v = 'value', v2 = 'v2';
            redismock.set(k, v);
            expect(redismock.set(k, v, 'xx')).to.equal('OK');
            expect(redismock.get(k)).to.equal(v);
            redismock.set(k, v2, 'xx', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                expect(redismock.get(k)).to.equal(v2);
                done();
            });
        });
        it('to set and expire a key in seconds if the px key is given', function (done) {
            this.timeout(5000);
            var k = randkey();
            var v = 'value';
            expect(redismock.set(k, v, 'px', 1500)).to.equal('OK');
            setTimeout(function () {
                expect(redismock.get(k)).to.equal(v);
            }, 600);
            setTimeout(function () {
                expect(redismock.exists(k)).to.equal(0);
                done();
            }, 1800);
        });
        it('to set and expire a key in milliseconds if the px option is given', function (done) {
            this.timeout(5000);
            var k = randkey();
            var v = 'value';
            expect(redismock.set(k, v, 'ex', 1)).to.equal('OK');
            setTimeout(function () {
                expect(redismock.get(k)).to.equal(v);
            }, 600);
            setTimeout(function () {
                expect(redismock.exists(k)).to.equal(0);
                done();
            }, 1200);
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
            expect(redismock.get(k)).to.equal(v);
            setTimeout(function () {
                expect(redismock.get(k)).to.equal(v);
            }, 500);
            setTimeout(function () {
                expect(redismock.exists(k)).to.not.be.ok;
                done();
            }, 1200);
        });
        xit('to override a previous mapping with the new key-value mapping');
    });

    describe('setnx', function () {
        it('to set a key if the key does not exist', function (done) {
            var k1 = randkey(), k2 = randkey();
            var v = 'value';
            expect(redismock.setnx(k1, v)).to.equal(1);
            expect(redismock.exists(k1)).to.be.ok;
            expect(redismock.get(k1)).to.equal(v);
            redismock.setnx(k2, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.exists(k2)).to.be.ok;
                expect(redismock.get(k2)).to.equal(v);
                done();
            });
        });
        it('to not set a key if the key exists', function (done) {
            var k1 = randkey(), k2 = randkey();
            var v = 'value';
            expect(redismock.set(k1, v)).to.equal('OK');
            expect(redismock.setnx(k1, v)).to.equal(0);
            redismock.lpush(k2, v);
            redismock.setnx(k2, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
    });

    describe('setrange', function () {
        xit('should setrange');
    });

    describe('strlen', function () {
        it('to return 0 for a key that does not exist', function (done) {
            expect(redismock.strlen(randkey())).to.equal(0);
            redismock.strlen(randkey(), function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('to return the length for a key that exists', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.strlen(k)).to.equal(v.length);
            redismock.strlen(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v.length);
                done();
            });
        });
        it('to return an error for a key that is not a string', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v);
            expect(redismock.strlen(k)).to.be.an.instanceof(Error);
            redismock.strlen(k, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
    });
}).call(this);