# loader-cache [![NPM version](https://badge.fury.io/js/loader-cache.svg)](http://badge.fury.io/js/loader-cache)  [![Build Status](https://travis-ci.org/jonschlinkert/loader-cache.svg)](https://travis-ci.org/jonschlinkert/loader-cache) 

> Register loader functions that dynamically read, parse or otherwise transform file contents when the name of the loader matches a file extension. You can also compose loaders from other loaders.

## Install with [npm](npmjs.org)

```bash
npm i loader-cache --save
```

## Example

```js
// register a loader for parsing YAML
loaders.register('yaml', function(fp) {
  return YAML.safeLoad(fp);
});

// register a loader to be used in other loaders
loaders.register('read', function(fp) {
  return fs.readFileSync(fp, 'utf8');
});

// create a new loader from the `yaml` and `read` loaders.
loaders.register('yml', ['read', 'yaml']);

// the `.load()` method calls any loaders registered
// to the `ext` on the given filepath
loaders.load('config.yml');
```

## Running tests
Install dev dependencies.

```bash
npm i -d && npm test
```


## Usage

```js
var loaders = require('loader-cache');
```

## API
### [Loaders](./index.js#L37)

Create a new instance of `Loaders`

```js
var Loaders = require('loader-cache');
var loaders = new Loaders();
```

### [.registerSync](./index.js#L67)

* `ext` **{String|Array}**: File extension or name of the loader.    
* `fn` **{Function|Array}**: A loader function, or create a loader from other others by passing an array of names.    
* `returns` **{Object}** `Loaders`: to enable chaining  

Register the given loader callback `fn` as `ext`. Any arbitrary
name can be assigned to a loader, however, the loader will only be
called when either:
  a. `ext` matches the file extension of a path passed to the `.load()` method, or
  b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.

### [.registerAsync](./index.js#L84)

* `ext` **{String|Array}**: File extension or name of the loader.    
* `fn` **{Function|Array}**: A loader function with a callback parameter, or create a loader from other others by passing an array of names.    
* `returns` **{Object}** `Loaders`: to enable chaining  

Register the given async loader callback `fn` as `ext`. Any arbitrary
name can be assigned to a loader, however, the loader will only be
called when either:
  a. `ext` matches the file extension of a path passed to the `.load()` method, or
  b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.

### [.registerPromise](./index.js#L103)

* `ext` **{String|Array}**: File extension or name of the loader.    
* `fn` **{Function|Array}**: A loader function that returns a promise, or create a loader from other others by passing an array of names.    
* `returns` **{Object}** `Loaders`: to enable chaining  

Register the given promise loader callback `fn` as `ext`. Any arbitrary
name can be assigned to a loader, however, the loader will only be
called when either:
  a. `ext` matches the file extension of a path passed to the `.load()` method, or
  b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.

### [.registerStream](./index.js#L122)

* `ext` **{String|Array}**: File extension or name of the loader.    
* `fn` **{Stream|Array}**: A stream loader, or create a loader from other others by passing an array of names.    
* `returns` **{Object}** `Loaders`: to enable chaining  

Register the given stream loader callback `fn` as `ext`. Any arbitrary
name can be assigned to a loader, however, the loader will only be
called when either:
  a. `ext` matches the file extension of a path passed to the `.load()` method, or
  b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.

### [.load](./index.js#L236)

Run loaders associated with `ext` of the given filepath.

* `val` **{String}**: Value to load, like a file path.    
* `options` **{String}**: Options to pass to whatever loaders are defined.    
* `returns`: {String}  

**Example**

```js
// this will run the `yml` loader from the `.compose()` example
loaders.load('config.yml');
```

### [.loadAsync](./index.js#L282)

Run async loaders associated with `ext` of the given filepath.

* `fp` **{String}**: File path to load.    
* `options` **{Object}**: Options to pass to whatever loaders are defined.    
* `cb` **{Function}**: Callback to indicate loading has finished    
* `returns`: {String}  

**Example**

```js
// this will run the `yml` async loader from the `.compose()` example
loaders.loadAsync('config.yml', function (err, obj) {
  // do some async stuff
});
```

### [.loadPromise](./index.js#L328)

Run promise loaders associated with `ext` of the given filepath.

* `fp` **{String}**: File path to load.    
* `options` **{Object}**: Options to pass to whatever loaders are defined.    
* `returns` **{Promise}**: a promise that will be fulfilled later  

**Example**

```js
// this will run the `yml` promise loader from the `.compose()` example
loaders.loadPromise('config.yml')
  .then(function (results) {
    // do some promise stuff
  });
```

### [.loadStream](./index.js#L373)

Run stream loaders associated with `ext` of the given filepath.

* `fp` **{String}**: File path to load.    
* `options` **{Object}**: Options to pass to whatever loaders are defined.    
* `returns` **{Stream}**: a stream that will be fulfilled later  

**Example**

```js
// this will run the `yml` stream loader from the `.compose()` example
loaders.LoadStream('config.yml')
  .pipe(foo())
  .on('data', function (results) {
    // do stuff
  });
```


## Contributing
Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/jonschlinkert/loader-cache/issues)

## Author

**Jon Schlinkert**
 
+ [github/jonschlinkert](https://github.com/jonschlinkert)
+ [twitter/jonschlinkert](http://twitter.com/jonschlinkert) 


## License
Copyright (c) 2015 Jon Schlinkert  
Released under the MIT license

***

_This file was generated by [verb-cli](https://github.com/assemble/verb-cli) on March 10, 2015._