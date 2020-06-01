import winston from "winston";
import Transport from "winston-transport";
import * as eventBus from "./eventBus";
import { pipe } from "./utils/functions";
import {
  trimBase64Values,
  hideSensitiveValues,
  limitObjValuesSize
} from "./utils/objects";
import params from "./params";
import { UserActionLog } from "./types";

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
  // I don't know the typing of this contructor opts, and it's pointless to type
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
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
  log(info: UserActionLog, callback: () => void): void {
    setImmediate(() => {
      eventBus.logUserAction.emit(info);
    });
    callback();
  }
}

// Utilities to format

/**
 * Transform the info object
 * 1. Any key in kwargs or the result that the name implies that contains
 *    sensitive data will be replace by ********
 * 2. When sending user settings the kwargs can potentially contain long
 *    base64 file contents. Trim them off
 * 3. Limit the length of objects.
 *    RPC calls like copyTo may content really big dataUrls as kwargs,
 *    prevent them from cluttering the userActionLogs file
 */
const formatLogObjectFunction = pipe(
  hideSensitiveValues,
  trimBase64Values,
  obj => limitObjValuesSize(obj, 500)
);
const formatLogObject = format(info => {
  // MUST do a spread in order to include `[Symbol(level)]: 'error'` property,
  // otherwise winston will ignore the log
  return { ...info, ...formatLogObjectFunction(info) };
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
  format: format.combine(formatLogObject(), format.timestamp(), format.json())
});

export default logger;
