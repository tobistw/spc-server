'use strict';

var winston = require('winston');

module.exports = function () {
  console.log('winston initialized');

  winston.add(winston.transports.DailyRotateFile, {filename: 'log/auth_audit.log'});
  winston.remove(winston.transports.Console);

  winston.level = 'info';

  winston.info('winston log initialized');
  winston.log('info', 'SPC Server initialized');
};
