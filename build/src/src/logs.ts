"use strict";
import winston from "winston";

const { createLogger, format, transports } = winston;

const { LOG_LEVEL } = process.env;

const logLevel =
  LOG_LEVEL === "error"
    ? "error"
    : LOG_LEVEL === "warn"
    ? "warn"
    : LOG_LEVEL === "verbose"
    ? "verbose"
    : LOG_LEVEL === "debug"
    ? "debug"
    : "info";

/*
 * Generic logger to the console and therefore the container logs
 */

/*
 * > LEVELS:
 * ---------------------
 * logs.info("Something")
 * logs.warn("Something")
 * logs.error("Something")
 */

const scFormat = format.printf(info => {
  const level = info.level.toUpperCase();
  let message = info.message;
  const filteredInfo = Object.assign({}, info, {
    level: undefined,
    message: undefined,
    splat: undefined,
    label: undefined,
    timestamp: undefined
  });
  const append = JSON.stringify(filteredInfo, null, 4);
  if (append != "{}") {
    message = `${message} - ${append}`;
  }
  const variables = [];
  if (info.admin) variables.push("ADMIN");

  // return `${info.timestamp} ${level} [${info.label}] : ${message}`;
  return `${level} [${info.label}] [${variables.join("&")}] : ${message}`;
});

/**
 * Get a label to desribe the module we're logging for.
 *
 * @param {object}  mod The module we're logging for or a description of the
 *                      logger.
 * @returns {winston.format.label}
 */
// Let winston return it's own format
/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
function _getLabel(mod: NodeModule) {
  if (mod == undefined) mod = module;

  const label = mod.id
    ? (mod.id.replace(".js", "") || "").replace(/^.*\/src\//, "")
    : "";
  return format.label({ label: label });
}

export default function(mod: NodeModule): winston.Logger {
  const logger = createLogger({
    level: logLevel,
    format: format.combine(
      format.splat(),
      format.timestamp({
        format: "DD-MM-YYYY HH:mm:ss"
      }),
      _getLabel(mod),
      scFormat
    ),
    transports: [
      new transports.Console({
        // format: format.combine(
        //   format.timestamp(),
        //   format.colorize(),
        //   format.simple()
        // ),
      })
    ]
  });
  return logger;
}
