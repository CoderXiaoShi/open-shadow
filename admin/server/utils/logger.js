const log4js = require('log4js');

log4js.configure({
  appenders: {
    console: {
      type: 'console'
    },
    file: {
      type: 'file',
      filename: './logs/app.log',
      maxLogSize: 10485760,
      backups: 3,
      encoding: 'utf-8'
    }
  },
  categories: {
    default: {
      appenders: ['console', 'file'],
      level: 'info'
    },
    error: {
      appenders: ['console', 'file'],
      level: 'error'
    }
  }
});

const logger = log4js.getLogger('default');
const errorLogger = log4js.getLogger('error');

module.exports = {
  logger,
  errorLogger
};