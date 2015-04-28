# config-cache [![NPM version](https://badge.fury.io/js/config-cache.svg)](http://badge.fury.io/js/config-cache)  [![Build Status](https://travis-ci.org/jonschlinkert/config-cache.svg)](https://travis-ci.org/jonschlinkert/config-cache) 

> General purpose JavaScript object storage methods.

## Install with [npm](npmjs.org)

```bash
npm i config-cache --save
```

## Usage

```js
var Config = require('config-cache');
var config = new Config();
```

## API
### [Cache](./index.js#L42)

Initialize a new `Cache`

* `obj` **{Object}**: Optionally pass an object to initialize with.    

```js
var cache = new Cache();
```

### [.set](./index.js#L68)

Assign `value` to `key` or return the value of `key`.

* `key` **{String}**    
* `value` **{*}**    
* `expand` **{Boolean}**: Resolve template strings with [expander]    
* `returns` **{Object}** `Cache`: to enable chaining  

```js
cache.set(key, value);
```

### [.get](./index.js#L105)

Return the stored value of `key`. Dot notation may be used to get [nested property values][get-value].

* `key` **{*}**    
* `escape` **{Boolean}**    
* `returns`: {*}  

```js
cache.set('foo', 'bar');
cache.get('foo');
// => "bar"

// also takes an array or list of property paths
cache.set({data: {name: 'Jon'}})
cache.get('data', 'name');
//=> 'Jon'
```

### [.constant](./index.js#L124)

Set a constant on the cache.

* `key` **{String}**    
* `value` **{*}**    

**Example**

```js
cache.constant('site.title', 'Foo');
```

### [.keys](./index.js#L151)

Return the keys on `this.cache`.

* `returns`: {Boolean}  

```js
cache.keys();
```

### [.hasOwn](./index.js#L169)

Return true if `key` is an own, enumerable property of `this.cache` or the given `obj`.

* `key` **{String}**    
* `obj` **{Object}**: Optionally pass an object to check.    
* `returns`: {Boolean}  

```js
cache.hasOwn([key]);
```

### [.exists](./index.js#L189)

Return true if `key` exists in `cache`. Dot notation may be used for nested properties.

* `key` **{String}**    
* `returns`: {Boolean}  

**Example**

```js
cache.exists('author.name');
//=> true
```

### [.has](./index.js#L209)

Return true if `property` exists and has a non-null value. Dot notation may be used for nested properties.

* `property` **{String}**    
* `returns`: {Boolean}  

**Example**

```js
cache.has('author.name');
//=> true
```

### [.union](./index.js#L233)

Add values to an array on the `cache`. This method is chainable.

* `returns` **{Object}** `Cache`: to enable chaining  

**Example**

```js
// config.cache['foo'] => ['a.hbs', 'b.hbs']
cache
  .union('foo', ['b.hbs', 'c.hbs'], ['d.hbs']);
  .union('foo', ['e.hbs', 'f.hbs']);

// config.cache['foo'] => ['a.hbs', 'b.hbs', 'c.hbs', 'd.hbs', 'e.hbs', 'f.hbs']
```

### [.extend](./index.js#L280)

Extend the `cache` with the given object. This method is chainable.

* `returns` **{Object}** `Cache`: to enable chaining  

**Example**

```js
cache
  .extend({foo: 'bar'}, {baz: 'quux'});
  .extend({fez: 'bang'});
```

Or define the property to extend:

```js
cache
  // extend `cache.a`
  .extend('a', {foo: 'bar'}, {baz: 'quux'})
  // extend `cache.b`
  .extend('b', {fez: 'bang'})
  // extend `cache.a.b.c`
  .extend('a.b.c', {fez: 'bang'});
```

### [.clone](./index.js#L312)

Clone the given `obj` or `cache`.

* `obj` **{Object}**: Optionally pass an object to clone.    
* `returns`: {Boolean}  

```js
cache.clone();
```

### [.methods](./index.js#L329)

Return methods on `this.cache` or the given `obj`.

* `obj` **{Object}**    
* `returns`: {Array}  

```js
cache.methods('foo')
//=> ['set', 'get', 'enable', ...]
```

### [Data methods](./index.js#L342)


> Methods for reading data files, processing template strings and
extending the `cache.data` object.

### [.process](./index.js#L359)

Use [expander] to recursively expand template strings into their resolved values.

* `lookup` **{*}**: Any value to process, usually strings with a cache template, like `<%= foo %>` or `${foo}`.    
* `opts` **{*}**: Options to pass to Lo-Dash `_.template`.    

**Example**

```js
cache.process({a: '<%= b %>', b: 'c'});
//=> {a: 'c', b: 'c'}
```

### [.extendData](./index.js#L422)

Extend the `cache.data` object with the given data. This method is chainable.

* `returns` **{Object}** `Cache`: to enable chaining  

**Example**

```js
cache
  .extendData({foo: 'bar'}, {baz: 'quux'});
  .extendData({fez: 'bang'});
```

### [.plasma](./index.js#L459)

Extend the `data` object with the value returned by [plasma].

* `data` **{Object|String|Array}**: File path(s), glob pattern, or object of data.    
* `options` **{Object}**: Options to pass to plasma.    

**Example:**

```js
cache
  .plasma({foo: 'bar'}, {baz: 'quux'});
  .plasma({fez: 'bang'});
```

See the [plasma] documentation for all available options.

### [.data](./index.js#L491)

Extend the `cache.data` object with data from a JSON or YAML file, or by passing an object directly - glob patterns or file paths may be used.

* `values` **{Object|Array|String}**: Values to pass to plasma.    
* `process` **{Boolean}**: If `true`,    
* `returns` **{Object}** `Cache`: to enable chaining  

```js
cache
  .data({a: 'b'})
  .data({c: 'd'});

console.log(config.cache);
//=> {data: {a: 'b', c: 'd'}}
```

When `true` is passed as the last argumemnt data will
be processed by [expander] before extending `cache.data`.

```js
cache.data({a: '<%= b %>', b: 'z'})
//=> {data: {a: 'z', b: 'z'}}
```

## [Clearing the cache](./index.js#L534)


> Methods for clearing the cache, removing or reseting specific
values on the cache.

### [.omit](./index.js#L553)

Omit properties from the `cache`.

* `returns` **{Object}** `Cache`: to enable chaining  

**Example:**

```js
cache
  .omit('foo');
  .omit('foo', 'bar');
  .omit(['foo']);
  .omit(['foo', 'bar']);
```

### [.clear](./index.js#L575)

Remove `key` from the cache, or if no value is specified the entire cache is reset.

**Example:**

```js
cache.clear();
```

## Usage Examples

### .set

If `expand: true` is defined on the options, the value will be set using [expander].

**Examples:**

```js
// as a key-value pair
cache.set('a', {b: 'c'});

// or as an object
cache.set({a: {b: 'c'}});

// chaining is possible
cache
  .set({a: {b: 'c'}})
  .set('d', 'e');
```

Expand template strings with expander:

```js
cache.set('a', {b: '${c}', c: 'd'}, true);
```

Visit the [expander] docs for more info.

## Related
 * [option-cache](https://github.com/jonschlinkert/option-cache): Simple API for managing options in JavaScript applications.
 * [map-cache](https://github.com/jonschlinkert/map-cache): Basic cache object for storing key-value pairs.
 * [cache-base](https://github.com/jonschlinkert/cache-base): Generic object cache for node.js/javascript projects.
 * [engine-cache](https://github.com/jonschlinkert/engine-cache): express.js inspired template-engine manager.
 * [loader-cache](https://github.com/jonschlinkert/loader-cache): Register loader functions that dynamically read, parse or otherwise transform file contents when the name of the loader matches a file extension. You can also compose loaders from other loaders.
 * [parser-cache](https://github.com/jonschlinkert/parser-cache): Cache and load parsers, similiar to consolidate.js engines.
 * [helper-cache](https://github.com/jonschlinkert/helper-cache): Easily register and get helper functions to be passed to any template engine or node.js application. Methods for both sync and async helpers.
 * [get-value](https://github.com/jonschlinkert/get-value): Use property paths (`a.b.c`) get a nested value from an object.
 * [set-value](https://github.com/jonschlinkert/set-value): Create nested values and any intermediaries using dot notation (`'a.b.c'`) paths.
 * [has-value](https://github.com/jonschlinkert/has-value): Returns true if a value exists, false if empty. Works with deeply nested values using object paths.

## Contributing
Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/jonschlinkert/config-cache/issues)

## Running tests
Install dev dependencies:

```bash
npm i -d && npm test
```

## Author

**Jon Schlinkert**

+ [github/jonschlinkert](https://github.com/jonschlinkert)
+ [twitter/jonschlinkert](http://twitter.com/jonschlinkert) 

## License
Copyright (c) 2015 Jon Schlinkert  
Released under the MIT license

***

_This file was generated by [verb-cli](https://github.com/assemble/verb-cli) on April 09, 2015._

[arr-flatten]: https://github.com/jonschlinkert/arr-flatten
[arr-union]: https://github.com/jonschlinkert/arr-union
[array-rest]: https://github.com/jonschlinkert/array-rest
[class-extend]: https://github.com/SBoudrias/class-extend
[clone-deep]: https://github.com/jonschlinkert/clone-deep
[emitter]: https://github.com/component/emitter
[expander]: https://github.com/tkellen/expander
[extend-shallow]: https://github.com/jonschlinkert/extend-shallow
[for-in]: https://github.com/jonschlinkert/for-in
[get-value]: https://github.com/jonschlinkert/get-value
[has-own-deep]: https://github.com/jonschlinkert/has-own-deep
[has-value]: https://github.com/jonschlinkert/has-value
[kind-of]: https://github.com/jonschlinkert/kind-of
[object]: https://github.com/jonschlinkert/object
[plasma]: https://github.com/jonschlinkert/plasma
[set-value]: https://github.com/jonschlinkert/set-value

[expander]: https://github.com/tkellen/expander
[get-value]: https://github.com/jonschlinkert/get-value
[set-value]: https://github.com/jonschlinkert/set-value
[has-value]: https://github.com/jonschlinkert/has-value

<!-- deps:mocha -->
