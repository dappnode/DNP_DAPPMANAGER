import fs from "fs";
import params from "../../params";

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
    fs.truncate("/path/to/file", 0, function () {
      console.log("done");
    });
}
