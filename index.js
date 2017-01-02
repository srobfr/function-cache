var fs = require("fs");
var Q = require("q");
var _ = require("lodash");
var os = require("os");
var farmhash = require('farmhash');
var path = require('path');
var mkdirParents = require('mkdir-parents');

var storage = {};

function cache(func, options) {
    var defaults = {
        tmpDir: os.tmpdir(),
        useMemoryCache: true,
        useFileCache: true,
        serializer: JSON.stringify,
        unserializer: JSON.parse,
        hasher: farmhash.hash32,
        tmpPrefix: "function-cache"
    };

    _.assignIn(defaults, options);
    options = defaults;

    // On calcule un hash pour la fonction, de manière à invalider le code si elle change.
    var funcHash = options.hasher(func.toString());

    var funcWrapper = function () {
        if (!options.useMemoryCache && !options.useFileCache) return func;

        var args = _.toArray(arguments);
        var serializedArgs = options.serializer(args);
        var hash = "" + funcHash + options.hasher(serializedArgs);
        var p = (options.useFileCache ? options.tmpDir + path.sep + options.tmpPrefix + hash : null);

        if (options.useMemoryCache && storage[hash] !== undefined) {
            // On a la valeur en cache RAM.
            return Q(storage[hash]);
        }

        function callFunc() {
            return Q(func.apply(this, args))
                .then(function (result) {
                    if (options.useMemoryCache) storage[hash] = result;
                    if (options.useFileCache) {
                        var dir = path.dirname(p);
                        // On crée le dossier s'il n'existe pas.
                        mkdirParents(dir, 0777, function (err) {
                            if (err) throw new Error(err);
                            fs.writeFile(p, options.serializer(result), function (err) {
                                if (err) throw new Error(err);
                            });
                        });
                    }

                    return result;
                });
        }

        if (options.useFileCache) {
            return Q()
                .then(function () {
                    // On vérifie si un cache existe sous forme de fichier.
                    return Q.nfcall(fs.readFile, p, "UTF-8");
                })
                .then(function (serializedData) {
                        // Le cache est disponible
                        var data = options.unserializer(serializedData);
                        if (options.useMemoryCache) storage[hash] = data;
                        return data;
                    },
                    function (err) {
                        // Cache indisponible.
                        return callFunc();
                    });
        }

        return callFunc();
    };

    funcWrapper.flush = function () {
        if (options.useMemoryCache) {
            var hashes = _.keys(storage);
            _.each(hashes, function (hash) {
                if (hash.indexOf(funcHash) === 0) delete storage[hash];
            });
        }

        if (!options.useFileCache) Q();

        var pDirContent = Q.nfcall(fs.readdir, options.tmpDir, "UTF-8");

        return pDirContent.then(function (dirContent) {
            var filteredDirContent = _.filter(dirContent, function (p) {
                return (p.indexOf(options.tmpPrefix + funcHash) === 0);
            });

            return Q.all(_.map(filteredDirContent, function (p) {
                return Q.nfcall(fs.unlink, options.tmpDir + path.sep + p);
            }));
        });
    };

    return funcWrapper;
}

module.exports = cache;
