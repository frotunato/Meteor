var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('meteor.db');
var path = require('path');
var compress = require('compression');
var config = require('./config');

var controller = require('./controller')(io, db);

app
  .set('view engine', 'jade')
  .set('appPath', path.join(config.root, 'client'))
  .use(compress())
  .use(express.static(app.get('appPath')))
  .route('/').get(function (req, res) {
    res.render(app.get('appPath') + '/index.jade');
  });

io.on('connection', function (socket) {
  console.log('connection');
  controller.pull(function (data) {
    socket.emit('pull', data);
  });
});

server.listen(config.port, config.ip, function () {
  console.log('Server launched at', config.host, config.port);
  controller.start();
});