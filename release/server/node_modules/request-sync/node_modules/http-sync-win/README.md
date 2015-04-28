# http-sync-win

Use [shelljs](https://github.com/arturadib/shelljs) to get full windows compatability for [http-sync](https://github.com/dhruvbird/http-sync)

[![Build Status](https://travis-ci.org/ForbesLindesay/http-sync-win.png?branch=master)](https://travis-ci.org/ForbesLindesay/http-sync-win)
[![Dependency Status](https://gemnasium.com/ForbesLindesay/http-sync-win.png)](https://gemnasium.com/ForbesLindesay/http-sync-win)
[![NPM version](https://badge.fury.io/js/http-sync-win.png)](http://badge.fury.io/js/http-sync-win)

## Installation

Add both `http-sync` and `http-sync-win` to your optional dependencies:

```js
{
  "optionalDependencies": {
    "http-sync": "0.0.4",
    "http-sync-win": "0.0.4"
  }
}
```

## Usage

To use, simply try and require `http-sync` and fall back to `http-sync-win` (which is much less efficient).

```js
var http;
try {
  http = require('http-sync');
} catch (ex) {
  http = require('http-sync-win');
}
// see https://github.com/dhruvbird/http-sync for API
```

Note that if you are able to install native dependencies and libcurl is available, `http-sync` will be much kinder to your hard drive and CPU so please use that.  Once node v0.12 comes out this library can be updated to use `child_process.execSync` and will become a much more efficient option.

## License

  MIT