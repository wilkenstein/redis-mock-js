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

    var k1 = randkey(), k2 = randkey();
    var n = 1000000;
    before(function () {
        this.timeout(60000);
        for (var idx = 0; idx < n; idx += 1) {
            redismock.zadd(k1, Math.floor(Math.random()*100), Math.floor((Math.random()*n)).toString());
            redismock.zadd(k2, Math.ceil(Math.random()*100), Math.ceil((Math.random()*n)).toString());
        }
    });

    describe('creating a one million element sorted set with at most one hundred distinct scores', function () {
        it('should take under 20 seconds', function () {
            var start = new Date();
            var k = randkey();
            for (var idx = 0; idx < 1000000; idx += 1) {
                redismock.zadd(k, Math.floor(Math.random()*100), idx.toString());
            }
            var end = new Date();
            expect(end - start).to.be.below(20000);
        });
    });

    describe('intersecting 2 one million element sorted sets with at most one hundred distinct scores', function () {
        it('should take under 20 seconds', function () {
            var d = randkey();
            var start = new Date();
            var reply = redismock.zinterstore(d, k1, k2);
            var end = new Date();
            expect(end - start).to.be.below(30000);
        });
    });

    describe('creating 100 sets with 10 000 elements each and intering them', function () {
    });

    describe('unioning 2 one million element sorted sets with at most one hundred distinct scores', function () {
        it('should take under 30 seconds', function () {
            var d = randkey();
            var start = new Date();
            var reply = redismock.zunionstore(d, k1, k2);
            var end = new Date();
            expect(end - start).to.be.below(30000);
        });
    });

    describe('creating 100 sets with 10 000 elements each and unioning them', function () {
    });

}).call(this);
