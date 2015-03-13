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

    describe('creating 2 one million element sets and diffing them', function () {
        var n = 1000000;
        it('should take under 20 seconds', function () {
            var k1 = randkey(), k2 = randkey();
            for (var idx = 0; idx < n; idx += 1) {
                redismock.sadd(k1, Math.floor((Math.random()*100000)).toString());
                redismock.sadd(k2, Math.ceil((Math.random()*100000)).toString());
            }
            var start = new Date();
            var reply = redismock.sdiff(k1, k2);
            var end = new Date();
            expect(end - start).to.be.below(20000);
        });
    });

    describe('creating 100 sets with 10 000 elements each and diffing them', function () {
    });

    describe('creating 2 one million element sets and intering them', function () {
        var n = 1000000;
        it('should take under 20 seconds', function () {
            var k1 = randkey(), k2 = randkey();
            for (var idx = 0; idx < n; idx += 1) {
                redismock.sadd(k1, Math.floor((Math.random()*100000)).toString());
                redismock.sadd(k2, Math.ceil((Math.random()*100000)).toString());
            }
            var start = new Date();
            var reply = redismock.sinter(k1, k2);
            var end = new Date();
            expect(end - start).to.be.below(20000);
        });
    });

    describe('creating 100 sets with 10 000 elements each and intering them', function () {
        var n = 1000000;
        it('should take under 20 seconds', function () {
            var k1 = randkey(), k2 = randkey();
            for (var idx = 0; idx < n; idx += 1) {
                redismock.sadd(k1, Math.floor((Math.random()*100000)).toString());
                redismock.sadd(k2, Math.ceil((Math.random()*100000)).toString());
            }
            var start = new Date();
            var reply = redismock.sunion(k1, k2);
            var end = new Date();
            expect(end - start).to.be.below(20000);
        });
    });

    describe('creating 2 one million element sets and unioning them', function () {
    });

    describe('creating 100 sets with 10 000 elements each and unioning them', function () {
    });

}).call(this);
