import params from "../params";
import { clearCache } from "../db";
// Utils
import shell from "../utils/shell";
import { RpcHandlerReturn } from "../types";

/**
 * Cleans the cache files of the DAPPMANAGER:
 * - local DB
 * - user action logs
 * - temp transfer folder
 */
export default async function cleanCache(): RpcHandlerReturn {
  const pathsToDelete = [
    params.userActionLogsFilename,
    params.TEMP_TRANSFER_DIR
  ];
  for (const path of pathsToDelete) {
    await shell(`rm -rf ${path}`);
  }

  // Clear cache DBs in friendly manner
  clearCache();

  return {
    message: `Cleaned cache`,
    logMessage: true,
    userAction: true
  };
}
