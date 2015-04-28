/*!
 * array-rest <https://github.com/jonschlinkert/array-rest>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT license.
 */

'use strict';

var slice = require('array-slice');
var isNumber = require('is-number');

module.exports = function(arr, num) {
  if (!Array.isArray(arr)) {
    throw new Error('array-rest expects an array as the first argument.');
  }
  return slice(arr, isNumber(num) ? num : 1);
};
