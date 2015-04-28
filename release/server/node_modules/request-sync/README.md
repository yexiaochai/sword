**request-sync is deprecated, use [sync-request](https://github.com/ForbesLindesay/sync-request)**


# request-sync

Because sometimes you want your web requests to be synchronous

[![Build Status](https://img.shields.io/travis/ForbesLindesay/request-sync/master.svg)](https://travis-ci.org/ForbesLindesay/request-sync)
[![Dependency Status](https://img.shields.io/gemnasium/ForbesLindesay/request-sync.svg)](https://gemnasium.com/ForbesLindesay/request-sync)
[![NPM version](https://img.shields.io/npm/v/request-sync.svg)](http://badge.fury.io/js/request-sync)

## Installation

    npm install request-sync

## Usage

Make a web request:

Options:

 - `uri` || `url` - fully qualified uri or parsed url object from `url.parse()`
 - `method` - http method (default: `"GET"`)
 - `qs` - object containing querystring values to be appended to the `uri`
 - `headers` - http headers (default: `{}`)
 - `body` - entity body for PATCH, POST and PUT requests. Must be a `Buffer` or `String`.
 - `auth` - A hash containing values `user` || `username`, `password` || `pass`
 - `encoding` - encoding to stringify the result body, set this to `null` to get a `Buffer`

```js
var response = request('http://www.example.com');
// => {statusCode: 200, headers: {}, body: 'string of html'}

var response = request('http://www.example.com', {method: 'GET'});
// => {statusCode: 200, headers: {}, body: 'string of html'}

var response = request({method: 'GET', uri: 'http://www.example.com'});
// => {statusCode: 200, headers: {}, body: 'string of html'}
```

## License

  MIT
