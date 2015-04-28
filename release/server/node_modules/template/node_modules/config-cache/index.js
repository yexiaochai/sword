/*!
 * config-cache <https://github.com/jonschlinkert/config-cache>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var Base = require('class-extend');
var typeOf = require('kind-of');
var expander = require('expander');
var extend = require('extend-shallow');
var Emitter = require('component-emitter');
var flatten = require('arr-flatten');
var clone = require('clone-deep');
var rest = require('array-rest');
var union = require('arr-union');
var hasOwnDeep = require('has-own-deep');
var omit = require('object.omit');
var set = require('set-value');
var get = require('get-value');
var has = require('has-value');
var forIn = require('for-in');
var Plasma = require('plasma');
var expand = expander.process;
var hasOwn = Object.prototype.hasOwnProperty;

/**
 * Initialize a new `Cache`
 *
 * ```js
 * var cache = new Cache();
 * ```
 *
 * @class Cache
 * @param {Object} `obj` Optionally pass an object to initialize with.
 * @constructor
 * @api public
 */

function Cache (cache) {
  Emitter.call(this);
  this.cache = cache || {};
  this.cache.data = this.cache.data || {};
  this._ = this._ || {};
  this._.plasma = new Plasma(this.cache.data);
}

Base.extend(Cache.prototype);
Cache.extend = Base.extend;
extend(Cache.prototype, Emitter.prototype);

/**
 * Assign `value` to `key` or return the value of `key`.
 *
 * ```js
 * cache.set(key, value);
 * ```
 *
 * @param {String} `key`
 * @param {*} `value`
 * @param {Boolean} `expand` Resolve template strings with [expander]
 * @return {Object} `Cache` to enable chaining
 * @api public
 */

Cache.prototype.set = function(key, value, expand) {
  if (arguments.length === 1 && typeOf(key) === 'object') {
    this.extend(key);
    this.emit('set', key, value);
    return this;
  }
  if (expand) {
    value = this.process(value, this.cache);
    this.set(key, value, false);
  } else {
    set(this.cache, key, value);
  }
  this.emit('set', key, value);
  return this;
};

/**
 * Return the stored value of `key`. Dot notation may be used
 * to get [nested property values][get-value].
 *
 * ```js
 * cache.set('foo', 'bar');
 * cache.get('foo');
 * // => "bar"
 *
 * // also takes an array or list of property paths
 * cache.set({data: {name: 'Jon'}})
 * cache.get('data', 'name');
 * //=> 'Jon'
 * ```
 *
 * @param {*} `key`
 * @param {Boolean} `escape`
 * @return {*}
 * @api public
 */

Cache.prototype.get = function(key, escape) {
  return key ? get(this.cache, key, escape) : this.cache;
};

/**
 * Set a constant on the cache.
 *
 * **Example**
 *
 * ```js
 * cache.constant('site.title', 'Foo');
 * ```
 *
 * @param {String} `key`
 * @param {*} `value`
 * @chainable
 * @api public
 */

Cache.prototype.constant = function(key, value, namespace) {
  var getter;
  if (typeof value !== 'function'){
    getter = function() {
      return value;
    };
  } else {
    getter = value;
  }

  namespace = namespace || 'cache';
  this[namespace] = this[namespace] || {};
  this[namespace].__defineGetter__(key, getter);
  return this;
};

/**
 * Return the keys on `this.cache`.
 *
 * ```js
 * cache.keys();
 * ```
 *
 * @return {Boolean}
 * @api public
 */

Cache.prototype.keys = function(o) {
  return Object.keys(o || this.cache);
};

/**
 * Return true if `key` is an own, enumerable property
 * of `this.cache` or the given `obj`.
 *
 * ```js
 * cache.hasOwn([key]);
 * ```
 *
 * @param  {String} `key`
 * @param  {Object} `obj` Optionally pass an object to check.
 * @return {Boolean}
 * @api public
 */

Cache.prototype.hasOwn = function(key, o) {
  return hasOwn.call(o || this.cache, key);
};

/*
 * Return true if `key` exists in `cache`. Dot notation may
 * be used for nested properties.
 *
 * **Example**
 *
 * ```js
 * cache.exists('author.name');
 * //=> true
 * ```
 *
 * @param   {String}  `key`
 * @return  {Boolean}
 * @api public
 */

Cache.prototype.exists = function(key, escape) {
  return hasOwnDeep(this.cache, key, escape);
};

/*
 * Return true if `property` exists and has a non-null value.
 * Dot notation may be used for nested properties.
 *
 * **Example**
 *
 * ```js
 * cache.has('author.name');
 * //=> true
 * ```
 *
 * @param   {String}  `property`
 * @return  {Boolean}
 * @api public
 */

Cache.prototype.has = function(prop) {
  return has(this.cache, prop);
};

/**
 * Add values to an array on the `cache`. This method
 * is chainable.
 *
 * **Example**
 *
 * ```js
 * // config.cache['foo'] => ['a.hbs', 'b.hbs']
 * cache
 *   .union('foo', ['b.hbs', 'c.hbs'], ['d.hbs']);
 *   .union('foo', ['e.hbs', 'f.hbs']);
 *
 * // config.cache['foo'] => ['a.hbs', 'b.hbs', 'c.hbs', 'd.hbs', 'e.hbs', 'f.hbs']
 * ```
 *
 * @chainable
 * @return {Object} `Cache` to enable chaining
 * @api public
 */

Cache.prototype.union = function(key, array) {
  if (typeof key !== 'string') {
    throw new Error('config-cache#union expects `key` to be a string.');
  }

  var arr = this.get(key) || [];
  var len = arguments.length - 1;
  var args = new Array(len);

  for (var i = 0; i < len; i++) {
    args[i] = arguments[i + 1];
  }

  this.set(key, union(arr, flatten(args)));
  this.emit('union', key);
  return this;
};

/**
 * Extend the `cache` with the given object.
 * This method is chainable.
 *
 * **Example**
 *
 * ```js
 * cache
 *   .extend({foo: 'bar'}, {baz: 'quux'});
 *   .extend({fez: 'bang'});
 * ```
 *
 * Or define the property to extend:
 *
 * ```js
 * cache
 *   // extend `cache.a`
 *   .extend('a', {foo: 'bar'}, {baz: 'quux'})
 *   // extend `cache.b`
 *   .extend('b', {fez: 'bang'})
 *   // extend `cache.a.b.c`
 *   .extend('a.b.c', {fez: 'bang'});
 * ```
 *
 * @chainable
 * @return {Object} `Cache` to enable chaining
 * @api public
 */

Cache.prototype.extend = function() {
  var len = arguments.length;
  var args = new Array(len);

  for (var i = 0; i < len; i++) {
    args[i] = arguments[i];
  }

  if (typeof args[0] === 'string') {
    var o = this.get(args[0]) || {};
    o = extend.apply(extend, union([o], rest(args)));
    this.set(args[0], o);
    this.emit('extend');
    return this;
  }
  extend.apply(extend, union([this.cache], args));
  this.emit('extend');
  return this;
};

/**
 * Clone the given `obj` or `cache`.
 *
 * ```js
 * cache.clone();
 * ```
 *
 * @param  {Object} `obj` Optionally pass an object to clone.
 * @return {Boolean}
 * @api public
 */

Cache.prototype.clone = function(o) {
  return clone(o || this.cache);
};

/**
 * Return methods on `this.cache` or the given `obj`.
 *
 * ```js
 * cache.methods('foo')
 * //=> ['set', 'get', 'enable', ...]
 * ```
 *
 * @param {Object} `obj`
 * @return {Array}
 * @api public
 */

Cache.prototype.methods = function(o) {
  return methods(o || this.cache);
};

/**
 * # Data methods
 *
 * > Methods for reading data files, processing template strings and
 * extending the `cache.data` object.
 *
 * @api public
 */

/**
 * Use [expander] to recursively expand template strings into
 * their resolved values.
 *
 * **Example**
 *
 * ```js
 * cache.process({a: '<%= b %>', b: 'c'});
 * //=> {a: 'c', b: 'c'}
 * ```
 *
 * @param {*} `lookup` Any value to process, usually strings with a
 *                     cache template, like `<%= foo %>` or `${foo}`.
 * @param {*} `opts` Options to pass to Lo-Dash `_.template`.
 * @api public
 */

Cache.prototype.process = function(lookup, context) {
  var len = arguments.length;
  if (!len) {
    lookup = context = this.cache.data;
  } else {
    context = context || this.cache.data;
    if (typeOf(lookup) === 'object') {
      context = extend({}, context, lookup);
    }
  }

  var methods = this.methods(context);
  var o = expand(context, lookup, {
    imports: methods
  });

  if (!len) {
    extend(this.cache.data, o);
  }
  return o;
};

/**
 * If a `data` property is on the given `data` object
 * (e.g. `data.data`, like when files named `data.json`
 * or `data.yml` are used), the value of `data.data`'s
 * is flattened to the root `data` object.
 *
 * @param {Object} `data`
 * @return {Object} Returns the flattened object.
 */

Cache.prototype.flattenData = function(data, keys) {
  keys = keys || 'data';
  keys = !Array.isArray(keys) ? [keys] : keys;

  var len = keys.length;
  while (len--) {
    if (this.hasOwn(keys[len], data)) {
      extend(data, data[keys[len]]);
      delete data[keys[len]];
    }
  }
  return data;
};

/**
 * Extend the `cache.data` object with the given data. This
 * method is chainable.
 *
 * **Example**
 *
 * ```js
 * cache
 *   .extendData({foo: 'bar'}, {baz: 'quux'});
 *   .extendData({fez: 'bang'});
 * ```
 *
 * @chainable
 * @return {Object} `Cache` to enable chaining
 * @api public
 */

Cache.prototype.extendData = function() {
  var len = arguments.length;
  var args = new Array(len);

  for (var i = 0; i < len; i++) {
    args[i] = arguments[i];
  }

  if (typeof args[0] === 'string') {
    this.extend.apply(this, ['data.' + args[0]].concat(rest(args)));
    this.emit('extendData');
    return this;
  }

  this.extend.apply(this, ['data'].concat(args));
  this.emit('extendData');
  return this;
};

/**
 * Extend the `data` object with the value returned by [plasma].
 *
 * **Example:**
 *
 * ```js
 * cache
 *   .plasma({foo: 'bar'}, {baz: 'quux'});
 *   .plasma({fez: 'bang'});
 * ```
 *
 * See the [plasma] documentation for all available options.
 *
 * @param {Object|String|Array} `data` File path(s), glob pattern, or object of data.
 * @param {Object} `options` Options to pass to plasma.
 * @api public
 */

Cache.prototype.plasma = function() {
  return this._.plasma.load.apply(this._.plasma, arguments);
};

/**
 * Extend the `cache.data` object with data from a JSON
 * or YAML file, or by passing an object directly - glob
 * patterns or file paths may be used.
 *
 * ```js
 * cache
 *   .data({a: 'b'})
 *   .data({c: 'd'});
 *
 * console.log(config.cache);
 * //=> {data: {a: 'b', c: 'd'}}
 * ```
 *
 * When `true` is passed as the last argumemnt data will
 * be processed by [expander] before extending `cache.data`.
 *
 * ```js
 * cache.data({a: '<%= b %>', b: 'z'})
 * //=> {data: {a: 'z', b: 'z'}}
 * ```
 *
 * @param {Object|Array|String} `values` Values to pass to plasma.
 * @param {Boolean} `process` If `true`,
 * @return {Object} `Cache` to enable chaining
 * @api public
 */

Cache.prototype.data = function() {
  var len = arguments.length;
  var args = new Array(len);

  for (var i = 0; i < len; i++) {
    args[i] = arguments[i];
  }

  if (!len) {
    return this.cache.data;
  }

  var o = {}, last;

  // 1) when the last arg is `true`...
  if (typeof args[len - 1] === 'boolean') {
    last = args[len - 1];
    args = args.slice(1);
  }

  extend(o, this.plasma.apply(this, args));
  o = this.flattenData(o);

  // 2) process data with expander
  if (last) {
    this.extendData(this.process(o));
    return this;
  }

  this.extendData(o);
  this.emit('data');
  return this;
};

/**
 * # Clearing the cache
 *
 * > Methods for clearing the cache, removing or reseting specific
 * values on the cache.
 *
 * @section
 */


/**
 * Omit properties from the `cache`.
 *
 * **Example:**
 *
 * ```js
 * cache
 *   .omit('foo');
 *   .omit('foo', 'bar');
 *   .omit(['foo']);
 *   .omit(['foo', 'bar']);
 * ```
 *
 * @chainable
 * @return {Object} `Cache` to enable chaining
 * @api public
 */

Cache.prototype.omit = function(keys) {
  if (keys == null) return this;
  keys = arrayify(keys);
  this.cache = omit(this.cache, keys);
  this.emit('omit', keys);
  return this;
};

/**
 * Remove `key` from the cache, or if no value is
 * specified the entire cache is reset.
 *
 * **Example:**
 *
 * ```js
 * cache.clear();
 * ```
 *
 * @chainable
 * @api public
 */

Cache.prototype.clear = function(key) {
  if (key) {
    delete this.cache[key];
    this.emit('clear', key);
  } else {
    this.cache = {};
    this.emit('clear');
  }
};

/**
 * Cast `val` to an array
 */

function arrayify(val) {
  return Array.isArray(val) ? val : [val];
}

/**
 * Utility function for concatenating array
 * elements.
 */

function methods(o) {
  var res = {};
  forIn(o, function (val, key) {
    if (typeof val === 'function') {
      res[key] = val;
    }
  });
  return res;
}

/**
 * Expose `Cache`
 */

module.exports = Cache;
