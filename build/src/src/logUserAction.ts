import winston from "winston";
import Transport from "winston-transport";
import { eventBus, eventBusTag } from "./eventBus";
import limitObjValuesSize from "./utils/limitObjValuesSize";
import params from "./params";

const { createLogger, format, transports } = winston;

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
  constructor(opts?: any) {
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
  log(info: any, callback: any) {
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
  delete _info.userAction; // ES6 immutable object delete looks worse
  delete _info.logMessage;
  return _info;
});

/**
 * Private fields
 */
const privateFields = format(info => {
  const _info = Object.assign({}, info);
  if (_info.privateKwargs && _info.kwargs && typeof _info.kwargs === "object")
    for (const key of Object.keys(_info.kwargs)) _info.kwargs[key] = "********";
  delete _info.privateKwargs;
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
  return info;
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
    privateFields(),
    limitLength(),
    format.timestamp(),
    format.json()
  )
});

export default logger;
