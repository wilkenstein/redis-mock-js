(function() {
    var redismock = typeof require === 'function' ? require('../../redis-mock.js') : window.redismock;
    if (typeof chai === 'undefined') {
        var chai = typeof require === 'function' ? require('chai') : window.chai;
    }
    chai.config.includeStack = true;
    var expect = chai.expect;

    describe('auth', function () {
        it('should return an error if the auth is not set', function (done) {
            expect(redismock.auth('mypass')).to.be.an.instanceof(Error);
            redismock.auth('mypass', function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err.message.indexOf('AUTH')).to.be.above(-1);
                done();
            });
        });
        it('should return an error for an invalid password', function (done) {
            redismock.password = 'mypass';
            expect(redismock.auth('notright')).to.be.an.instanceof(Error);
            redismock.auth('notright', function (err, reply) {
                expect(err).to.exist;
                expect(reply).to.not.exist;
                expect(err.message.indexOf('invalid password')).to.be.above(-1);
                done();
            });
        });
        it('should return OK for a valid password', function (done) {
            redismock.password = 'mypass';
            expect(redismock.auth('mypass')).to.equal('OK');
            redismock.auth('mypass', function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal('OK');
                done();
            });
        });
    });

    describe('echo', function () {
        it('should echo the message', function (done) {
            var msg = "Hello World!";
            expect(redismock.echo(msg)).to.equal(msg);
            redismock.echo(msg, function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal(msg);
                done();
            });
        });
    });

    describe('ping', function () {
        it('should pong', function (done) {
            expect(redismock.ping()).to.equal("PONG");
            redismock.ping(function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal("PONG");
                done();
            });
        });
    });

    describe('quit', function () {
        it('should return OK', function (done) {
            expect(redismock.quit()).to.equal("OK");
            redismock.quit(function (err, reply) {
                expect(err).to.not.exist;
                expect(reply).to.equal("OK");
                done();
            });
        });
    });

    describe('createClient', function () {
        xit('should create client');
    });

}).call(this);