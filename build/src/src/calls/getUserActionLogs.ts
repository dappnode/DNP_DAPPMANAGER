import fs from "fs";
import { promisify } from "util";
import params from "../params";
import { RpcHandlerReturnWithResult } from "../types";

type ReturnData = string;

/**
 * Returns the user action logs. This logs are stored in a different
 * file and format, and are meant to ease user support
 * The list is ordered from newest to oldest
 * - Newest log has index = 0
 * - If the param fromLog is out of bounds, the result will be an empty array: []
 *
 * @param {number} fromLog, default value = 0
 * @param {number} numLogs, default value = 50
 * @returns {string} logs, stringified userActionLog JSON objects appended on new lines
 * To parse, by newline and then parse each line individually.
 * userActionLog = {
 *   level: "info" | "error", {string}
 *   event: "installPackage.dnp.dappnode.eth", {string}
 *   message: "Successfully install DNP", {string} Returned message from the call function
 *   result: { data: "contents" }, {*} Returned result from the call function
 *   kwargs: { id: "dnpName" }, {object} RPC key-word arguments
 *   // Only if error
 *   message: e.message, {string}
 *   stack.e.stack {string}
 * }
 */

export default async function getUserActionLogs({
  fromLog = 0,
  numLogs = 50
}): RpcHandlerReturnWithResult<ReturnData> {
  const { userActionLogsFilename } = params;

  if (!fs.existsSync(userActionLogsFilename)) {
    return {
      message: "userActionLogs are empty, returning an empty string",
      result: ""
    };
  }

  const userActionLogs = await promisify(fs.readFile)(userActionLogsFilename, {
    encoding: "utf8"
  });

  /**
   * The userActionLogs file can grow a lot. Only a part of it will be returned
   * The client can specify which part of the file wants
   * - reverse the array so the 0 index corresponds to the latest log
   * - do not parse the logs to save resources
   */
  const userActionLogsSelected = (userActionLogs || "")
    .split(/\r?\n/)
    .reverse()
    .slice(fromLog, fromLog + numLogs)
    .join("\n");

  return {
    message: "Got userActionLogs",
    result: userActionLogsSelected
  };
}
