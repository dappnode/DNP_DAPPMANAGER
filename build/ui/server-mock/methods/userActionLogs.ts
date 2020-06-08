import { UserActionLog } from "../../src/common";

const userActionLogs: UserActionLog[] = [];

for (let i = 0; i < 200; i++) {
  userActionLogs.push({
    event: "installPackage.dappmanager.dnp.dappnode.eth",
    args: [
      {
        id: "rinkeby.dnp.dappnode.eth",
        userSetVols: {},
        userSetPorts: {},
        options: {}
      }
    ],
    level: i % 5 === 0 ? "info" : "error",
    message: "Timeout to cancel expired",
    stack: "Error: Timeout to cancel expired↵  ...",
    timestamp: Date.now() - 1000 * 60 * i
  });
}

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
}: {
  first?: number;
  after?: number;
}): Promise<UserActionLog[]> {
  return userActionLogs.slice(after, after + first);
}
