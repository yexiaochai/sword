/*!
 * load-templates <https://github.com/jonschlinkert/load-templates>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var util = require('util');
var chalk = require('chalk');
var debug_ = require('debug')('load-templates');
var hasAny = require('has-any');
var isGlob = require('is-glob');
var Options = require('option-cache');
var hasAnyDeep = require('has-any-deep');
var mapFiles = require('map-files');
var omitEmpty = require('omit-empty');
var relative = require('relative');
var typeOf = require('kind-of');
var has = Object.prototype.hasOwnProperty;
var extend = _.extend;
var merge = _.merge;


/**
 *  `keys` that might exist on the root of a template object.
 */

var rootKeys = [
  'path',
  'ext',
  'content',
  'data',
  'locals',
  'value',
  'orig',
  'options'
];

/**
 * Initialize a new `Loader`
 *
 * ```js
 * var loader = new Loader();
 * ```
 *
 * @class Loader
 * @param {Object} `obj` Optionally pass an `options` object to initialize with.
 * @api public
 */

function Loader(options) {
  Options.call(this, options);
}

/**
 * Inherit `Options`
 */

util.inherits(Loader, Options);

/**
 * Rename the `key` of a template object, often a file path. By
 * default the key is just passed through unchanged.
 *
 * Pass a custom `renameKey` function on the options to change
 * how keys are renamed.
 *
 * @param  {String} `key`
 * @param  {Object} `options`
 * @return {Object}
 */

Loader.prototype.renameKey = function(key, opts) {
  debug('renameKey:', key);
  opts = opts || {};

  if (opts.renameKey) {
    return opts.renameKey(key, opts);
  }

  if (opts.relative !== false) {
    return relative(key);
  }
  return key;
};

/**
 * Default function for reading any files resolved.
 *
 * Pass a custom `readFn` function on the options to change
 * how files are read.
 *
 * @param  {String} `fp`
 * @param  {Object} `options`
 * @return {Object}
 */

Loader.prototype.readFn = function(fp, options) {
  debug('readFn:', fp);
  var opts = extend({}, this.options, options);
  if (opts.readFn) {
    return opts.readFn(fp, opts);
  }
  return tryRead(fp);
};

/**
 * Return an object of files. Pass a custom `mapFiles` function
 * to change behavior.
 *
 * @param  {String} `patterns`
 * @param  {Object} `options`
 * @return {Object}
 */

Loader.prototype.mapFiles = function(patterns, locals, options) {
  debug('mapFiles:', patterns);

  var opts = extend({}, this.options, locals, options);
  if (opts.mapFiles) {
    debug('mapFiles custom function:', patterns);
    return opts.mapFiles(patterns, opts);
  }

  opts.name = this.renameKey;
  opts.read = this.readFn;
  return mapFiles(patterns, opts);
};

/**
 * Map files resolved from glob patterns or file paths.
 *
 *
 * @param  {String|Array} `patterns`
 * @param  {Object} `options`
 * @return {Object}
 */

Loader.prototype.parseFiles = function(patterns, locals, options) {
  debug('parsing files:', patterns);
  options = isObject(options) ? options : {};
  locals = isObject(locals) ? locals : {};
  var opts = extend({}, this.options, options);

  flattenProp('options', opts, locals);
  flattenProp('locals', locals, opts);

  var files = this.mapFiles(patterns, locals, opts);
  var self = this;

  return _.reduce(files, function (acc, value, key) {
    debug('reducing value:', key, value);
    var content = value;
    value = {};
    value.content = content;

    // if the file has `.json` extension, parse it
    if (key.slice(-5) === '.json') {
      value.orig = value.content;
      merge(value, JSON.parse(value.content));
    }
    merge(acc, self.normalizeString(key, value, locals, opts));
    return acc;
  }, {});
};

/**
 * When the first arg is an array, assume it's glob
 * patterns or file paths.
 *
 * ```js
 * loader(['a/b/c.md', 'a/b/*.md']);
 * loader(['a/b/c.md', 'a/b/*.md'], {a: 'b'}, {foo: true});
 * ```
 *
 * @param  {Object} `patterns` Template object
 * @param  {Object} `locals` Possibly locals, with `options` property
 * @return {Object} `options` Possibly options
 */

Loader.prototype.normalizeArray = function(patterns, locals, options) {
  debug('normalizing array:', patterns);
  return this.parseFiles(patterns, locals, options);
};

/**
 * First value is a string, second value is a string or
 * an object.
 *
 * {%= docs("dev-normalize-string") %}
 *
 * @param  {Object} `value` Always an object.
 * @param  {Object} `locals` Always an object.
 * @param  {Object} `options` Always an object.
 * @return {Object} Returns a normalized object.
 */

Loader.prototype.normalizeString = function(key, value, locals, options) {
  debug('normalizing string:', key, value);
  var len = arguments.length - 1;
  var type = typeOf(value);

  var file = {};
  file.path = key;
  options = options || {};
  locals = locals || {};

  var str = this.readFn(key);
  if (str && typeof str === 'string') {
    file.content = str;
  }

  if (isGlob(key)) {
    if (type === 'string') {
      console.log(chalk.red('load-templates cannot normalize: ' + JSON.stringify(arguments)));
      throw new TypeError('load-templates `normalizeString`: second argument cannot be a string when the first argument is a glob pattern.');
    }
    return this.parseFiles(key, value, locals);
  }

  if (type === 'function') {
    var fnRes = this.normalizeFunction(value, locals, options);
    if (isObject(fnRes)) {
      merge(file, fnRes);
    } else {
      file.content = fnRes;
    }
  }

  if (type === 'string') {
    file.content = value;
  }

  if (type === 'object') {
    extend(file, value);
    if (len === 2) {
      options = locals;
      locals = file.locals || {};
    }
  }

  file.locals = file.locals || {};
  extend(file.locals, locals);

  file.options = file.options || {};
  extend(file.options, options);

  var root = pickRoot(file, this.options.rootKeys);
  root = mergeDiff('locals', file, root);

  flattenProp('options', root.options, root.locals);
  flattenProp('locals', root.locals, root.options);

  var res = {};
  res[key] = root;
  return res;
};

/**
 * Normalize objects that have `rootKeys` directly on
 * the root of the object.
 *
 * **Example**
 *
 * ```js
 * {path: 'a/b/c.md', content: 'this is content.'}
 * ```
 *
 * @param  {Object} `value` Always an object.
 * @param  {Object} `locals` Always an object.
 * @param  {Object} `options` Always an object.
 * @return {Object} Returns a normalized object.
 */

Loader.prototype.normalizeShallowObject = function(file, locals, options) {
  debug('normalizing shallow object:', file);
  file.options = extend({}, options, file.options);
  file.locals = extend({}, locals, file.locals);

  var root = pickRoot(file, this.options.rootKeys);
  root = mergeDiff('locals', file, root);

  flattenProp('options', root.options, root.locals);
  flattenProp('locals', root.locals, root.options);
  return root;
};

/**
 * Normalize nested templates that have the following pattern:
 *
 * ```js
 * { 'a/b/a.md': {path: 'a/b/a.md', content: 'this is content.'},
 *   'a/b/b.md': {path: 'a/b/b.md', content: 'this is content.'},
 *   'a/b/c.md': {path: 'a/b/c.md', content: 'this is content.'} }
 *```
 */

Loader.prototype.normalizeDeepObject = function(obj, locals, options) {
  debug('normalizing deep object:', obj);

  return _.reduce(obj, function (acc, value, key) {
    acc[key] = this.normalizeShallowObject(value, locals, options);
    return acc;
  }.bind(this), {});
};

/**
 * When the first arg is an object, all arguments
 * should be objects. The only exception is when
 * the last arg is a fucntion.
 *
 * ```js
 * loader({'a/b/c.md', ...});
 *
 * // or
 * loader({path: 'a/b/c.md', ...});
 * ```
 *
 * @param  {Object} `object` Template object
 * @param  {Object} `locals` Possibly locals, with `options` property
 * @return {Object} `options` Possibly options
 */

Loader.prototype.normalizeObject = function(o) {
  debug('normalizing object:', o);

  var locals1 = pickLocals(arguments[1], this.options.rootKeys);
  var locals2 = pickLocals(arguments[2], this.options.rootKeys);
  var val;

  var opts = arguments.length === 3 ? locals2 : {};

  if (hasAny(o, ['path', 'content'])) {
    val = this.normalizeShallowObject(o, locals1, opts);
    return createKeyFromPath(val.path, val);
  }

  if (hasAnyDeep(o, ['path', 'content'])) {
    val = this.normalizeDeepObject(o, locals1, opts);
    return createPathFromStringKey(val);
  }

  throw new Error('load-templates normalizeObject expects'
    + ' a `path` or `content` property.');
};

/**
 * Normalize function arguments.
 *
 * ```js
 * loader(function() {
 *   // do stuff with templates
 * });
 * ```
 *
 * @param  {Object} `patterns` Template object
 * @param  {Object} `locals` Possibly locals, with `options` property
 * @return {Object} `options` Possibly options
 */

Loader.prototype.normalizeFunction = function(fn) {
  debug('normalizeFunction:', arguments);
  return fn.apply(this, arguments);
};

/**
 * Select the template normalization function to start
 * with based on the first argument passed.
 */

Loader.prototype._format = function() {
  debug('_format', arguments);
  switch (typeOf(arguments[0])) {
    case 'array':
      return this.normalizeArray.apply(this, arguments);
    case 'string':
      return this.normalizeString.apply(this, arguments);
    case 'object':
      return this.normalizeObject.apply(this, arguments);
    case 'function':
      return this.normalizeFunction.apply(this, arguments);
    default:
      throw new Error('loader#_format() expects an array, string, object or function.');
    }
};

/**
 * Final normalization step to remove empty values and rename
 * the object key. By now the template should be _mostly_
 * loaderd.
 *
 * @param  {Object} `object` Template object
 * @return {Object}
 */

Loader.prototype.load = function() {
  debug('load', arguments);

  var tmpl = this._format.apply(this, arguments);
  var opts = this.options;
  var self = this;

  return _.reduce(tmpl, function (acc, value, key) {
    self.normalize(opts, acc, value, key);
    return acc;
  }, {});
};

/**
 * Base normalize method, abstracted to make it easier to
 * pass in custom methods.
 *
 * @param  {Object} `options`
 * @param  {Object} `acc`
 * @param  {String|Object} `value`
 * @param  {String} `key`
 * @return {Object} Normalized template object.
 */

Loader.prototype.normalize = function (opts, acc, value, key) {
  debug('normalize', key);
  if (opts && opts.normalize) {
    return opts.normalize(acc, value, key);
  }

  if (!value.ext) {
    var ext = path.extname(value.path);
    if (ext) value.ext = ext;
  }

  if (value.path && opts && opts.relative !== false) {
    value.path = relative(value.path);
  }

  value.content = value.content
    ? value.content.trim()
    : null;

  value = omitEmpty(value);

  if (!value.hasOwnProperty('content')) {
    console.log(chalk.red('missing `content` property: ' + JSON.stringify(arguments)));
    throw new Error('load-templates#normalize: expects templates to have a content property.');
  }

  if (!value.hasOwnProperty('path')) {
    console.log(chalk.red('missing `path` property: ' + JSON.stringify(arguments)));
    throw new Error('load-templates#normalize: expects templates to have a path property.');
  }

  // Rename the object key
  acc[this.renameKey(key, opts)] = value;
  return acc;
};

/**
 * Create a `path` property from the template object's key.
 *
 * If we detected a `path` property directly on the object that was
 * passed, this means that the object is not formatted as a key/value
 * pair the way we want our normalized templates.
 *
 * ```js
 * // before
 * loader({path: 'a/b/c.md', content: 'this is foo'});
 *
 * // after
 * loader('a/b/c.md': {path: 'a/b/c.md', content: 'this is foo'});
 * ```
 *
 * @param  {String} `filepath`
 * @param  {Object} `value`
 * @return {Object}
 * @api private
 */

function createKeyFromPath(fp, value) {
  var o = {};
  o[fp] = value;
  return o;
}

/**
 * Create the `path` property from the string
 * passed in the first arg. This is only used
 * when the second arg is a string.
 *
 * ```js
 * loader('abc', {content: 'this is content'});
 * //=> normalize('abc', {path: 'abc', content: 'this is content'});
 * ```
 *
 * @param  {Object} `obj`
 * @return {Object}
 */

function createPathFromStringKey(o) {
  for (var key in o) {
    if (hasOwn(o, key)) {
      o[key].path = o[key].path || key;
    }
  }
  return o;
}

/**
 * Try to read the given `str` as a file path,
 * Returns `null` if the path is invalid.
 *
 * @param  {String} `str`
 * @return {String|Null}
 */

function tryRead(str) {
  try {
    str = path.resolve(str);
    return fs.readFileSync(str, 'utf8');
  } catch(err) {}
  return null;
}

/**
 * Pick `rootKeys` from `object`.
 *
 * @param  {Object} `object`
 * @return {Object}
 */

function pickRoot(o, keys) {
  return _.pick(o, rootKeys.concat(keys || []));
}

/**
 * Pick `locals` from `object`
 *
 * @param  {Object} `object`
 * @return {Object}
 */

function pickLocals(o, keys) {
  var root = _.omit(o, rootKeys.concat(keys || []));
  return _.extend({}, root, _.pick(o, 'locals'));
}

/**
 * Flatten the given `property` from all objects onto the target object.
 *
 * ```js
 * flattenProp('locals', {locals: {a: 'b'}}, {locals: {c: 'd'}});
 * //=> {a: 'b', c: 'd'}
 * ```
 *
 * @param  {String} `property`
 * @param  {Object} `target` The target object
 * @return {Object}
 */

function flattenProp(prop, target/*, objects */) {
  if (typeof prop !== 'string') {
    throw new TypeError ('flattenProp expects `prop` to be a string.');
  }

  var len = arguments.length - 1;
  for (var i = 0; i < len; i++) {
    var obj = arguments[i + 1];
    if (obj.hasOwnProperty(prop)) {
      _.merge(target, obj[prop]);
      delete obj[prop];
    }
  }
  return target;
}

/**
 * Merge the difference between two objects onto
 * the given property on the first object.
 *
 * mergeDiff('locals', file.locals, file.options);
 */

function mergeDiff(prop, a, b) {
  var akeys = Object.keys(a);
  var bkeys = Object.keys(b);
  var diff = _.difference(akeys, bkeys);
  var obj = _.pick(a, diff);

  b[prop] = b[prop] || {};
  _.merge(b[prop], obj);
  return b;
}

/**
 *  Make debug messages easier to read
 */

function debug() {
  arguments[0] = chalk.green(arguments[0]) + '\n  ';
  return debug_.apply(debug_, arguments);
}

/**
 * Utilities for returning the native `typeof` a value.
 *
 * @api private
 */

function isObject(val) {
  return typeOf(val) === 'object';
}

function hasOwn(o, prop) {
  return o && has.call(o, prop);
}

/**
 * Expose `loader`
 *
 * @type {Object}
 */

module.exports = Loader;

/**
 * Expose utils so they can be tested
 */

module.exports.hasOwn = hasOwn;
module.exports.isObject = isObject;
module.exports.pickLocals = pickLocals;
module.exports.pickRoot = pickRoot;
module.exports.mergeDiff = mergeDiff;
module.exports.flattenProp = flattenProp;
