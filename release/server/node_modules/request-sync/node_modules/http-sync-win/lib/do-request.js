'use strict';

var concat = require('concat-stream');
var paths = require('./paths');
try {
  paths.id = process.argv[2];
  var request = paths.request.get();
  request.body = paths.requestBody.read();
  if (['http', 'https'].indexOf(request.protocol) === -1) {
    throw new Error('Invalid protocol ' + request.protocol);
  }
  var http = require(request.protocol === 'http' ? 'http' : 'https');
  delete request.protocol;
  var connectTimeout, timeout;
  var req = http.request(request, function (response) {
    try {
      clearTimeout(connectTimeout);
      var body = '';
      var ret = {statusCode: response.statusCode, headers: response.headers};
      response.pipe(concat(function (body) {
        clearTimeout(timeout);
        paths.response.set(ret);
        paths.responseBody.write(body);
      }));
    } catch (ex) {
      handle(ex);
    }
  });
  req.on('error', handle);
  req.end(request.body);
  if (request['_connect_timeout']) {
    connectTimeout = setTimeout(function () {
      paths.response.set({timedout: true});
      process.exit(0);
    }, request['_connect_timeout'].msec);
  }
  if (request['_timeout']) {
    timeout = setTimeout(function () {
      paths.response.set({timedout: true});
      process.exit(0);
    }, request['_timeout'].msec);
  }
} catch (ex) {
  handle(ex);
}
function handle(ex) {
  paths.error.set(ex.stack || ex + '');
  throw ex;
}