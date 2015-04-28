/*!
 * loader-cache <https://github.com/jonschlinkert/loader-cache>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var path = require('path');
var typeOf = require('kind-of');

/**
 * Expose `Loaders`
 */

module.exports = Loaders;

/**
 * requires cache
 */

var requires = {};

/**
 * Create a new instance of `Loaders`
 *
 * ```js
 * var Loaders = require('loader-cache');
 * var loaders = new Loaders();
 * ```
 *
 * @class `Loaders`
 * @api public
 */

function Loaders(cache) {
  this.cache = cache || {};
}

/**
 * Base register method used by all other register method.
 *
 * @param {String} `ext`
 * @param {Function} `fn`
 * @param {String} `type`
 * @return {String}
 */

Loaders.prototype.register = function(/*ext, fns, arr, type*/) {
  return this.compose.apply(this, arguments);
};

/**
 * Register the given loader callback `fn` as `ext`. Any arbitrary
 * name can be assigned to a loader, however, the loader will only be
 * called when either:
 *   a. `ext` matches the file extension of a path passed to the `.load()` method, or
 *   b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.
 *
 * @param {String|Array} `ext` File extension or name of the loader.
 * @param {Function|Array} `fn` A loader function, or create a loader from other others by passing an array of names.
 * @return {Object} `Loaders` to enable chaining
 * @api public
 */

Loaders.prototype.registerSync = function(ext, stack, fn) {
  this.register(ext, stack, fn, 'sync');
};

/**
 * Register the given async loader callback `fn` as `ext`. Any arbitrary
 * name can be assigned to a loader, however, the loader will only be
 * called when either:
 *   a. `ext` matches the file extension of a path passed to the `.load()` method, or
 *   b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.
 *
 * @param {String|Array} `ext` File extension or name of the loader.
 * @param {Function|Array} `fn` A loader function with a callback parameter, or create a loader from other others by passing an array of names.
 * @return {Object} `Loaders` to enable chaining
 * @api public
 */

Loaders.prototype.registerAsync = function(/*ext, stack, fn*/) {
  var i = arguments.length, args = new Array(i);
  while (i--) args[i] = arguments[i];
  this.register.apply(this, args.concat('async'));
};

/**
 * Register the given promise loader callback `fn` as `ext`. Any arbitrary
 * name can be assigned to a loader, however, the loader will only be
 * called when either:
 *   a. `ext` matches the file extension of a path passed to the `.load()` method, or
 *   b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.
 *
 * @param {String|Array} `ext` File extension or name of the loader.
 * @param {Function|Array} `fn` A loader function that returns a promise, or create a loader from other others by passing an array of names.
 * @return {Object} `Loaders` to enable chaining
 * @api public
 */

Loaders.prototype.registerPromise = function(/*ext, stack, fn*/) {
  var i = arguments.length, args = new Array(i);
  while (i--) args[i] = arguments[i];
  this.register.apply(this, args.concat('promise'));
};

/**
 * Register the given stream loader callback `fn` as `ext`. Any arbitrary
 * name can be assigned to a loader, however, the loader will only be
 * called when either:
 *   a. `ext` matches the file extension of a path passed to the `.load()` method, or
 *   b. `ext` is an arbitrary name passed on the loader stack of another loader. Example below.
 *
 * @param {String|Array} `ext` File extension or name of the loader.
 * @param {Stream|Array} `fn` A stream loader, or create a loader from other others by passing an array of names.
 * @return {Object} `Loaders` to enable chaining
 * @api public
 */

Loaders.prototype.registerStream = function(/*ext, stack, fn*/) {
  var i = arguments.length, args = new Array(i);
  while (i--) args[i] = arguments[i];
  this.register.apply(this, args.concat('stream'));
};

/**
 * Create a loader from other (previously cached) loaders. For
 * example, you might create a loader like the following:
 *
 *
 * @param {String} `ext` File extension to select the loader or loader stack to use.
 * @param {String} `loaders` Array of loader names.
 * @return {Object} `Loaders` to enable chaining
 */

Loaders.prototype.compose = function(ext/*, stack, fns*/) {
  var len = arguments.length - 1, i = 1;
  var stack = [], type;

  while (len--) {
    var arg = arguments[i++];
    if (typeof arg === 'string') {
      type = arg;
    } else if (arg) {
      stack.push(arg);
    }
  }

  if (typeof type === 'undefined') {
    type = 'sync';
  }

  this.cache[type] = this.cache[type] || {};
  stack = this.buildStack(type, stack);

  this.cache[type][ext] = union(this.cache[type][ext] || [], stack);
  return this;
};

/**
 * Create a from other (previously cached) loaders.
 *
 * @param {String} `name` Name of the loader or loader stack to use, usually this is a file extension.
 * @param {String} `loaders` Array of loader names.
 * @return {Object} `Loaders` to enable chaining
 */

Loaders.prototype.composeStream = function() {
  var fn = this._makeComposer('stream');
  return fn.apply(fn, arguments);
};

/**
 * Internal method for creating composers.
 *
 * @param {String} `type` The type of composer to create.
 * @return {Function} Composer function for the given `type.
 */

Loaders.prototype._makeComposer = function() {
  return function () {
    // don't slice args (for v8 optimizations)
    var len = arguments.length, i = 0;
    var args = new Array(i);
    while (len--) {
      args[i] = arguments[i++];
    }
    args[i] = 'stream';
    this.compose.apply(this, args);
  }.bind(this);
};

/**
 * Build a stack of loader functions when given a mix of functions and names.
 *
 * @param  {String} `type` Loader type to get loaders from.
 * @param  {Array}  `stack` Stack of loader functions and names.
 * @return {Array}  Resolved loader functions
 */

Loaders.prototype.buildStack = function(type, stack) {
  var len = stack && stack.length, i = 0;
  var res = [];

  while (i < len) {
    var name = stack[i++];
    if (typeOf(name) === 'string') {
      res = res.concat(this.cache[type][name]);
    } else if (typeOf(name) === 'array') {
      res = res.concat(this.buildStack(type, name));
    } else {
      res.push(name);
    }
  }
  return res;
};

/**
 * Run loaders associated with `ext` of the given filepath.
 *
 * **Example**
 *
 * ```js
 * // this will run the `yml` loader from the `.compose()` example
 * loaders.load('config.yml');
 * ```
 *
 * @param {String} `val` Value to load, like a file path.
 * @param {String} `options` Options to pass to whatever loaders are defined.
 * @return {String}
 * @api public
 */

Loaders.prototype.load = function(val, stack, options) {
  if (!Array.isArray(stack)) {
    options = stack; stack = [];
  }

  var loader = matchLoader(val, options, this);
  stack = this.buildStack('sync', stack);

  var fns = [];
  if (this.cache.sync.hasOwnProperty(loader)) {
    fns = fns.concat(this.cache.sync[loader]);
  }

  if (stack && stack.length) {
    fns = fns.concat(stack);
  }

  if (!fns.length) return val;
  var len = fns.length, i = 0;

  while (len--) {
    var fn = fns[i++];
    val = fn(val, options);
  }
  return val;
};

/**
 * Run async loaders associated with `ext` of the given filepath.
 *
 * **Example**
 *
 * ```js
 * // this will run the `yml` async loader from the `.compose()` example
 * loaders.loadAsync('config.yml', function (err, obj) {
 *   // do some async stuff
 * });
 * ```
 *
 * @param {String} `fp` File path to load.
 * @param {Object} `options` Options to pass to whatever loaders are defined.
 * @param {Function} `cb` Callback to indicate loading has finished
 * @return {String}
 * @api public
 */

Loaders.prototype.loadAsync = function(fp, stack, options, cb) {
  var async = requires.async || (requires.async = require('async'));
  if (typeOf(stack) === 'function') {
    cb = stack; stack = []; options = {};
  }

  if (typeOf(options) === 'function') {
    cb = options; options = {};
  }

  if (!Array.isArray(stack)) {
    options = stack; stack = [];
  }

  stack = this.buildStack('async', stack);

  var loader = matchLoader(fp, options, this);
  var fns = union(this.cache.async[loader] || [], stack);
  if (!fns.length) {
    return fp;
  }

  async.reduce(fns, fp, function (acc, fn, next) {
    fn(acc, options, next);
  }, cb);
};

/**
 * Run promise loaders associated with `ext` of the given filepath.
 *
 * **Example**
 *
 * ```js
 * // this will run the `yml` promise loader from the `.compose()` example
 * loaders.loadPromise('config.yml')
 *   .then(function (results) {
 *     // do some promise stuff
 *   });
 * ```
 *
 * @param {String} `fp` File path to load.
 * @param {Object} `options` Options to pass to whatever loaders are defined.
 * @return {Promise} a promise that will be fulfilled later
 * @api public
 */

Loaders.prototype.loadPromise = function(fp, stack, options) {
  var Promise = requires.promise || (requires.promise = require('bluebird'));
  if (!Array.isArray(stack)) {
    options = stack;
    stack = [];
  }

  var current = Promise.resolve();
  options = options || {};

  var loader = matchLoader(fp, options, this);
  stack = this.buildStack('promise', stack);

  var fns = union(this.cache.promise[loader] || [], stack);
  if (!fns.length) {
    return current.then(function () {
      return fp;
    });
  }

  return Promise.reduce(fns, function (acc, fn) {
    return fn(acc, options);
  }, fp);
};

/**
 * Run stream loaders associated with `ext` of the given filepath.
 *
 * **Example**
 *
 * ```js
 * // this will run the `yml` stream loader from the `.compose()` example
 * loaders.LoadStream('config.yml')
 *   .pipe(foo())
 *   .on('data', function (results) {
 *     // do stuff
 *   });
 * ```
 *
 * @param {String} `fp` File path to load.
 * @param {Object} `options` Options to pass to whatever loaders are defined.
 * @return {Stream} a stream that will be fulfilled later
 * @api public
 */

Loaders.prototype.loadStream = function(fp, stack, options) {
  var es = requires.es || (requires.es = require('event-stream'));
  if (!Array.isArray(stack)) {
    options = stack;
    stack = [];
  }

  options = options || {};
  var loader = matchLoader(fp, options, this);
  stack = this.buildStack('stream', stack);

  var fns = union(this.cache.stream[loader] || [], stack);
  if (!fns.length) {
    var noop = es.through(function (fp) {
      this.emit('data', fp);
    });
    noop.stream = true;
    fns = [noop];
  }

  var stream = es.pipe.apply(es, fns);
  process.nextTick(function () {
    stream.write(fp);
    stream.end();
  });
  return stream;
};

/**
 * Get a loader based on the given pattern.
 *
 * @param {String} `pattern` By default, this is assumed to be a filepath.
 * @return {Object} Object
 */

function matchLoader(pattern, options, thisArg) {
  if (options && options.matchLoader) {
    return options.matchLoader(pattern, options, thisArg);
  }
  return formatExt(path.extname(pattern));
}

/**
 * Format extensions.
 *
 * @param {String} `ext`
 * @return {String}
 */

function formatExt(ext) {
  return (ext[0] === '.') ? ext.slice(1) : ext;
}

/**
 * Concat a list of arrays.
 */

function union() {
  return [].concat.apply([], arguments);
}
