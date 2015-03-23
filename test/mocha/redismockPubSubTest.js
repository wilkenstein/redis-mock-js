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
        it('should psubscribe to a pattern', function (done) {
            var chan = randkey('borg');
            var msg = "hola! Yo soy Muzzy!";
            redismock
                .createClient()
                .on("pmessage", function (pattern, channel, message) {
                    expect(pattern).to.equal("b?[or]g*");
                    expect(channel).to.equal(chan);
                    expect(message).to.equal(msg);
                    done();
                })
                .psubscribe("b?[or]g*");
            redismock.publish(chan, msg);
        });
        it('should psubscribe to patterns', function (done) {
            var chan1 = randkey("bass"), chan2 = randkey("crass"), chan3 = randkey("zzz");
            var msg = "No entiendo Espanol, Muzzy.";
            var count = 3, cnt = 0;
            redismock
                .createClient()
                .on("pmessage", function (pattern, channel, message) {
                    expect([chan1, chan2, chan3].indexOf(channel)).to.be.above(-1);
                    expect(["[bc]ass*", "[bc]?as*", "zzz*"].indexOf(pattern)).to.be.above(-1);
                    expect(message).to.equal(msg);
                    cnt += 1;
                    if (count === cnt) {
                        done();
                    }
                })
                .psubscribe("[bc]ass*", "[bc]?as*", "zzz*");
            expect(redismock.publish(chan1, msg)).to.equal(1);
            expect(redismock.publish(chan2, msg)).to.equal(1);
            expect(redismock.publish(chan3, msg)).to.equal(1);
        });
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
                    expect(channel).to.equal(chan);
                    expect(message).to.equal(msg);
                    done();
                })
                .subscribe(chan)
            expect(redismock.publish(chan, msg)).to.equal(1);
        });
        it('should publish a message to subscribers of a channel', function (done) {
            var chan = randkey('c');
            var msg = "hi! I am a message!";
            var count = 3, cnt = 0;
            redismock
                .createClient()
                .on("message", function (channel, message) {
                    expect(channel).to.equal(chan);
                    expect(message).to.equal(msg);
                    cnt += 1;
                    if (cnt === count) {
                        done();
                    }
                })
                .subscribe(chan)
            redismock
                .createClient()
                .on("message", function (channel, message) {
                    expect(channel).to.equal(chan);
                    expect(message).to.equal(msg);
                    cnt += 1;
                    if (cnt === count) {
                        done();
                    }
                })
                .subscribe(chan)
            redismock
                .createClient()
                .on("message", function (channel, message) {
                    expect(channel).to.equal(chan);
                    expect(message).to.equal(msg);
                    cnt += 1;
                    if (cnt === count) {
                        done();
                    }
                })
                .subscribe(chan)
            expect(redismock.publish(chan, msg)).to.equal(count);
        });
        it('should publish a message to psubscribers', function (done) {
            var chan = randkey('glob');
            var msg = "hi! I am a pmessage!";
            var count = 3, cnt = 0;
            redismock
                .createClient()
                .on("pmessage", function (pattern, channel, message) {
                    expect(pattern).to.equal("g*");
                    expect(channel).to.equal(chan);
                    expect(message).to.equal(msg);
                    cnt += 1;
                    if (cnt === count) {
                        done();
                    }
                })
                .psubscribe("g*");
            redismock
                .createClient()
                .on("pmessage", function (pattern, channel, message) {
                    expect(pattern).to.equal("g?ob*");
                    expect(channel).to.equal(chan);
                    expect(message).to.equal(msg);
                    cnt += 1;
                    if (cnt === count) {
                        done();
                    }
                })
                .psubscribe("g?ob*");
            redismock
                .createClient()
                .on("pmessage", function (pattern, channel, message) {
                    expect(pattern).to.equal("g[lr]ob*");
                    expect(channel).to.equal(chan);
                    expect(message).to.equal(msg);
                    cnt += 1;
                    if (cnt === count) {
                        done();
                    }
                })
                .psubscribe("g[lr]ob*");
            expect(redismock.publish(chan, msg)).to.equal(count);
        });
    });

    describe('punsubscribe', function () {
        xit('should do nothing if the pattern is not subscribed');
        it('should punsubscribe from a subscribed pattern', function (done) {
            var chan = randkey('hot');
            var msg1 = "hello!", msg2 = "goodbye!";
            redismock
                .createClient()
                .on("punsubscribe", function (pattern) {
                    expect(pattern).to.equal('h?t*');
                    redismock.publish(chan, msg2);
                    setTimeout(function () {
                        done();
                    }, 1000);
                })
                .on("pmessage", function (pattern, channel, message) {
                    expect(pattern).to.equal("h?t*");
                    expect(channel).to.equal(chan);
                    expect(message).to.equal(msg1);
                    this.punsubscribe("h?t*");
                })
                .psubscribe("h?t*");
            expect(redismock.publish(chan, msg1)).to.equal(1);
        });
        it('should punsubscribe from subscribed patterns', function (done) {
            var chan1 = randkey('not'), chan2 = randkey('or');
            var msg1 = "hello again!", msg2 = "goodbye again!";
            var pat1 = 'n??*', pat2 = '[ho]r*';
            var count = 2, cnt = 0;
            redismock
                .createClient()
                .on("punsubscribe", function (pattern) {
                    var idx = [pat1, pat2].indexOf(pattern);
                    expect(idx).to.be.above(-1);
                    if (idx === 0) {
                        redismock.publish(chan1, msg1);
                        setTimeout(function () {
                            cnt += 1;
                            if (count === cnt) {
                                done();
                            }
                        }, 1000);
                    }
                    else {
                        redismock.publish(chan2, msg2);
                        setTimeout(function () {
                            cnt += 1;
                            if (count === cnt) {
                                done();
                            }
                        }, 1000);
                    }
                })
                .on("pmessage", function (pattern, channel, message) {
                    var idx = [pat1, pat2].indexOf(pattern);
                    expect(idx).to.be.above(-1);
                    if (idx === 0) {
                        expect(channel).to.equal(chan1);
                        this.punsubscribe(pat1);
                    }
                    else {
                        expect(channel).to.equal(chan2);
                        this.punsubscribe(pat2);
                    }
                })
                .psubscribe(pat1, pat2);
            expect(redismock.publish(chan1, msg1)).to.equal(1);
            expect(redismock.publish(chan2, msg2)).to.equal(1);
        });
        xit('should punsubscribe from all subscribed patterns');
    });

    describe('subscribe', function () {
        xit('should subscribe');
    });

    describe('unsubscribe', function () {
        xit('should unsubscribe');
    });

}).call(this);
