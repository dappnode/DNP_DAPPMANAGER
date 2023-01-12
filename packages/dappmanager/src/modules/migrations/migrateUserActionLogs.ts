import { orderBy } from "lodash-es";
import { logs } from "../../logs";
import { UserActionLog } from "@dappnode/common";
import { isNotFoundError } from "../../utils/node";
import params from "../../params";
import fs from "fs";
import { get, set } from "../../logUserAction";

/**
 * Migrate winston .log JSON file to a lowdb
 * Prevents having to manually parse the .log file which was happening on every
 * ADMIN UI visit
 */
export async function migrateUserActionLogs(): Promise<void> {
  const userActionLogLegacyFile = params.userActionLogsFilename;
  try {
    const fileData = fs.readFileSync(userActionLogLegacyFile, "utf8");

    const userActionLogs: UserActionLog[] = [];
    for (const row of fileData.trim().split(/\r?\n/)) {
      try {
        const winstonLog = JSON.parse(row);
        userActionLogs.push({
          ...winstonLog,
          args: winstonLog.args || [winstonLog.kwargs],
          timestamp: new Date(winstonLog.timestamp).getTime()
        });
      } catch (e) {
        logs.debug(`Error parsing user action log row: ${e.message}\n${row}`);
      }
    }

    set(orderBy([...get(), ...userActionLogs], log => log.timestamp, "desc"));
    fs.unlinkSync(userActionLogLegacyFile);

    logs.info(`Migrated ${userActionLogs.length} userActionLogs`);
  } catch (e) {
    if (isNotFoundError(e)) {
      logs.debug("userActionLogs file not found, already migrated");
    } else {
      logs.error("Error migrating userActionLogs", e);
    }
  }
}
