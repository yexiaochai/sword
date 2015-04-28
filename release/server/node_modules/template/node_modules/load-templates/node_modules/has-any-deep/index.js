/*!
 * has-any-deep <https://github.com/jonschlinkert/has-any-deep>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var reduce = require('reduce-object');
var isObject = require('is-plain-object');
var hasValues = require('has-values');
var hasAny = require('has-any');


/**
 * ```js
 * hasAnyDeep({a: 'b', {b: 'b', c: 'c'}}, ['b', 'foo']);
 * //=> 'true'
 * ```
 *
 * @param  {Object} `obj` the object to inspect.
 * @param  {Array}  `keys` Nested keys to look for on `obj`.
 * @return {Boolean} True if one of the given `keys` exists deeply.
 */

module.exports = function hasAnyDeep(obj, props) {
  function _hasAnyDeep(o, props) {
    return reduce(o, function (acc, value, key) {
      if (props.indexOf(key) !== -1) {
        return true;
      } else if (hasAny(value, props)) {
        return true;
      }

      if (hasValues(value) && isObject(value)) {
        return _hasAnyDeep(value, props);
      } else if (props.indexOf(key) !== -1) {
        return true;
      } else {
        return false;
      }

      acc[key] = value;
      return acc;
    }, {});
  }

  if (hasAny(obj, props)) {
    return true;
  } else {
    return _hasAnyDeep(obj, props);
  }

  return false;
};
