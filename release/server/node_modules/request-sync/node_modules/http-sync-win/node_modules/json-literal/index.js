'use strict'

var type = require('type-of')
var util = require('util')
var esprima = require('esprima')

module.exports = {parse: parse, stringify: stringify}
function parse(src, options) {
  var circular = true
  if (options && options.circular === false) {
    circular = false
  }
  var result
  var ast = esprima.parse('(' + src.replace(/^\((.*)\)$/, '$1') + ')');

  if (ast.body.length !== 1) {
    throw new Error('unexpected extra expression');
  }
  else if (ast.body[0].type !== 'ExpressionStatement') {
    throw new Error('expected ExpressionStatement');
  }

  var root = ast.body[0].expression;
  var circulars = []
  var result = (function walk(node, path) {
    if (node.type === 'Literal') {
      return node.value
    } else if (node.type === 'UnaryExpression' && node.operator === '-' && node.argument.type === 'Literal' && typeof node.argument.value === 'number') {
      return -node.argument.value
    } else if (node.type === 'ArrayExpression') {
      return node.elements.map(function (e, i) { return walk(e, circular && path.concat([i])) })
    } else if (node.type === 'ObjectExpression') {
      var obj = {}
      for (var i = 0; i < node.properties.length; i++) {
        var prop = node.properties[i]
        var key = prop.key.type === 'Literal' ? prop.key.value : (prop.key.type === 'Identifier' ? prop.key.name : null)
        if (key === '__proto__') {
          throw new Error('Cannot assign property __proto__')
        }
        var value = prop.value === null ? prop.value : walk(prop.value, circular && path.concat([key]))
        if (key === null) throw new Error('Object key of type ' + prop.key.type + ' not allowed, expected Literal or Identifier')
        obj[key] = value
      }
      return obj;
    } else if (node.type === 'Identifier' && node.name === 'undefined') {
      return undefined
    } else if (node.type === 'NewExpression' && node.callee.type === 'Identifier' && node.callee.name === 'Date') {
      var args = node.arguments.map(walk)
      return eval('new Date(' + args.map(JSON.stringify).join(',') + ')')
    } else if (node.type === 'NewExpression' && node.callee.type === 'Identifier' && node.callee.name === 'Circular') {
      if (!path) {
        throw new Error('Circular references are not supported in this location.')
      }
      circulars.push({from: node.arguments.map(walk), to: path})
      return new Circular()
    } else {
      var ex = new Error('unexpected ' + node.type + ' node')
      throw ex
    }
  }(root, circular && []))
  for (var i = 0; i < circulars.length; i++) {
    var from = result
    for (var x = 0; x < circulars[i].from.length; x++) {
      if (circulars[i].from[x] === '__proto__') {
        throw new Error('Cannot make circular references to `__proto__`')
      }
      from = from[circulars[i].from[x]]
    }
    var to = result
    for (var x = 0; x < circulars[i].to.length - 1; x++) {
      if (circulars[i].to[x] === '__proto__') {
        throw new Error('Cannot make circular references to `__proto__`')
      }
      to = to[circulars[i].to[x]]
    }
    if (circulars[i].to[circulars[i].to.length - 1] === '__proto__') {
      throw new Error('Cannot make circular references to `__proto__`')
    }
    to[circulars[i].to[circulars[i].to.length - 1]] = from
  }
  return result
}
function Circular() {}


function stringify(obj, options) {
  var circular = true
  if (options && options.circular === false) {
    circular = false
  }
  var sentinel = {}
  var circularInputs = []
  var circularResults = []
  var res = (function walk(node, path) {
    switch (type(node)) {
      case 'null':
        return 'null'
      case 'undefined':
        return 'undefined'
      case 'string':
        return JSON.stringify(node)
      case 'boolean':
        return node.toString()
      case 'number':
        return node.toString()
    }

    if (circular) {
      if (circularInputs.indexOf(node) != -1) {
        return 'new Circular(' + circularResults[circularInputs.indexOf(node)].map(JSON.stringify).join(',') + ')'
      }
      circularInputs.push(node)
      circularResults.push(path)
    }
    switch (type(node)) {
      case 'date':
        return 'new Date(' + walk(node.toISOString()) + ')'
      case 'regexp':
        return util.inspect(node)
      case 'arguments':
        node = Array.prototype.slice(node)
      case 'array':
        return '[' + node.map(function (node, i) { return walk(node, circular && path.concat([i]) ) }).map(function (v) { return v === sentinel ? 'undefined' : v }).join(',') + ']'
      case 'object':
        var partial = []
        for (var k in node) {
          if (Object.prototype.hasOwnProperty.call(node, k)) {
            var v = walk(node[k], circular && path.concat([k]));
            if (v !== sentinel) {
              partial.push((/^[a-zA-Z]+$/.test(k) ? k : walk(k)) + ':' + v)
            }
          }
        }
        return '{' + partial.join(',') + '}'
      default:
        return sentinel
    }
  }(obj, circular && []))
  if (res === sentinel) {
    throw new Error('Cannot stringify ' + type(obj))
  } else {
    return '(' + res + ')'
  }
}