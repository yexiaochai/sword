/*!
 * to-arg <https://github.com/jonschlinkert/to-arg>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var dashify = require('dashify');
var isPrimitive = require('is-primitive');

module.exports = function toflag(key, val, opts) {
  if (!key || typeof key !== 'string') {
    throw new TypeError('to-arg expects a string.');
  }

  if (Array.isArray(val)) {
    val = val.join(',');
  }

  if (!isPrimitive(val)) {
    throw new TypeError('to-arg expects the second argument to be an array or a primitive.');
  }

  if (val === true) {
    val = null;
  }

  if (val === false && (!opts || opts && opts.invert !== false)) {
    key = 'no-' + key;
  }

  key = '--' + (key.length === 1 ? key.toLowerCase() : dashify(key));
  return key + (val ? '=' + val : '');
};
