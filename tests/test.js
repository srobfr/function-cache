var cache = require(__dirname + "/../index.js");
var Q = require("q");
var assert = require('assert');

var now = "" + (new Date().getTime());

describe('cache-function', function() {
    describe('#cache()', function () {
        it('should cache value', function (done) {
            var test1WasCalled = false;

            function test1(foo) {
                test1WasCalled = true;
                return foo + "bar";
            }

            var cachedTest1 = cache(test1, {tmpPrefix: "mocha" + now});

            return Q()
                .then(function() {
                    return cachedTest1("foo");
                })
                .then(function(r) {
                    assert.equal(r, "foobar");
                    assert.equal(true, test1WasCalled); // Appelé la première fois

                    test1WasCalled = false;
                    return cachedTest1("foo");
                })
                .then(function(r) {
                    assert.equal(r, "foobar");
                    assert.equal(false, test1WasCalled); // Caché la deuxième fois
                })
                .done(done);
        });
    });
});