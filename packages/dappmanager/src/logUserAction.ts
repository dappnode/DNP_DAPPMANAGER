import { eventBus } from "./eventBus";
import params from "./params";
import { UserActionLog } from "./types";
import { logSafeObjects } from "./utils/logs";
import { JsonFileDb } from "./utils/fileDb";

/**
 * Max number of logs to prevent the log file from growing too big
 * An averagae single log weights 1-0.5KB in file as JSON
 */
const maxNumOfLogs = 2000;
const dbPath = params.USER_ACTION_LOGS_DB_PATH;
let db: JsonFileDb<UserActionLog[]> | null = null;
function getDb(): JsonFileDb<UserActionLog[]> {
  if (!db) db = new JsonFileDb<UserActionLog[]>(dbPath, []);
  return db;
}

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
    ...log,
    ...(log.args ? { args: logSafeObjects(log.args) } : {}),
    ...(log.result ? { result: logSafeObjects(log.result) } : {})
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
  return getDb().read();
}

/**
 * Overwrites to the db a new array of logs
 * @param userActionLogs
 */
export function set(userActionLogs: UserActionLog[]): void {
  getDb().write(userActionLogs.slice(0, maxNumOfLogs));
}
