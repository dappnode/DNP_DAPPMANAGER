"use strict";
const winston = require("winston");
const { createLogger, format, transports } = winston;
const Transport = require("winston-transport");
const { eventBus, eventBusTag } = require("eventBus");
const limitObjValuesSize = require("utils/limitObjValuesSize");
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
 * logs.info("Something")
 * logs.warn("Something")
 * logs.error("Something")
 */

// Custom transport to broadcast new logs to the admin directly
class EmitToAdmin extends Transport {
  constructor(opts) {
    super(opts);
  }

  /**
   * @param {object} info = userActionLog
   *   @property {string} level - "info" | "error".
   *   @property {string} event - Crossbar RPC event, "installPackage.dnp.dappnode.eth".
   *   @property {string} message - Returned message from the call function, "Successfully install DNP"
   *   @property {*} result - Returned result from the call function
   *   @property {object} kwargs - RPC key-word arguments, { id: "dnpName" }
   *   // Only if error
   *   @property {object} message - e.message
   *   @property {object} stack - e.stack
   */
  log(info, callback) {
    setImmediate(() => {
      eventBus.emit(eventBusTag.logUserAction, info);
    });
    callback();
  }
}

// Utilities to format

/**
 * Format function to filter out unrelevant log properties
 * Note: format((info, opts) => ... )
 */
const onlyUserAction = format(info => {
  if (!info.userAction) return false;
  const _info = Object.assign({}, info);
  delete _info.userAction;
  delete _info.logMessage;
  return _info;
});

/**
 * Limit the length of objects.
 * RPC calls like copyTo may content really big dataUrls as kwargs,
 * prevent them from cluttering the userActionLogs file
 */
const maxLen = 500;
const limitLength = format(info => {
  if (info.kwargs) info.kwargs = limitObjValuesSize(info.kwargs, maxLen);
  if (info.result) info.result = limitObjValuesSize(info.result, maxLen);
});

// Actual logger

const logger = createLogger({
  transports: [
    new transports.File({
      filename: params.userActionLogsFilename,
      level: "info"
    }),
    new EmitToAdmin()
  ],
  format: format.combine(
    onlyUserAction(),
    limitLength(),
    format.timestamp(),
    format.json()
  )
});

module.exports = logger;
