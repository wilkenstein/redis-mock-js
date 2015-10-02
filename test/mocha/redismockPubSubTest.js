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
                    if (pattern != "b?[or]g*") {
                        return;
                    }
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
                    if ([chan1, chan2, chan3].indexOf(channel) === -1) {
                        return;
                    }
                    expect(["[bc]ass*", "[bc]?as*", "zzz*"].indexOf(pattern)).to.be.above(-1);
                    expect(message).to.equal(msg);
                    cnt += 1;
                    if (count === cnt) {
                        done();
                    }
                })
                .psubscribe("[bc]ass*", "[bc]?as*", "zzz*");
            expect(redismock.publish(chan1, msg)).to.be.at.least(1);
            expect(redismock.publish(chan2, msg)).to.be.at.least(1);
            expect(redismock.publish(chan3, msg)).to.be.at.least(1);
        });
    });

    describe('pubsub', function () {
        it('should return nothing if the subcommand is invalid', function (done) {
            redismock
                .createClient()
                .pubsub("invalid", function (err, reply) {
                    expect(err).to.not.exist;
                    expect(reply).to.not.exist;
                    done();
                });
        });
        it('should return the number of channels open', function (done) {
            var chan1 = randkey("pubsub-channels-chan1"), chan2 = randkey("pubsub-channels-chan2"), chan3 = randkey("pubsub-channels-chan3");
            var msg = "No entiendo Espanol, Muzzy.";
            var count = 3, cnt = 0;
            redismock
                .createClient()
                .on("message", function (channel, message) {
                    if ([chan1, chan2, chan3].indexOf(channel) === -1) {
                        return;
                    }
                    var chans = redismock.pubsub("channels");
                    expect(chans.length).to.be.at.least(3);
                    expect(chans.indexOf(chan1)).to.be.above(-1);
                    expect(chans.indexOf(chan2)).to.be.above(-1);
                    expect(chans.indexOf(chan3)).to.be.above(-1);
                    redismock.pubsub("channels", function (err, reply) {
                        expect(err).to.not.exist;
                        expect(reply.length).to.be.at.least(3);
                        expect(reply.indexOf(chan1)).to.be.above(-1);
                        expect(reply.indexOf(chan2)).to.be.above(-1);
                        expect(reply.indexOf(chan3)).to.be.above(-1);
                        done();
                    });
                })
                .subscribe(chan1, chan2, chan3);
            redismock.publish(chan1, msg);
        });
        it('should return the number of channels open matching a pattern', function (done) {
            var chan1 = randkey("pubsub-channels-pat1"), chan2 = randkey("pubsub-channels-pat2"), chan3 = randkey("pubsub-channels-pat3");
            var msg = "No entiendo Espanol, Muzzy.";
            var count = 3, cnt = 0;
            redismock
                .createClient()
                .on("message", function (channel, message) {
                    if ([chan1, chan2, chan3].indexOf(channel) === -1) {
                        return;
                    }
                    var chans = redismock.pubsub("channels", "pubsub-channels-pat[12]*");
                    expect(chans.length).to.equal(2);
                    expect(chans.indexOf(chan1)).to.be.above(-1);
                    expect(chans.indexOf(chan2)).to.be.above(-1);
                    expect(chans.indexOf(chan3)).to.equal(-1);
                    redismock.pubsub("channels", "pubsub-channels-pat[!12]*", function (err, reply) {
                        expect(err).to.not.exist;
                        expect(reply.length).to.equal(1);
                        expect(reply.indexOf(chan1)).to.equal(-1);
                        expect(reply.indexOf(chan2)).to.equal(-1);
                        expect(reply.indexOf(chan3)).to.be.above(-1);
                        done();
                    });
                })
                .subscribe(chan1, chan2, chan3);
            redismock.publish(chan1, msg);
        });
        it('should return the number of subscribers to a channel', function (done) {
            var chan1 = randkey("bass"), chan2 = randkey("crass"), chan3 = randkey("zzz");
            var msg = "No entiendo Espanol, Muzzy.";
            var count = 3, cnt = 0;
            redismock
                .createClient()
                .on("message", function (channel, message) {
                    if ([chan1, chan2, chan3].indexOf(channel) === -1) {
                        return;
                    }
                    var subs = redismock.pubsub("numsub", chan1, chan2);
                    expect(subs.length).to.equal(2);
                    expect(subs[0]).to.equal(3);
                    expect(subs[1]).to.equal(1);
                    redismock.pubsub("numsub", chan3, chan1, chan2, function (err, reply) {
                        expect(err).to.not.exist;
                        expect(reply.length).to.equal(3);
                        expect(reply[0]).to.equal(2);
                        expect(reply[1]).to.equal(3);
                        expect(reply[2]).to.equal(1);
                        done();
                    });
                })
                .subscribe(chan1, chan2, chan3);
            redismock
                .createClient()
                .subscribe(chan1);
            redismock
                .createClient()
                .subscribe(chan1, chan3);
            redismock.publish(chan1, msg);
        });
        it('should return the number of subscriptions to a pattern', function (done) {
            var chan1 = randkey("bass"), chan2 = randkey("crass"), chan3 = randkey("zzz");
            var msg = "No entiendo Espanol, Muzzy.";
            var count = 3, cnt = 0;
            redismock
                .createClient()
                .on("pmessage", function (pattern, channel, message) {
                    if ([chan1, chan2, chan3].indexOf(channel) === -1) {
                        return;
                    }
                    expect(redismock.pubsub("numpat")).to.be.at.least(3);
                    redismock.pubsub("numpat", function (err, reply) {
                        expect(err).to.not.exist;
                        expect(reply).to.be.at.least(3);
                        done();
                    });
                })
                .psubscribe("[bc]ass*", "[bc]?as*", "zzz*");
            redismock.publish(chan1, msg);
        });
    });

    describe('publish', function () {
        it('should publish a message to a subscriber of a channel', function (done) {
            var chan = randkey('c');
            var msg = "hi! I am a message!";
            redismock
                .createClient()
                .on("message", function (channel, message) {
                    if (channel !== chan) {
                        return;
                    }
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
                    if (channel !== chan) {
                        return;
                    }
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
                    if (channel !== chan) {
                        return;
                    }
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
                    if (channel !== chan) {
                        return;
                    }
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
                    if (pattern !== "g*") {
                        return;
                    }
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
                    if (pattern !== "g?ob*") {
                        return;
                    }
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
                    if (pattern !== "g[lr]ob*") {
                        return;
                    }
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
        it('should do nothing if the pattern is not subscribed', function (done) {
            var client = redismock.createClient();
            client
                .on("punsubscribe", function () {
                    expect(true).to.be.false;
                });
            client.punsubscribe("nothing");
            setTimeout(function () {
                done();
            }, 1000);
        });
        it('should punsubscribe from a subscribed pattern', function (done) {
            var chan = randkey('hot');
            var msg1 = "hello!", msg2 = "goodbye!";
            redismock
                .createClient()
                .on("punsubscribe", function (pattern) {
                    if (pattern !== 'h?t*') {
                        return;
                    }
                    expect(pattern).to.equal('h?t*');
                    redismock.publish(chan, msg2);
                    setTimeout(function () {
                        done();
                    }, 1000);
                })
                .on("pmessage", function (pattern, channel, message) {
                    if (pattern !== 'h?t*') {
                        return;
                    }
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
                    if (idx === -1) {
                        return;
                    }
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
                    if (idx === -1) {
                        return;
                    }
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
        it('should punsubscribe from all subscribed patterns', function (done) {
            this.timeout(5000);
            var chan1 = randkey('hope'), chan2 = randkey('against'), chan3 = randkey('dope');
            var msg1 = "hello again again!", msg2 = "goodbye again again!", msg3 = "hey you guys!";
            var pat1 = 'hope*', pat2 = 'against*', pat3 = 'dope*';
            var count = 3, cnt = 0;
            redismock
                .createClient()
                .on("punsubscribe", function (pattern) {
                    var idx = [pat1, pat2, pat3].indexOf(pattern);
                    if (idx === -1) {
                        return;
                    }
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
                    else if (idx === 1) {
                        redismock.publish(chan2, msg2);
                        setTimeout(function () {
                            cnt += 1;
                            if (count === cnt) {
                                done();
                            }
                        }, 1000);
                    }
                    else {
                        redismock.publish(chan3, msg3);
                        setTimeout(function () {
                            cnt += 1;
                            if (count === cnt) {
                                done();
                            }
                        }, 1000);
                    }
                })
                .on("pmessage", function (pattern, channel, message) {
                    var idx = [pat1, pat2, pat3].indexOf(pattern);
                    if (idx === -1) {
                        return;
                    }
                    expect(idx).to.be.above(-1);
                    if (idx === 2) {
                        expect(channel).to.equal(chan3);
                        this.punsubscribe();
                    }
                })
                .psubscribe(pat1, pat2, pat3);
            expect(redismock.publish(chan1, msg1)).to.equal(1);
            expect(redismock.publish(chan2, msg2)).to.equal(1);
            expect(redismock.publish(chan3, msg3)).to.equal(1);
        });
    });

    describe('subscribe', function () {
        it('should subscribe to a channel', function (done) {
            var chan = randkey('ch');
            var msg = "bon jour! je m'apelle Muzzy!";
            redismock
                .createClient()
                .on("message", function (channel, message) {
                    if (channel !== chan) {
                        return;
                    }
                    expect(channel).to.equal(chan);
                    expect(message).to.equal(msg);
                    done();
                })
                .subscribe(chan);
            redismock.publish(chan, msg);
        });
        it('should subscribe to channels', function (done) {
            var chan1 = randkey("yyy"), chan2 = randkey("xxx"), chan3 = randkey("qqq");
            var msg = "je ne parle pas francais, Muzzy.";
            var count = 3, cnt = 0;
            redismock
                .createClient()
                .on("message", function (channel, message) {
                    if ([chan1, chan2, chan3].indexOf(channel) === -1) {
                        return;
                    }
                    expect([chan1, chan2, chan3].indexOf(channel)).to.be.above(-1);
                    expect(message).to.equal(msg);
                    cnt += 1;
                    if (count === cnt) {
                        done();
                    }
                })
                .subscribe(chan1, chan2, chan3);
            expect(redismock.publish(chan1, msg)).to.equal(1);
            expect(redismock.publish(chan2, msg)).to.equal(1);
            expect(redismock.publish(chan3, msg)).to.equal(1);
        });
    });

    describe('unsubscribe', function () {
        it('should do nothing if the channel is not subscribed', function (done) {
            var client = redismock.createClient();
            client
                .on("unsubscribe", function () {
                    expect(true).to.be.false;
                });
            client.unsubscribe("nothing");
            setTimeout(function () {
                done();
            }, 1000);
        });
        it('should unsubscribe from a subscribed channel', function (done) {
            var chan = randkey('boosh');
            var msg1 = "hello!", msg2 = "goodbye!";
            redismock
                .createClient()
                .on("unsubscribe", function (channel) {
                    if (channel !== chan) {
                        return;
                    }
                    expect(channel).to.equal(chan);
                    redismock.publish(chan, msg2);
                    setTimeout(function () {
                        done();
                    }, 1000);
                })
                .on("message", function (channel, message) {
                    if (channel !== chan) {
                        return;
                    }
                    expect(channel).to.equal(chan);
                    expect(message).to.equal(msg1);
                    this.unsubscribe(chan);
                })
                .subscribe(chan);
            expect(redismock.publish(chan, msg1)).to.equal(1);
        });
        it('should unsubscribe from subscribed channels', function (done) {
            var chan1 = randkey('sticky'), chan2 = randkey('icky');
            var msg1 = "hello again!", msg2 = "goodbye again!";
            var count = 2, cnt = 0;
            redismock
                .createClient()
                .on("unsubscribe", function (channel) {
                    var idx = [chan1, chan2].indexOf(channel);
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
                .on("message", function (channel, message) {
                    var idx = [chan1, chan2].indexOf(channel);
                    if (idx === -1) {
                        return;
                    }
                    expect(idx).to.be.above(-1);
                    if (idx === 0) {
                        expect(channel).to.equal(chan1);
                        this.unsubscribe(chan1);
                    }
                    else {
                        expect(channel).to.equal(chan2);
                        this.unsubscribe(chan2);
                    }
                })
                .subscribe(chan1, chan2);
            expect(redismock.publish(chan1, msg1)).to.equal(1);
            expect(redismock.publish(chan2, msg2)).to.equal(1);
        });
        it('should unsubscribe from all subscribed channels', function (done) {
            this.timeout(5000);
            var chan1 = randkey('mighty'), chan2 = randkey('tighty'), chan3 = randkey('whitey');
            var msg1 = "hello again again!", msg2 = "goodbye again again!", msg3 = "hey you guys!";
            var count = 3, cnt = 0;
            redismock
                .createClient()
                .on("unsubscribe", function (channel) {
                    var idx = [chan1, chan2, chan3].indexOf(channel);
                    if (idx === -1) {
                        return;
                    }
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
                    else if (idx === 1) {
                        redismock.publish(chan2, msg2);
                        setTimeout(function () {
                            cnt += 1;
                            if (count === cnt) {
                                done();
                            }
                        }, 1000);
                    }
                    else {
                        redismock.publish(chan3, msg3);
                        setTimeout(function () {
                            cnt += 1;
                            if (count === cnt) {
                                done();
                            }
                        }, 1000);
                    }
                })
                .on("message", function (channel, message) {
                    var idx = [chan1, chan2, chan3].indexOf(channel);
                    if (idx === -1) {
                        return;
                    }
                    expect(idx).to.be.above(-1);
                    if (idx === 2) {
                        expect(channel).to.equal(chan3);
                        this.unsubscribe();
                    }
                })
                .subscribe(chan1, chan2, chan3);
            expect(redismock.publish(chan1, msg1)).to.equal(1);
            expect(redismock.publish(chan2, msg2)).to.equal(1);
            expect(redismock.publish(chan3, msg3)).to.equal(1);
        });
    });

}).call(this);
