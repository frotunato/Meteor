var path = require('path');
var config = {
  ip: process.env.IP,
  root: path.normalize(__dirname + '/..'),
  port: 4000,
  host: 'localhost'
};

module.exports = config;