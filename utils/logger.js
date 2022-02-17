const { createLogger, transports, format } = require('winston');

const loggerObj = {};

loggerObj.userlogger = createLogger({
  transports: [
    new transports.File({
      filename: './error_handling/user-error.log',
      level: 'error',
      format: format.combine(format.timestamp(), format.json()),
    }),
  ],
});
loggerObj.storelogger = createLogger({
  transports: [
    new transports.File({
      filename: './error_handling/store-error.log',
      level: 'error',
      format: format.combine(format.timestamp(), format.json()),
    }),
  ],
});
loggerObj.adminlogger = createLogger({
  transports: [
    new transports.File({
      filename: './error_handling/admin-error.log',
      level: 'error',
      format: format.combine(format.timestamp(), format.json()),
    }),
  ],
});
loggerObj.businesslogger = createLogger({
  transports: [
    new transports.File({
      filename: './error_handling/business-error.log',
      level: 'error',
      format: format.combine(format.timestamp(), format.json()),
    }),
  ],
});
module.exports = loggerObj;
