import params from "../params.js";
import { clearCacheDb } from "../db/index.js";
// Utils
import shell from "../utils/shell.js";

/**
 * Cleans the cache files of the DAPPMANAGER:
 * - local DB
 * - user action logs
 * - temp transfer folder
 */
export async function cleanCache(): Promise<void> {
  const pathsToDelete = [
    params.userActionLogsFilename,
    params.TEMP_TRANSFER_DIR
  ];
  for (const path of pathsToDelete) {
    await shell(`rm -rf ${path}`);
  }

  // Clear cache DBs in friendly manner
  clearCacheDb();
}
