(function() {
    var redismock = typeof require === 'function' ? require('../../redis-mock.js') : window.redismock;
    if (typeof chai === 'undefined') {
        var chai = typeof require === 'function' ? require('chai') : window.chai;
    }
    chai.config.includeStack = true;
    var expect = chai.expect;

    var ignorekeys = [
        'Array',
        'SortedSet',
        'ifType',
        'randomkey',
        'multi',
        'info',
        'punsubscribe',
        'discard',
        'unwatch',
        'script_flush',
        'script_kill',
        'script_load',
        'ping',
        'quit',
        'select',
        'bgrewriteaof',
        'bgsave',
        'client_kill',
        'client_list',
        'client_getname',
        'cluster_slots',
        'command',
        'command_count',
        'command_getkeys',
        'command_info',
        'config_get',
        'config_rewrite',
        'config_resetstat',
        'dbsize',
        'debug_segfault',
        'flushall',
        'flushdb',
        'lastsave',
        'monitor',
        'role',
        'save',
        'shutdown',
        'sync',
        'time',
        'toPromiseStyle',
        'copy',
        'toNodeRedis',
        'createClient',
        'unsubscribe'
    ];

    describe('args check', function () {
        it('returns an error if we do not have the right number of arguments', function () {
            for (var key in redismock) {
                if (typeof redismock[key] === "function") {
                    if (ignorekeys.indexOf(key) !== -1) {
                        // 0 args, so skip, or intentionally skip.
                        continue;
                    }
                    err = redismock[key]();
                    expect(err).to.be.an.instanceof(Error);
                    expect(err.message.indexOf('ERR')).to.be.above(-1);
                    expect(err.message.indexOf(key)).to.be.above(-1);
                    expect(err.message.indexOf('wrong number of arguments')).to.be.above(-1);
                }
            }
        });
    });

}).call(this);
