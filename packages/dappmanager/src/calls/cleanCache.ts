import { params } from "@dappnode/params";
import { clearCacheDb } from "@dappnode/db";
// Utils
import { shell } from "@dappnode/utils";

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

  await shell(`rm -rf ${pathsToDelete.join(" ")}`);

  // Clear cache DBs in friendly manner
  clearCacheDb();
}
