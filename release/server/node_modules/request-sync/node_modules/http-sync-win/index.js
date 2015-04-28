'use strict';

var execute = require('shelljs').exec;
var paths = require('./lib/paths');
var doRequest = require.resolve('./lib/do-request');

function CurlRequest(options) {
  this._options = options;
  this._headers = {};

  var k;
  for (k in this._options.headers) {
    this.setHeader(k, this._options.headers[k]);
  }
}

CurlRequest.prototype = {
  getHeader: function(name) {
    return this._headers[name.toLowerCase()];
  },
  removeHeader: function(name) {
    delete this._headers[name.toLowerCase()];
  },
  setHeader: function(name, value) {
    this._headers[name.toLowerCase()] = value;
  },
  write: function(data) {
    data = data || '';
    this._options.body += data;
  },
  setTimeout: function(msec, callback) {
    msec = msec || 0;
    this._options["_timeout"] = {
      "msec": msec,
      "callback": callback
    };
  },
  setConnectTimeout: function(msec, callback) {
    msec = msec || 0;
    this._options["_connect_timeout"] = {
        "msec": msec,
        "callback": callback
    };
  },
  end: function(data) {
    this.write(data);
    this._options.headers = this._headers;
    paths.before();
    paths.requestBody.write(this._options.body);
    delete this._options.body;
    paths.request.set(this._options);
    execute('node ' + doRequest + ' ' + paths.id);

    try {
      var res = paths.response.get();
      if (res.timedout) {
        // If both connect and (other) timeout are set, only
        // invoke the connect timeout since we have no way of
        // knowing which one fired.
        if (this._options._connect_timeout) {
            this._options._connect_timeout.callback();
        } else {
            this._options._timeout.callback();
        }
        paths.after();
        return;
      }
      res.body = paths.responseBody.read();
      paths.after();
      return res;
    } catch (ex) {
      var err;
      try {
        err = paths.error.get();
      } catch (ex2) {
        paths.after();
        throw ex;
      }
      paths.after();
      throw err;
    }
  }
};


exports.request = function(options) {
  options.method = options.method || 'GET';
  options.method = options.method.toUpperCase();

  options.protocol = options.protocol || 'http';
  options.port = options.port || (options.protocol === 'https' ? 443 : 80);
  options.path = options.path || '/';
  options.headers = options.headers || { };
  options.host = options.host || '127.0.0.1';
  options.body = options.body || '';
  options.rejectUnauthorized = options.rejectUnauthorized === false ? false : true;

  return new CurlRequest(options);
};