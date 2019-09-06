import params from "../params";
import restartPatch from "../modules/restartPatch";
// Utils
import shell from "../utils/shell";
import { RpcHandlerReturn } from "../types";

/**
 * Cleans the cache files of the DAPPMANAGER:
 * - local DB
 * - user action logs
 * - temp transfer folder
 */
export default async function cleanCache(): Promise<RpcHandlerReturn> {
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
}
