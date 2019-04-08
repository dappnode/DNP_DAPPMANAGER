const fs = require("fs");
const { promisify } = require("util");
const params = require("params");

/**
 * Returns the user action logs. This logs are stored in a different
 * file and format, and are meant to ease user support
 *
 * @param {Object} kwargs: {
 *   options
 * }
 * @return {Object} A formated success message.
 * result: = logs (string)
 */

const getUserActionLogs = async ({ options, fromLog = 0, numLogs = 50 }) => {
  const { userActionLogsFilename } = params;

  if (!fs.existsSync(userActionLogsFilename)) {
    return {
      message: "UserActionLogs are still empty, returning black",
      result: ""
    };
  }

  const userActionLogs = await promisify(fs.readFile)(userActionLogsFilename, {
    encoding: "utf8"
  });

  // The userActionLogs file can grow a lot. Only a part of it will be returned
  // The user can specify which part of the file wants
  const userActionLogsSelected = (userActionLogs || "")
    .split(/\r?\n/)
    .slice(fromLog, fromLog + numLogs)
    .join("\n");

  return {
    message: "Got userActionLogs",
    result: userActionLogsSelected
  };
};

module.exports = getUserActionLogs;
