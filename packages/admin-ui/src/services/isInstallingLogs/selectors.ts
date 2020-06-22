import { RootState } from "rootReducer";
import { mapValues, pickBy } from "lodash";
import { ProgressLogsByDnp, ProgressLogs } from "types";

// Service > isInstallingLogs

/**
 * Returns a ready-to-be-queried data structure to know by dnpName if:
 * - Is it installing? `Boolean(progressLogsByDnp[dnpName])`
 * - ProgressLogs by dnpName? `progressLogsByDnp[dnpName]`
 */
export const getProgressLogsByDnp = (state: RootState): ProgressLogsByDnp => {
  const isInstallingLogs = state.isInstallingLogs;
  return pickBy(
    mapValues(isInstallingLogs.dnpNameToLogId, id => isInstallingLogs.logs[id]),
    progressLogs => progressLogs
  );
};

export const getProgressLogsOfDnp = (
  state: RootState,
  dnpName: string
): ProgressLogs | undefined => {
  const progressLogsByDnp = getProgressLogsByDnp(state);
  return progressLogsByDnp[dnpName];
};
