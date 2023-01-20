import { Routes, UserActionLog } from "@dappnode/common";

const userActionLogsState: UserActionLog[] = [];

export const userActionLogs: Pick<Routes, "getUserActionLogs"> = {
  getUserActionLogs: async ({ first = 20, after = 0 }) =>
    userActionLogsState.slice(after, after + first)
};

// Generate initial data
for (let i = 0; i < 40; i++) {
  userActionLogsState.push({
    event: "packageInstall.dappmanager.dnp.dappnode.eth",
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
