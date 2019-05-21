const params = require("params");
const restartPatch = require("modules/restartPatch");
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
  // Restart DAPPMANAGER to prevent app breaks after deleting the db
  await restartPatch("dappmanager.dnp.dappnode.eth");

  return {
    message: `Cleaned cache`,
    logMessage: true,
    userAction: true
  };
};

module.exports = cleanCache;
