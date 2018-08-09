const fs = require('fs');
const {promisify} = require('util');
const paramsDefault = require('params');

// CALL DOCUMENTATION:
// > kwargs: {
//     id,
//     isCore,
//     options
//   }
// > result: {
//     id,
//     logs: <String with escape codes> (string)
//   }

function createGetUserActionLogs({
    params = paramsDefault,
}) {
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

  // Expose main method
  return getUserActionLogs;
}


module.exports = createGetUserActionLogs;
