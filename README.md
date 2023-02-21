# function-cache  [![Build Status](https://travis-ci.org/srobfr/function-cache.svg?branch=master)](https://travis-ci.org/srobfr/function-cache)
Cache serializable function calls results.

This module uses Promises (provided by [Q](https://www.npmjs.com/package/q)).

## Installation

    npm install --save function-cache

## Usage
```js
    var cache = require("function-cache");
    
    function foo(param) {
        console.log("foo has been called.");
        return "Foo" + param;
    }
    
    var cachedFoo = cache(foo);
    
    cachedFoo("Bar") // Prints "foo has been called." because no cache is available yet.
    .then(function(result) {
        console.log(result); // Prints "FooBar"
         
        return cachedFoo("Bar"); // Prints nothing because the result is already cached.
    })
    .then(function(result) {
        console.log(result); // Prints "FooBar"
         
        return cachedFoo("Plop"); // Prints "foo has been called." because no cache is available yet for this argument.
    })
    .done();
   ```

## Options

The `cache` function can take a second parameter :
```js
    var cachedFoo = cache(foo, {
        tmpDir: os.tmpdir(),
        useMemoryCache: true,
        useFileCache: true,
        serializer: JSON.stringify,
        unserializer: JSON.parse,
        hasher: require('string-hash'),
        tmpPrefix: "function-cache"
    });
```
### useMemoryCache
If set to true, a memory cache is used.
Defaults to `true`.

### useFileCache
If set to true, files are written and read from the temporary directory.
Defaults to `true`.

### tmpDir
This is the path to the folder in which the cache files will be stored (if useFileCache == true).
Defaults to `os.tmpdir()`.

### tmpPrefix
This is a prefix used in cache files names.
Defaults to `"function-cache"`.

### hasher
A synchronous function to generate unique hash from given string.
Defaults to `string-hash`.
 
### serializer
A synchronous function to serialize function arguments and result for cache storage.
Defaults to `JSON.stringify`.

### unserializer
A synchronous function to unserialize cached function arguments and result.
Defaults to `JSON.parse`.
