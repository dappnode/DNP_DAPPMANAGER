const fs = require('fs');
const {promisify} = require('util');
const params = require('../params');


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

const getUserActionLogs = async ({
  options,
}) => {
  const readFileAsync = promisify(fs.readFile);
  const {userActionLogsFilename} = params;

  if (!fs.existsSync(userActionLogsFilename)) {
    return {
        message: 'UserActionLogs are still empty, returning black',
        result: '',
    };
  }
  const userActionLogs = await readFileAsync(
      userActionLogsFilename,
      {encoding: 'utf8'}
  );

  return {
    message: 'Got userActionLogs',
    result: userActionLogs,
  };
};


module.exports = getUserActionLogs;
