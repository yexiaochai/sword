var express = require('express');
var path = require('path');
var ejs = require('ejs');
var fs= require('fs');
var srequest = require('request-sync');

var project_path = path.resolve();
var routerCfg = require(project_path + '/routerCfg.json');

//定义页面读取方法，需要同步读取
var widget = function(opts) {
  var model = require(project_path + '/model/' + opts.model + '.json') ;
  //var controller =project_path + '/controller/' + opts.controller + '.js';
  var tmpt = fs.readFileSync(project_path + '/template/' + opts.name + '.html', 'utf-8');

  //设置代理，直接使用ip不能读取数据，但是设置代理的化，代理不生效，只能直接读取线上了......
  var res = srequest({ uri: model.url, qs: model.param});

  var html = ejs.render(tmpt, JSON.parse(res.body.toString('utf-8')));

  //插入控制器，这个路径可能需要调整
  html += '<script type="text/javascript">require(["controller/' + opts.controller + '"], function(controller){controller.init();});</script>';

  return html;
};

var initRounter = function(opts, app) {
  //根据路由配置生成路由
  for(var k in opts) {
    app.get('/' + k, function (req, res) {
      res.render(k, { widget: widget});
    });
  }
};

module.exports = function(app) {
  //加载所有路由配置
  initRounter(routerCfg, app);
};
