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

    describe('psubscribe', function () {
        xit('should psubscribe');
    });

    describe('pubsub', function () {
        xit('should pubsub');
    });

    describe('publish', function () {
        it('should publish a message to a subscriber of a channel', function (done) {
            var chan = randkey('c');
            var msg = "hi! I am a message!";
            redismock
                .createClient()
                .on("message", function (channel, message) {
                    if (channel === chan) {
                        expect(channel).to.equal(chan);
                        expect(message).to.equal(msg);
                        done();
                    }
                })
                .subscribe(chan)
            redismock.publish(chan, msg);
        });
        it('should publish a message to subscribers of a channel', function (done) {
            var chan = randkey('c');
            var msg = "hi! I am a message!";
            var count = 3, cnt = 0;
            redismock
                .createClient()
                .on("message", function (channel, message) {
                    if (channel === chan) {
                        expect(channel).to.equal(chan);
                        expect(message).to.equal(msg);
                        cnt += 1;
                        if (cnt === count) {
                            done();
                        }
                    }
                })
                .subscribe(chan)
            redismock
                .createClient()
                .on("message", function (channel, message) {
                    if (channel === chan) {
                        expect(channel).to.equal(chan);
                        expect(message).to.equal(msg);
                        cnt += 1;
                        if (cnt === count) {
                            done();
                        }
                    }  
                })
                .subscribe(chan)
            redismock
                .createClient()
                .on("message", function (channel, message) {
                    if (channel === chan) {
                        expect(channel).to.equal(chan);
                        expect(message).to.equal(msg);
                        cnt += 1;
                        if (cnt === count) {
                            done();
                        }
                    }
                })
                .subscribe(chan)
            redismock.publish(chan, msg);
        });
        it('should publish a message to psubscribers', function (done) {
            var chan = randkey('glob');
            var msg = "hi! I am a pmessage!";
            var count = 3, cnt = 0;
            redismock
                .createClient()
                .on("pmessage", function (pattern, channel, message) {
                    if (channel === chan && pattern === "g*") {
                        expect(pattern).to.equal("g*");
                        expect(channel).to.equal(chan);
                        expect(message).to.equal(msg);
                        cnt += 1;
                        if (cnt === count) {
                            done();
                        }
                    }
                })
                .psubscribe("g*");
            redismock
                .createClient()
                .on("pmessage", function (pattern, channel, message) {
                    if (channel === chan && pattern === "g?ob*") {
                        expect(pattern).to.equal("g?ob*");
                        expect(channel).to.equal(chan);
                        expect(message).to.equal(msg);
                        cnt += 1;
                        if (cnt === count) {
                            done();
                        }
                    }
                })
                .psubscribe("g?ob*");
            redismock
                .createClient()
                .on("pmessage", function (pattern, channel, message) {
                    if (channel === chan && pattern === "g[lr]ob*") {
                        expect(pattern).to.equal("g[lr]ob*");
                        expect(channel).to.equal(chan);
                        expect(message).to.equal(msg);
                        cnt += 1;
                        if (cnt === count) {
                            done();
                        }
                    }
                })
                .psubscribe("g[lr]ob*");
            redismock.publish(chan, msg);
        });
        xit('should publish');
    });

    describe('punsubscribe', function () {
        xit('should punsubscribe');
    });

    describe('subscribe', function () {
        xit('should subscribe');
    });

    describe('unsubscribe', function () {
        xit('should unsubscribe');
    });

}).call(this);
