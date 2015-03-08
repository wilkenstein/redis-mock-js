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
        it('should return an error for a key that does not map to string', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v);
            expect(redismock.append(k, v)).to.be.an.instanceof(Error);
            redismock.append(k, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should create the key if it does not already exist', function (done) {
            var k = randkey(), k2 = randkey();
            var v = 'v', v2 = 'value2';
            expect(redismock.append(k, v)).to.equal(v.length);
            redismock.append(k2, v2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v2.length);
                done();
            });
        });
        it('should append to the key if it exists', function (done) {
            var k = randkey();
            var v = 'v', v1 = 'v1', v2 = 'v2';
            redismock.set(k, v);
            expect(redismock.append(k, v1)).to.equal(v.length + v1.length);
            expect(redismock.get(k)).to.equal(v + v1);
            redismock.append(k, v2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v.length + v1.length + v2.length);
                expect(redismock.get(k)).to.equal(v + v1 + v2);
                done();
            });
        });
    });

    describe('bitcount', function () {
        it('should return an error for a key that does not map to string', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v);
            expect(redismock.bitcount(k)).to.be.an.instanceof(Error);
            redismock.bitcount(k, 2, 3, function (err, reply) {
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
            expect(redismock.bitcount(k)).to.equal(0);
            redismock.bitcount(k, 2, 3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return the bitcount for a key', function (done) {
            var k = randkey();
            var v0 = '000', v1 = '111', v2 = '34?';
            var b0 = 2*3, b1 = 3*3, b2 = 4 + 3 + 6;
            redismock.set(k, v0);
            expect(redismock.bitcount(k)).to.equal(b0);
            redismock.set(k, v1);
            expect(redismock.bitcount(k)).to.equal(b1);
            redismock.set(k, v2);
            redismock.bitcount(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(b2);
                done();
            });
        });
        it('should return the bitcount for a key in a given range', function (done) {
            var k = randkey();
            var v0 = '000', v1 = '111', v2 = '34?';
            var b0 = 2*3, b1 = 3*3, b2 = 4 + 3 + 6;
            redismock.set(k, v0);
            expect(redismock.bitcount(k, 0, 0)).to.equal(2);
            expect(redismock.bitcount(k, 1, 1)).to.equal(2);
            expect(redismock.bitcount(k, 2, 2)).to.equal(2);
            expect(redismock.bitcount(k, 0, 1)).to.equal(2*2);
            expect(redismock.bitcount(k, 1, 2)).to.equal(2*2);
            expect(redismock.bitcount(k, 2, 3)).to.equal(2);
            expect(redismock.bitcount(k, 0, 2)).to.equal(b0);
            expect(redismock.bitcount(k, 0, 5)).to.equal(b0);
            redismock.set(k, v2);
            expect(redismock.bitcount(k, 0, 0)).to.equal(4);
            expect(redismock.bitcount(k, 1, 1)).to.equal(3);
            expect(redismock.bitcount(k, 2, 2)).to.equal(6);
            expect(redismock.bitcount(k, 0, 1)).to.equal(4 + 3);
            expect(redismock.bitcount(k, 1, 2)).to.equal(3 + 6);
            expect(redismock.bitcount(k, 0, 2)).to.equal(b2);
            redismock.bitcount(k, 0, 5, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(b2);
                done();
            });
        });
        xit('should return the bitcount for a key in a given range with negative indices');
    });

    describe('bitop', function () {
        it('should return an error for a key that does not map to string', function (done) {
            var dk = randkey(), k1 = randkey(), k2 = randkey();
            var v = 'value';
            redismock.lpush(k2, v);
            expect(redismock.bitop('and', dk, k1, k2)).to.be.an.instanceof(Error);
            redismock.bitop('or', dk, k2, k1, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return 0 if none of the keys exist', function (done) {
            var dk = randkey(), k1 = randkey(), k2 = randkey();
            var v = 'value';
            expect(redismock.bitop('and', dk, k1, k2)).to.equal(0);
            expect(redismock.get(dk)).to.equal('');
            redismock.bitop('or', dk, k2, k1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                expect(redismock.get(dk)).to.equal('');
                done();
            });
        });
        it('should do an AND operation against strings, store the result, and return the string length', function (done) {
            var dk = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey();
            var v1 = '111', v2 = '222', v3 = '333';
            redismock.mset(k1, v1, k2, v2, k3, v3);
            expect(redismock.bitop('and', dk, k1, k2)).to.equal(3);
            expect(redismock.get(dk)).to.equal('000');
            redismock.bitop('and', dk, k2, k3, k1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(3);
                expect(redismock.get(dk)).to.equal('000');
                done();
            });
        });
        it('should do an OR operation against strings, store the result, and return the string length', function (done) {
            var dk = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey();
            var v1 = '111', v2 = '222', v3 = '333';
            redismock.mset(k1, v1, k2, v2, k3, v3);
            expect(redismock.bitop('or', dk, k1, k2)).to.equal(3);
            expect(redismock.get(dk)).to.equal('333');
            redismock.bitop('or', dk, k2, k1, k3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(3);
                expect(redismock.get(dk)).to.equal('333');
                done();
            });
        });
        it('should do an XOR operation against strings, store the result, and return the string length', function (done) {
            var dk = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey();
            var v1 = '111', v2 = '222', v3 = '333';
            redismock.mset(k1, v1, k2, v2, k3, v3);
            expect(redismock.bitop('xor', dk, k1, k2)).to.equal(3);
            expect(redismock.get(dk)).to.equal('\3\3\3');
            redismock.bitop('xor', dk, k2, k1, k3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(3);
                expect(redismock.get(dk)).to.equal('000');
                done();
            });
        });
        it('should do a NOT operation against a string, store the result, and return the string length', function (done) {
            var dk = randkey(), k1 = randkey();
            var v1 = '123', v2 = '321';
            redismock.set(k1, v1);
            expect(redismock.bitop('not', dk, k1)).to.equal(3);
            var gdk = redismock.get(dk);
            expect(gdk.charCodeAt(0)).to.equal(65536 - 50);
            expect(gdk.charCodeAt(1)).to.equal(65536 - 51);
            expect(gdk.charCodeAt(2)).to.equal(65536 - 52);
            redismock.set(k1, v2);
            redismock.bitop('not', dk, k1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(3);
                var gdk = redismock.get(dk);
                expect(gdk.charCodeAt(2)).to.equal(65536 - 50);
                expect(gdk.charCodeAt(1)).to.equal(65536 - 51);
                expect(gdk.charCodeAt(0)).to.equal(65536 - 52);
                done();
            });
        });
        it('should do a NOT operation against only the first string regardless of how many keys are given', function (done) {
            var dk = randkey(), k1 = randkey(), k2 = randkey(), k3 = randkey();
            var v1 = '123', v2 = '321', v3 = '213';
            redismock.mset(k1, v1, k2, v2, k3, v3);
            expect(redismock.bitop('not', dk, k1, k2, k3)).to.equal(3);
            var gdk = redismock.get(dk);
            expect(gdk.charCodeAt(0)).to.equal(65536 - 50);
            expect(gdk.charCodeAt(1)).to.equal(65536 - 51);
            expect(gdk.charCodeAt(2)).to.equal(65536 - 52);
            redismock.bitop('not', dk, k2, k3, k1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(3);
                var gdk = redismock.get(dk);
                expect(gdk.charCodeAt(2)).to.equal(65536 - 50);
                expect(gdk.charCodeAt(1)).to.equal(65536 - 51);
                expect(gdk.charCodeAt(0)).to.equal(65536 - 52);
                done();
            });
        });
        xit('should zero-pad out differently-lengthed strings', function (done) {
        });
        xit('should zero-pad non-existent keys out', function (done) {
        });
    });

    describe('bitpos', function () {
        it('should return an error for a key that does not map to string', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v);
            expect(redismock.bitpos(k, 0)).to.be.an.instanceof(Error);
            redismock.bitpos(k, 1, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return -1 for a key that does not exist and set bit is specified', function (done) {
            var k = randkey();
            expect(redismock.bitpos(k, 1)).to.equal(-1);
            redismock.bitpos(k, 1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(-1);
                done();
            });
        });
        it('should return 0 for a key that does not exist and clear bit is specified', function (done) {
            var k = randkey();
            expect(redismock.bitpos(k, 0)).to.equal(0);
            redismock.bitpos(k, 0, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return off the end for a key that is all 1s and clear bit is specified', function (done) {
            var k = randkey();
            var v = String.fromCharCode(0xFF);
            v += v;
            redismock.set(k, v);
            expect(redismock.bitpos(k, 0)).to.equal(8);
            redismock.bitpos(k, 0, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(8);
                done();
            });
        });
        it('should return -1 for a key that is all 0s and set bit is specified', function (done) {
            var k = randkey();
            var v = '\0\0';
            redismock.set(k, v);
            expect(redismock.bitpos(k, 1)).to.equal(-1);
            redismock.bitpos(k, 1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(-1);
                done();
            });
        });
        it('should return off the end for a key that is all 1s, clear bit is specified, and only start is specified', function (done) {
            var k = randkey();
            var v = String.fromCharCode(0xFF);
            v  = v + v + v;
            redismock.set(k, v);
            expect(redismock.bitpos(k, 0, 1)).to.equal(16);
            redismock.bitpos(k, 0, 2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(16);
                done();
            });
        });
        it('should return -1 for a key that is all 1s, clear bit is specified, and start and end are both specified', function (done) {
            var k = randkey();
            var v = String.fromCharCode(0xFF);
            v = v + v + v + v;
            redismock.set(k, v);
            expect(redismock.bitpos(k, 0, 1, 2)).to.equal(-1);
            redismock.bitpos(k, 0, 1, 2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(-1);
                done();
            });
        });
        xit('should return -1 for a key that is all 0s, set bit is specified, and start is specified', function (done) {
        });
        xit('should return -1 for a key that is all 0s, set bit is specified, and start and end are both specified', function (done) {
});
        xit('should return the first 0 position for a key with clear bit specified', function (done) {
        });
        xit('should return the first 0 position for a key with clear bit specified from start', function (done) {
        });
        xit('should return the first 0 position for a key with clear bit specified between start and end', function (done) {
        });
        xit('should return the first 1 position for a key with set bit specified', function (done) {
        });
        xit('should return the first 1 position for a key with set bit specified from start', function (done) {
        });
        xit('should return the first 1 position for a key with set bit specified between start and end', function (done) {
        });
    });

    describe('decr', function () {
        it('should return an error for a key that does not map to string', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v);
            expect(redismock.decr(k)).to.be.an.instanceof(Error);
            redismock.decr(k, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return an error for a key that is not an integer', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.decr(k)).to.be.an.instanceof(Error);
            redismock.decr(k, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('ERR')).to.be.above(-1);
                done();
            });
        });
        it('should initialize the key with 0 if it does not exist, then decr', function (done) {
            var k = randkey();
            expect(redismock.decr(k)).to.equal(-1);
            redismock.del(k);
            redismock.decr(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(-1);
                done();
            });
        });
        it('should decr an integer key by 1', function (done) {
            var k = randkey();
            var v = 123;
            redismock.set(k, v);
            expect(redismock.decr(k)).to.equal(v - 1);
            redismock.decr(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v - 2);
                done();
            });
        });
    });

    describe('decrby', function () {
        it('should return an error for a key that does not map to string', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v);
            expect(redismock.decrby(k, 4)).to.be.an.instanceof(Error);
            redismock.decrby(k, 13, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return an error for a key that is not an integer', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.decrby(k, 4)).to.be.an.instanceof(Error);
            redismock.decrby(k, 13, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('ERR')).to.be.above(-1);
                done();
            });
        });
        it('should initialize the key with 0 if it does not exist, then decrby', function (done) {
            var k = randkey();
            expect(redismock.decrby(k, 4)).to.equal(-4);
            redismock.del(k);
            redismock.decrby(k, 13, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(-13);
                done();
            });
        });
        it('should decr an integer key by the decrement', function (done) {
            var k = randkey();
            var v = 123;
            redismock.set(k, v);
            expect(redismock.decrby(k, 4)).to.equal(v - 4);
            redismock.decrby(k, 13, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v - 4 - 13);
                done();
            });
        });
    });

    describe('get', function () {
        it('should return nothing for a key that does not exist', function (done) {
            expect(redismock.get(randkey())).to.not.exist;
            redismock.get(randkey(), function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('should return the value for an existing key', function (done) {
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
        it('should not return the value for a key that does not map to a string', function (done) {
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
        it('should return an error for a key that does not map to string', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v);
            expect(redismock.getbit(k, 0)).to.be.an.instanceof(Error);
            redismock.getbit(k, 9, function (err, reply) {
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
            expect(redismock.getbit(k, 0)).to.equal(0);
            redismock.getbit(k, 9, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return 0 for a offset out of bounds', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.getbit(k, v.length*8 + 1)).to.equal(0);
            redismock.getbit(k, v.length*8 + 10, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return the bit at the offset', function (done) {
            var k = randkey();
            var v = '12?';
            redismock.set(k, v);
            expect(redismock.getbit(k, 0)).to.equal(1);
            expect(redismock.getbit(k, 1)).to.equal(0);
            expect(redismock.getbit(k, 2)).to.equal(0);
            expect(redismock.getbit(k, 3)).to.equal(0);
            expect(redismock.getbit(k, 4)).to.equal(1);
            expect(redismock.getbit(k, 5)).to.equal(1);
            expect(redismock.getbit(k, 6)).to.equal(0);
            expect(redismock.getbit(k, 7)).to.equal(0);
            expect(redismock.getbit(k, 8)).to.equal(0);
            expect(redismock.getbit(k, 9)).to.equal(1);
            expect(redismock.getbit(k, 10)).to.equal(0);
            expect(redismock.getbit(k, 11)).to.equal(0);
            expect(redismock.getbit(k, 12)).to.equal(1);
            expect(redismock.getbit(k, 13)).to.equal(1);
            expect(redismock.getbit(k, 14)).to.equal(0);
            expect(redismock.getbit(k, 15)).to.equal(0);
            expect(redismock.getbit(k, 16)).to.equal(1);
            expect(redismock.getbit(k, 17)).to.equal(1);
            expect(redismock.getbit(k, 18)).to.equal(1);
            redismock.getbit(k, 19, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.getbit(k, 20)).to.equal(1);
                expect(redismock.getbit(k, 21)).to.equal(1);
                expect(redismock.getbit(k, 23)).to.equal(0);
                expect(redismock.getbit(k, 24)).to.equal(0);
                expect(redismock.getbit(k, 25)).to.equal(0);
                done();
            });
        });
    });

    describe('getrange', function () {
        it('should return an error for a key that does not map to string', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v);
            expect(redismock.getrange(k, 0, -1)).to.be.an.instanceof(Error);
            redismock.getrange(k, 1, 2, function (err, reply) {
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
            expect(redismock.getrange(k, 0, -1)).to.equal('');
            redismock.getrange(k, 1, 2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal("");
                done();
            });
        });
        it('should return an empty string for out-of-range positive indices', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.getrange(k, 5, 10)).to.equal('');
            expect(redismock.getrange(k, 10, 2)).to.equal('');
            redismock.getrange(k, 100, 200, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal("");
                done();
            });
        });
        xit('should return an empty string for out-of-range negative indices', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.getrange(k, -10, -5)).to.equal('');
            expect(redismock.getrange(k, -2, -10)).to.equal('');
            redismock.getrange(k, -200, -100, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal("");
                done();
            });
        });
        xit('should return an empty string for out-of-range mixed indices', function (done) {
        });
        it('should return the range for in-range positive indices', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.getrange(k, 0, v.length - 1)).to.equal(v);
            redismock.getrange(k, 1, 3, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v.substr(1, 3));
                done();
            });
        });
        it('should return the range for in-range negative indices', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.getrange(k, -5, -1)).to.equal(v);
            redismock.getrange(k, -4, -2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v.substr(1, 3));
                done();
            });
        });
        it('should return the range for in-range mixed indices', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.getrange(k, 0, -1)).to.equal(v);
            redismock.getrange(k, 1, -2, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v.substr(1, 3));
                done();
            });
        });
    });

    describe('getset', function () {
        it('should return nothing for a key that did not exist and set the key', function (done) {
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
        it('should return the previous value for an existing key', function (done) {
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
        it('should not return a previous value for a key that did not map to a string', function (done) {
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
        it('should return an error for a key that does not map to string', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v);
            expect(redismock.incr(k)).to.be.an.instanceof(Error);
            redismock.incr(k, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return an error for a key that is not an integer', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.incr(k)).to.be.an.instanceof(Error);
            redismock.incr(k, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('ERR')).to.be.above(-1);
                done();
            });
        });
        it('should initialize the key with 0 if it does not exist, then incr', function (done) {
            var k = randkey();
            expect(redismock.incr(k)).to.equal(1);
            redismock.del(k);
            redismock.incr(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                done();
            });
        });
        it('should incr an integer key by 1', function (done) {
            var k = randkey();
            var v = 123;
            redismock.set(k, v);
            expect(redismock.incr(k)).to.equal(v + 1);
            redismock.incr(k, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v + 2);
                done();
            });
        });
    });

    describe('incrby', function () {
        it('should return an error for a key that does not map to string', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v);
            expect(redismock.incrby(k, 4)).to.be.an.instanceof(Error);
            redismock.incrby(k, 13, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return an error for a key that is not an integer', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.incrby(k, 4)).to.be.an.instanceof(Error);
            redismock.incrby(k, 13, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('ERR')).to.be.above(-1);
                done();
            });
        });
        it('should initialize the key with 0 if it does not exist, then incrby', function (done) {
            var k = randkey();
            expect(redismock.incrby(k, 4)).to.equal(4);
            redismock.del(k);
            redismock.incrby(k, 13, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(13);
                done();
            });
        });
        it('should incr an integer key by the given increment', function (done) {
            var k = randkey();
            var v = 123;
            redismock.set(k, v);
            expect(redismock.incrby(k, 4)).to.equal(v + 4);
            redismock.incrby(k, 13, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(v + 4 + 13);
                done();
            });
        });
    });

    describe('incrbyfloat', function () {
        it('should return an error for a key that does not map to string', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v);
            expect(redismock.incrbyfloat(k, 0.9)).to.be.an.instanceof(Error);
            redismock.incrbyfloat(k, 3.1415, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should return an error for a key that is not a number', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.incrbyfloat(k, 0.9)).to.be.an.instanceof(Error);
            redismock.incrbyfloat(k, 3.1415, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('ERR')).to.be.above(-1);
                done();
            });
        });
        it('should initialize the key with 0 if it does not exist, then incrbyfloat', function (done) {
            var k = randkey();
            expect(redismock.incrbyfloat(k, 0.9)).to.equal('0.9');
            redismock.del(k);
            redismock.incrbyfloat(k, 3.1415, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('3.1415');
                done();
            });
        });
        it('should incr a number key by the given increment', function (done) {
            var k = randkey();
            var v = 123.4567;
            redismock.set(k, v);
            expect(redismock.incrbyfloat(k, 0.9)).to.equal((v + 0.9).toString());
            redismock.incrbyfloat(k, 3.1415, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal((v + 0.9 + 3.1415).toString());
                done();
            });
        });
    });

    describe('mget', function () {
        it('should get all the keys', function (done) {
            var k1 = randkey(), k2 = randkey(), k3 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            expect(redismock.mset(k1, v1, k2, v2, k3, v3)).to.equal('OK');
            var gets = redismock.mget(k1, k2, k3);
            expect(gets).to.have.lengthOf(3);
            expect(gets[0]).to.equal(v1);
            expect(gets[1]).to.equal(v2);
            expect(gets[2]).to.equal(v3);
            redismock.mget(k1, k3, 'na', k2, 'ne', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.have.lengthOf(5);
                expect(reply[0]).to.equal(v1);
                expect(reply[1]).to.equal(v3);
                expect(reply[2]).to.not.exist;
                expect(reply[3]).to.equal(v2);
                expect(reply[4]).to.not.exist;
                done();
            });
        });
    });

    describe('mset', function () {
        it('should set all the keys', function (done) {
            var k1 = randkey(), k2 = randkey(), k3 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            expect(redismock.mset(k1, v1, k2, v2, k3, v3)).to.equal('OK');
            expect(redismock.get(k1)).to.equal(v1);
            expect(redismock.get(k2)).to.equal(v2);
            expect(redismock.get(k3)).to.equal(v3);
            redismock.mset(k1, v3, k2, v2, k3, v1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                expect(redismock.get(k1)).to.equal(v3);
                expect(redismock.get(k2)).to.equal(v2);
                expect(redismock.get(k3)).to.equal(v1);
                done();
            });
        });
    });

    describe('msetnx', function () {
        it('should set all the keys if none already exist', function (done) {
            var k1 = randkey(), k2 = randkey(), k3 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            expect(redismock.msetnx(k1, v1, k2, v2, k3, v3)).to.equal(1);
            expect(redismock.get(k1)).to.equal(v1);
            expect(redismock.get(k2)).to.equal(v2);
            expect(redismock.get(k3)).to.equal(v3);
            redismock.flushdb();
            redismock.msetnx(k1, v3, k2, v2, k3, v1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(1);
                expect(redismock.get(k1)).to.equal(v3);
                expect(redismock.get(k2)).to.equal(v2);
                expect(redismock.get(k3)).to.equal(v1);
                done();
            });
        });
        it('should not set any key if at least one already exists', function (done) {
            var k1 = randkey(), k2 = randkey(), k3 = randkey();
            var v1 = 'v1', v2 = 'v2', v3 = 'v3';
            expect(redismock.msetnx(k1, v1, k2, v2, k3, v3)).to.equal(1);
            expect(redismock.get(k1)).to.equal(v1);
            expect(redismock.get(k2)).to.equal(v2);
            expect(redismock.get(k3)).to.equal(v3);
            redismock.msetnx(k1, v3, k2, v2, k3, v1, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                expect(redismock.get(k1)).to.equal(v1);
                expect(redismock.get(k2)).to.equal(v2);
                expect(redismock.get(k3)).to.equal(v3);
                done();
            });
        });
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
        xit('should override a previous mapping with the new key-value mapping');
    });

    describe('set', function () {
        it('should set a key', function (done) {
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
        it('should override a previous mapping with the new key-value mapping', function (done) {
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
        it('should not set a key if the key exists and the nx option is given', function (done) {
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
        it('should set a key if the key does not exist and the nx option is given', function (done) {
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
        it('should not set a key if the key does not exist and the xx option is given', function (done) {
            var k = randkey();
            var v = 'value';
            expect(redismock.set(k, v, 'xx')).to.not.exist;
            redismock.set(k, v, 'xx', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.not.exist;
                done();
            });
        });
        it('should set a key if the key does exist and the xx option is given', function (done) {
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
        it('should set and expire a key in seconds if the px key is given', function (done) {
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
        it('should set and expire a key in milliseconds if the px option is given', function (done) {
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
        xit('should override a previous mapping with the new key-value mapping');
    });

    describe('setnx', function () {
        it('should set a key if the key does not exist', function (done) {
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
        it('should not set a key if the key exists', function (done) {
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
        it('should return an error for a key that does not map to string', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.lpush(k, v);
            expect(redismock.setrange(k, 0, v)).to.be.an.instanceof(Error);
            redismock.getrange(k, 5, v, function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err).to.be.an.instanceof(Error);
                expect(err.message.indexOf('WRONGTYPE')).to.be.above(-1);
                done();
            });
        });
        it('should substitute the value for an offset within the length of the key', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.setrange(k, 1, 'ula')).to.equal(5);
            expect(redismock.get(k)).to.equal('vulae');
            expect(redismock.setrange(k, 0, 'e')).to.equal(5);
            expect(redismock.get(k)).to.equal('eulae');
            redismock.setrange(k, 4, 'v', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(5);
                expect(redismock.get(k)).to.equal('eulav');
                done();
            });
        });
        it('should zero-pad out the key for an offset outside of the length of the key', function (done) {
            var k = randkey();
            var v = 'value';
            redismock.set(k, v);
            expect(redismock.setrange(k, 5, v)).to.equal(10);
            expect(redismock.get(k)).to.equal(v + v);
            redismock.setrange(k, 20, v, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(25);
                expect(redismock.get(k)).to.equal(v + v + '\0\0\0\0\0\0\0\0\0\0' + v);
                done();
            });
        });
    });

    describe('strlen', function () {
        it('should return 0 for a key that does not exist', function (done) {
            expect(redismock.strlen(randkey())).to.equal(0);
            redismock.strlen(randkey(), function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(0);
                done();
            });
        });
        it('should return the length for a key that exists', function (done) {
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
        it('should return an error for a key that is not a string', function (done) {
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
