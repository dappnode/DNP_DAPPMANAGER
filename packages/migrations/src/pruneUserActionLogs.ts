import fs from "fs";
import { params } from "@dappnode/params";

/**
 * Prune the userActionLogs.json file if the current size
 * is greater than 4 MB
 */
export async function pruneUserActionLogs(): Promise<void> {
  const maxFileSizeBytes = 4194304; // Bytes = 4MB
  const currentFileSizeBytes = fs.statSync(
    params.USER_ACTION_LOGS_DB_PATH
  ).size;
  if (currentFileSizeBytes > maxFileSizeBytes)
    fs.truncate(params.USER_ACTION_LOGS_DB_PATH, 0, () =>
      console.log(`truncated file ${params.userActionLogsFilename} to 0`)
    );
}
