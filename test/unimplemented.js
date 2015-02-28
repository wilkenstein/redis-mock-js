(function() {
    var redismock = typeof require === 'function' ? require('../redis-mock.js') : window.redismock;
    if (typeof chai === 'undefined') {
        var chai = typeof require === 'function' ? require('chai') : window.chai;
    }
    chai.config.includeStack = true;
    var expect = chai.expect;

    describe('unimplemented commands', function () {
        it('prints out all commands not yet implemented', function () {
            var args = [];
            var err;
            var idx, len = 10; // 10 arguments should be the max number amongst all commands.
            for (idx = 0; idx < len; idx += 1) {
                args.push(idx);
            }
            for (var key in redismock) {
                if (typeof redismock[key] === "function") {
                    err = redismock[key].apply(redismock, args);
                    if (err instanceof Error && err.message === 'UNIMPLEMENTED') {
                        console.log(key);
                    }
                }
            }
        });
    });

}).call(this);