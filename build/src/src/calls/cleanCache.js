const params = require("params");
// Utils
const shell = require("utils/shell");

/**
 * Cleans the cache files of the DAPPMANAGER:
 * - local DB
 * - user action logs
 * - temp transfer folder
 */
const cleanCache = async () => {
  const pathsToDelete = [
    params.DB_PATH,
    params.userActionLogsFilename,
    params.TEMP_TRANSFER_DIR
  ];
  for (const path of pathsToDelete) {
    await shell(`rm -rf ${path}`);
  }

  return {
    message: `Cleaned cache`,
    logMessage: true,
    userAction: true
  };
};

module.exports = cleanCache;
