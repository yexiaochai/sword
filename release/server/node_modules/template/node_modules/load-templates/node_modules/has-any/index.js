/*!
 * has-any <https://github.com/jonschlinkert/has-any>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

/**
 * Does the given `obj` have any of the specified `keys`?
 *
 * @param  {Object} `obj`
 * @param  {Array} `keys`
 * @return {Boolean} Returns true if any of the keys match.
 */

module.exports = function hasAny(o, keys) {
  if (typeof o !== 'object') {
    return false;
  }

  keys = !Array.isArray(keys) ? [keys] : keys;
  var len = keys.length;
  var has = false;

  for (var i = 0; i < len; ++i) {
    if (o.hasOwnProperty(keys[i])) {
      has = true;
      break;
    }
  }
  return has;
};