const config  = require('config');
import * as winston from 'winston';

//timestamp for logger
const logger = new(winston.Logger)({
    transports: [
        new winston.transports.Console({ level: 'debug' }),
        new winston.transports.File({
          filename: 'combined.log',
          level: 'debug'
        })
    ],
    outputCapture   : "std"
});
logger.cli();
// logger level is set in the config
logger.level = config.loggerLevel;
export = logger;
