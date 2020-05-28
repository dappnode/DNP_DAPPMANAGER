import params from "../../params";
import * as eventBus from "../../eventBus";
import { fetchCoreUpdateData } from "../../calls/fetchCoreUpdateData";
import { ReleaseFetcher } from "../../modules/release";
import { EthProviderError } from "../../modules/ethClient";
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
async function checkAutoUpdates(): Promise<void> {
  try {
    const releaseFetcher = new ReleaseFetcher();
    // Make sure the eth client provider is available before checking each package
    // Do it once and return for expected errors to reduce cluttering
    if (isDnpUpdateEnabled() || isCoreUpdateEnabled())
      try {
        await releaseFetcher.getProvider();
      } catch (e) {
        if (e instanceof EthProviderError) return;
        logs.warn(`Error getting eth provider: ${e.stack}`);
      }

    if (isDnpUpdateEnabled()) {
      try {
        await updateMyPackages(releaseFetcher);
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
  setTimeout(checkAutoUpdates, monitoringInterval);
}

/**
 * If the DAPPMANAGER is updated the pending state will never be updated to
 * "completed". So on every DAPPMANAGER start it must checked if a successful
 * update happen before restarting
 */
async function checkForCompletedCoreUpdates(): Promise<void> {
  try {
    const { versionId } = await fetchCoreUpdateData({});
    clearCompletedCoreUpdatesIfAny(versionId);
  } catch (e) {
    logs.error(`Error on clearCompletedCoreUpdatesIfAny: ${e.stack}`);
  }
}

/**
 * Auto updates watcher.
 * If there are new package versions available installs them
 */
export default function runWatcher(): void {
  checkForCompletedCoreUpdates();

  checkAutoUpdates();

  eventBus.packagesModified.on(({ ids, removed }) => {
    if (removed) ids.forEach(clearPendingUpdates);
    ids.forEach(clearRegistry);
  });
}
