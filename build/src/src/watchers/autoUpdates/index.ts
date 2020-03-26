import params from "../../params";
import * as eventBus from "../../eventBus";
import fetchCoreUpdateData from "../../calls/fetchCoreUpdateData";
// Utils
import {
  isDnpUpdateEnabled,
  isCoreUpdateEnabled,
  clearPendingUpdates,
  clearRegistry,
  clearCompletedCoreUpdatesIfAny
} from "../../utils/autoUpdateHelper";
import Logs from "../../logs";
const logs = Logs(module);

import updateMyPackages from "./updateMyPackages";
import updateSystemPackages from "./updateSystemPackages";

const monitoringInterval = params.AUTO_UPDATE_WATCHER_INTERVAL || 5 * 60 * 1000; // (ms) (5 minutes)

/**
 * Auto-update:
 * All code is sequential, to not perform more than one update at once.
 * One of the update might be the core and crash the other updates.
 */
async function autoUpdates(): Promise<void> {
  try {
    if (isDnpUpdateEnabled()) {
      try {
        await updateMyPackages();
      } catch (e) {
        logs.error(`Error on updateMyPackages: ${e.stack}`);
      }
    }

    if (isCoreUpdateEnabled()) {
      try {
        await updateSystemPackages();
      } catch (e) {
        logs.error(`Error on updateSystemPackages: ${e.stack}`);
      }
    }
  } catch (e) {
    logs.error(`Error on autoUpdates interval: ${e.stack}`);
  }

  // Trigger the interval loop with setTimeouts to prevent double execution
  setTimeout(autoUpdates, monitoringInterval);
}

autoUpdates();

eventBus.packagesModified.on(({ ids, removed }) => {
  if (removed) ids.forEach(clearPendingUpdates);
  ids.forEach(clearRegistry);
});

/**
 * If the DAPPMANAGER is updated the pending state will never be updated to
 * "completed". So on every DAPPMANAGER start it must checked if a successful
 * update happen before restarting
 */
async function checkForCompletedCoreUpdates(): Promise<void> {
  try {
    const {
      result: { versionId }
    } = await fetchCoreUpdateData({});
    clearCompletedCoreUpdatesIfAny(versionId);
  } catch (e) {
    logs.error(`Error on clearCompletedCoreUpdatesIfAny: ${e.stack}`);
  }
}

checkForCompletedCoreUpdates();

export default autoUpdates;
