import fs from "fs";
import { orderBy } from "lodash";
import * as eventBus from "./eventBus";
import params from "./params";
import { UserActionLog } from "./types";
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import { logSafeObjects } from "./utils/logs";
import { logs } from "./logs";

/**
 * Max number of logs to prevent the log file from growing too big
 * An averagae single log weights 1-0.5KB in file as JSON
 */
const maxNumOfLogs = 2000;
const dbPath = params.USER_ACTION_LOGS_DB_PATH;
const adapter = new FileSync<UserActionLog[]>(dbPath, { defaultValue: [] });
const db = low(adapter);

type UserActionLogPartial = Omit<UserActionLog, "level" | "timestamp">;

/*
 * To facilitate debugging, actions involving user interaction are stored in a file
 * to be latter sent to Support in the case of errors. The format of this logger is
 * not human readable and should be parsed by a dedicated tool.
 * Specific RPCs will have a ```userAction``` flag to indicate that the result
 * should be logged by this module.
 */
function push(log: UserActionLogPartial, level: UserActionLog["level"]): void {
  const userActionLog: UserActionLog = {
    level,
    timestamp: Date.now(),
    ...(log.args ? { args: logSafeObjects(log.args) } : {}),
    ...(log.result ? { result: logSafeObjects(log.result) } : {}),
    ...log
  };

  // Emit the log to the UI
  eventBus.logUserAction.emit(userActionLog);

  // Store the log in disk
  set([userActionLog, ...get()]);
}

export function info(log: UserActionLogPartial): void {
  push(log, "info");
}

export function error(log: UserActionLogPartial): void {
  push(log, "error");
}

/**
 * Returns user actions logs, ordered from newest to oldest
 */
export function get(): UserActionLog[] {
  return db.getState() || [];
}

/**
 * Overwrites to the db a new array of logs
 * @param userActionLogs
 */
function set(userActionLogs: UserActionLog[]): void {
  db.setState(userActionLogs.slice(0, maxNumOfLogs)).write();
}

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
    if (e.code === "ENOENT") {
      logs.debug("userActionLogs file not found, already migrated");
    } else {
      logs.error("Error migrating userActionLogs", e);
    }
  }
}
