'use strict';

var fs = require('fs');
var normalize = require('path').normalize;
var rimraf = require('rimraf').sync;
var JSONL = require('json-literal');

function dir() {
  return __dirname + '/temp/' + exports.id + '/';
}

function p(path) {
  return new Path(path);
}
function Path(p) {
  this.p = p;
}
Path.prototype.path = function () {
  return normalize(dir() + this.p + '.js');
}
Path.prototype.get = function () {
  return JSONL.parse(this.read('utf8'));
}
Path.prototype.set = function (obj) {
  this.write(JSONL.stringify(obj));
}
Path.prototype.read = function (encoding) {
  return fs.readFileSync(this.path(), encoding);
}
Path.prototype.write = function (str) {
  return fs.writeFileSync(this.path(), str);
}
Path.prototype.exists = function () {
  return fs.existsSync(this.path());
}

exports.id = process.pid + Math.random() * 1000;
exports.request = p('request');
exports.requestBody = p('request-body');
exports.response = p('response');
exports.responseBody = p('response-body');
exports.error = p('error');;
exports.before = function () {
  rimraf(dir().replace(/\/$/, ''));
  try {
    fs.mkdirSync(__dirname + '/temp/');
  } catch (ex) {}
  fs.mkdirSync(dir());
};
exports.after = function () {
  rimraf(dir().replace(/\/$/, ''));
};