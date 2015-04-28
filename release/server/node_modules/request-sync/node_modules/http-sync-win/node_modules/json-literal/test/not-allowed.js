var assert = require('assert')
var parse = require('../').parse

describe('invalid input', function () {
  it('accepts valid input', function () {
    parse('["a","b"]');
  })
  it('syntax error', function () {
    assert.throws(function () {
      parse('["a","b",');
    })
  })
  it('expression', function () {
    assert.throws(function () {
        parse(';["a","b"]');
    })
  })
  it('assignment expression', function () {
    assert.throws(function () {
      parse('x=["a","b"]');
    })
  })
  it('parenthetical', function () {
    assert.throws(function () {
      parse('[("a" + "b")]');
    })
  })
  it('inline function', function () {
    assert.throws(function () {
      parse('["a","b",function(){}]');
    })
  })
  it('identifier', function () {
    assert.throws(function () {
      parse('["a","b",c]');
    })
  })
})