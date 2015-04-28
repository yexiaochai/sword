# json-literal

Superset of `JSON` adding circular references, date, regex, null, undefined and octal literals while also making it more flexible so as to be easier to read and write.  Inspired by [@substack](https://github.com/substack)'s [json-literal-parse](https://github.com/substack/json-literal-parse).

Key Points:

 - Secure Parser, it does not use 'eval', except on something that's just been through `JSON.stringify` to sanitize it.
 - Stringifier does not produce valid JSON, it writes un-quoted keys when possible, and includes RegExp and Date Literals.
 - The stringifier and parser both represent circular refernces internally as `new Circular("path", "to", "canonical", "instance", "of", "object")`
 - The parser understands any Date of the form `new Date(...args)`
 - The parser understands any RegExp of the form `/regexp/gi`
 - The parser accepts un-quoted keys, providing they are valid identifiers (e.g. `{a: 5, b: "foo"}`)
 - The parser accepts either `"` or `'` as quotes for strings
 - The parser allows comments as both `// line comment` and `/* inline comment */`

[![Build Status](https://travis-ci.org/ForbesLindesay/json-literal.png?branch=master)](https://travis-ci.org/ForbesLindesay/json-literal)
[![Dependency Status](https://gemnasium.com/ForbesLindesay/json-literal.png)](https://gemnasium.com/ForbesLindesay/json-literal)
[![NPM version](https://badge.fury.io/js/json-literal.png)](http://badge.fury.io/js/json-literal)

## Installation

    npm install json-literal

## Example


e.g.

```js
var JSONL = require('json-literal')
var str = JSONL.stringify({
  str: 'This is a string',
  'some-attributes-require-quotes': 10,
  updated: new Date('2013-07-12T15:42:00.000Z'),
  match: /^\d\d\d\d\-\d\d\-\d\d$/
})
// => '({str:"This is a string","some-attributes-require-quotes":10,updated:new Date("2013-07-12T15:42:00.000Z"),match:/^\\d\\d\\d\\d\\-\\d\\d\\-\\d\\d$/})'
var obj = JSONL.parse(str)
// => { str: 'This is a string',
//      'some-attributes-require-quotes': 10,
//      updated: new Date('2013-07-12T15:42:00.000Z'),
//      match: /^\d\d\d\d\-\d\d\-\d\d$/ }
```

## API

```js
var JSONL = require('json-literal')
```

### var obj = JSONL.parse(str)

Parse the input string `str`, returning the parsed representation `obj`.

`JSONL.parse()` is just like `JSON.parse()` except that the input may have additional "literal" types not in the JSON spec, which are:

 - date (as `new Date(...args)`)
 - regex
 - null
 - undefined
 - octal

and input can contain comments of the form:

 - `// line comment`
 - `/* inline comment */`

You may optionally denote a JSONL string as not being a JSON string by surrounding it with parentheses, which will be stripped during parsing.

### var str = JSONL.stringify(obj)

Stringify the input object `obj`, returning the string representation `str`.

`JSONL.stringify()` is just like `JSON.stringify()` except that it supports additional "literal" types not in the JSON spec, and will NOT return a valid JSON object.

To differentiate the JSONL string from a JSON string, it is placed in parentheses.

## License

  MIT