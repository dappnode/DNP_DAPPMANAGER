import { logUserAction } from "@dappnode/logger";
import { UserActionLog } from "@dappnode/types";

/**
 * Returns the user action logs. This logs are stored in a different
 * file and format, and are meant to ease user support
 * The list is ordered from newest to oldest. Newest log has index = 0
 * @param first for pagination
 * @param after for pagination
 */
export async function getUserActionLogs({
  first = 50,
  after = 0
}): Promise<UserActionLog[]> {
  return collapseEqualLogs(logUserAction.get().slice(after, after + first));
}

/**
 * Collpase equal logs using the `count` property
 * Prevents showing a long list of the same error when this happens repeatedly
 * @param _userActionLogs
 */
function collapseEqualLogs(_userActionLogs: UserActionLog[]): UserActionLog[] {
  // Do a shallow to copy to not mutate the original
  const userActionLogs: UserActionLog[] = [..._userActionLogs];

  for (let i = 0; i < userActionLogs.length; i++) {
    const log = userActionLogs[i];
    const logNext = userActionLogs[i + 1];
    if (log && logNext) {
      if (
        log.level === logNext.level &&
        log.event === logNext.event &&
        log.message === logNext.message &&
        log.stack === logNext.stack
      ) {
        userActionLogs[i] = { ...log, count: (log.count || 1) + 1 };
        userActionLogs.splice(i + 1, 1);
        // Go one step back to keep aggregating on the same index
        i--;
      }
    }
  }

  return userActionLogs;
}
