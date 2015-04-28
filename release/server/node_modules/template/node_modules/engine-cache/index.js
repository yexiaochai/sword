'use strict';

var AsyncHelpers = require('async-helpers');
var Helpers = require('helper-cache');
var async = require('async');
var _ = require('lodash');

/**
 * Expose `Engines`
 */

module.exports = Engines;

/**
 * ```js
 * var Engines = require('engine-cache');
 * var engines = new Engines();
 * ```
 *
 * @param {Object} `engines` Optionally pass an object of engines to initialize with.
 * @api public
 */

function Engines(engines) {
  this.init(engines);
}

/**
 * Initialize default configuration.
 *
 * @api private
 */

Engines.prototype.init = function(engines) {
  this.cache = engines || {};
};

/**
 * Register the given view engine callback `fn` as `ext`.
 *
 * ```js
 * var consolidate = require('consolidate')
 * engines.setEngine('hbs', consolidate.handlebars)
 * ```
 *
 * @param {String} `ext`
 * @param {Object|Function} `options` or callback `fn`.
 * @param {Function} `fn` Callback.
 * @return {Object} `Engines` to enable chaining.
 * @api public
 */

Engines.prototype.setEngine = function (ext, fn, options) {
  var engine = {};
  if (arguments.length === 3) {
    if (options && (typeof options === 'function' ||
        options.hasOwnProperty('render') ||
        options.hasOwnProperty('renderSync') ||
        options.hasOwnProperty('renderFile'))) {
      var opts = fn;
      fn = options;
      options = opts;
      opts = null;
    }
  }

  var type = typeof fn;
  if (type !== 'object' && type !== 'function') {
    throw new TypeError('engine-cache expects engines to be an object or function.');
  }

  engine.render = fn.render || fn;
  if (fn.renderFile) {
    engine.renderFile = fn.renderFile;
  }
  if (fn.__express) {
    engine.renderFile = fn.__express;
  }
  for (var key in fn) {
    engine[key] = fn[key];
  }

  engine.options = _.merge({}, engine.options, fn.options, options);
  engine.helpers = new Helpers(options);
  engine.asyncHelpers = new AsyncHelpers(options);

  if (typeof engine.render !== 'function' && typeof engine.renderSync !== 'function') {
    throw new Error('Engines are expected to have a `render` or `renderSync` method.');
  }

  if (engine.render) {
    engine.name = engine.render.name || 'unknown';
  } else {
    engine.name = engine.renderSync.name || 'unknown';
  }

  this.decorate(engine);
  if (ext.charAt(0) !== '.') {
    ext = '.' + ext;
  }

  this.cache[ext] = engine;
  return this;
};

/**
 * Return the engine stored by `ext`. If no `ext`
 * is passed, the entire cache is returned.
 *
 * ```js
 * var consolidate = require('consolidate')
 * engine.setEngine('hbs', consolidate.handlebars);
 *
 * engine.getEngine('hbs');
 * // => {render: [function], renderFile: [function]}
 * ```
 *
 * @param {String} `ext` The engine to get.
 * @return {Object} The specified engine.
 * @api public
 */

Engines.prototype.getEngine = function(ext) {
  if (!ext) return this.cache;
  if (ext[0] !== '.') {
    ext = '.' + ext;
  }

  var engine = this.cache[ext];
  if (!engine) {
    engine = this.cache['.*'];
  }

  return engine;
};

/**
 * Wrap engines to extend the helpers object and other
 * native methods or functionality.
 *
 * ```js
 * engines.decorate(engine);
 * ```
 *
 * @param  {Object} `engine` The engine to wrap.
 * @return {Object} The wrapped engine.
 * @api private
 */

Engines.prototype.decorate = function(engine) {
  var renderSync = engine.renderSync;
  var render = engine.render;
  var compile = engine.compile || function (str) {
    return str;
  };

  engine.compile = function wrappedCompile(str, opts) {
    if (typeof str === 'function') return str;
    opts = opts || {};
    return compile(str, mergeHelpers.call(this, opts));
  };

  engine.render = function wrappedRender(str, options, cb) {
    if (typeof options === 'function') {
      cb = options;
      options = {};
    }

    if (typeof cb !== 'function') {
      throw new TypeError('engine-cache `render` expects a callback function.');
    }

    if (typeof str === 'function') {
      return this.resolve(str(options), cb);

    } else if (typeof str === 'string') {
      str = this.compile(str, options);

    } else {
      return cb(new TypeError('engine-cache `render` expects a string or function.'));
    }

    var opts = _.extend({async: true}, options);
    var ctx = mergeHelpers.call(this, opts);
    var self = this;

    return render.call(this, str, ctx, function (err, content) {
      if (err) return cb(err);
      return self.resolve(content, cb);
    });
  };

  engine.renderSync = function wrappedRenderSync(str, opts) {
    if (typeof str === 'function') {
      return str(opts);

    } else if (typeof str === 'string') {
      str = this.compile(str, opts);

    } else {
      throw new TypeError('engine-cache `renderSync` expects a string or function.');
    }

    opts = opts || {};
    opts.helpers = _.merge({}, this.helpers, opts.helpers);
    return renderSync(str, opts);
  };

  engine.resolve = function resolveHelpers(str, cb) {
    if (typeof cb !== 'function') {
      throw new TypeError('engine-cache `resolve` expects a callback function.');
    }
    if (typeof str !== 'string') {
      return cb(new TypeError('engine-cache `resolve` expects a string.'));
    }

    var self = this;
    // `stash` contains the objects created when rendering the template
    var stashed = self.asyncHelpers.stash;
    async.eachSeries(Object.keys(stashed), function (key, next) {
      // check to see if the async ID is in the rendered string
      if (str.indexOf(key) === -1) {
        return next(null);
      }

      self.asyncHelpers.resolve(key, function (err, value) {
        if (err) return next(err);
        // replace the async ID with the resolved value
        str = str.split(key).join(value);
        next(null);
      });
    }, function (err) {
      if (err) return cb(err);
      cb(null, str);
    });
  };
};

/**
 * Load an object of engines onto the `cache`.
 * Mostly useful for testing, but exposed as
 * a public method.
 *
 * ```js
 * engines.load(require('consolidate'))
 * ```
 *
 * @param  {Object} `obj` Engines to load.
 * @return {Object} `Engines` to enable chaining.
 * @api public
 */

Engines.prototype.load = function(engines) {
  for (var key in engines) {
    if (engines.hasOwnProperty(key)) {
      var engine = engines[key];
      if (key !== 'clearCache') {
        this.setEngine(key, engine);
      }
    }
  }
  return this;
};

/**
 * Get and set helpers for the given `ext` (engine). If no
 * `ext` is passed, the entire helper cache is returned.
 *
 * **Example:**
 *
 * ```js
 * var helpers = engines.helpers('hbs');
 * helpers.addHelper('foo', function() {});
 * helpers.getHelper('foo');
 * helpers.getHelper();
 * ```
 *
 * See [helper-cache] for any related issues, API details, and documentation.
 *
 * @param {String} `ext` The helper cache to get and set to.
 * @return {Object} Object of helpers for the specified engine.
 * @api public
 */

Engines.prototype.helpers = function (ext) {
  return this.getEngine(ext).helpers;
};

/**
 * Remove `ext` engine from the cache, or if no value is
 * specified the entire cache is reset.
 *
 * **Example:**
 *
 * ```js
 * engines.clear()
 * ```
 *
 * @param {String} `ext` The engine to remove.
 * @api public
 */

Engines.prototype.clear = function(ext) {
  if (ext) {
    if (ext && ext.charAt(0) !== '.') ext = '.' + ext;
    delete this.cache[ext];
  } else {
    this.cache = {};
  }
};

/**
 * Merge the local engine helpers with the options helpers.
 *
 * @param  {Object} `options` Options passed into `render` or `compile`
 * @return {Object} Options object with merged helpers
 */

function mergeHelpers (opts) {
  _.merge(this.asyncHelpers.helpers, this.helpers, opts.helpers);
  opts.helpers = this.asyncHelpers.get({wrap: opts.async});
  return opts;
}
