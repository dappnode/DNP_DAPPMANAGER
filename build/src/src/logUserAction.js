"use strict";
const winston = require("winston");
const { createLogger, format, transports } = winston;
const Transport = require("winston-transport");
const { eventBus, eventBusTag } = require("eventBus");
const params = require("params");

/*
 * To facilitate debugging, actions involving user interaction are stored in a file
 * to be latter sent to Support in the case of errors. The format of this logger is
 * not human readable and should be parsed by a dedicated tool.
 * Specific RPCs will have a ```userAction``` flag to indicate that the result
 * should be logged by this module.
 */

/*
 * > LEVELS:
 * ---------------------
 * logs.info('Something')
 * logs.warn('Something')
 * logs.error('Something')
 */

// Format function to filter out unrelevant logs
const onlyUserAction = format((info, opts) => {
  if (!info.userAction) {
    return false;
  }
  delete info.userAction;
  delete info.logMessage;
  return info;
});

// Custom transport to broadcast new logs to the admin directly
class EmitToAdmin extends Transport {
  constructor(opts) {
    super(opts);
  }

  log(info, callback) {
    setImmediate(() => {
      eventBus.emit(eventBusTag.logUserAction, info);
    });
    callback();
  }
}

// Actual logger
const logger = createLogger({
  transports: [
    new transports.File({
      filename: params.userActionLogsFilename,
      level: "info"
    }),
    new EmitToAdmin()
  ],
  format: format.combine(onlyUserAction(), format.timestamp(), format.json())
});

module.exports = logger;
