import params from "../../params.js";
import { eventBus } from "../../eventBus.js";
import { ReleaseFetcher } from "../../modules/release/index.js";
import { EthProviderError } from "../../modules/ethClient/index.js";
import { listPackages } from "../../modules/docker/list/index.js";
import {
  clearPendingUpdates,
  clearRegistry,
  clearCompletedCoreUpdatesIfAny
} from "../../utils/autoUpdateHelper.js";
import { runAtMostEvery } from "../../utils/asyncFlows.js";
import { logs } from "../../logs.js";
import { checkNewPackagesVersion } from "./updateMyPackages.js";
import { checkSystemPackagesVersion } from "./updateSystemPackages.js";

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
    try {
      await releaseFetcher.getProvider();
    } catch (e) {
      if (e instanceof EthProviderError) return;
      logs.warn("Error getting eth provider", e);
    }

    try {
      await checkNewPackagesVersion(releaseFetcher);
    } catch (e) {
      logs.error("Error on updateMyPackages", e);
    }

    try {
      await checkSystemPackagesVersion();
    } catch (e) {
      logs.error("Error on updateSystemPackages", e);
    }
  } catch (e) {
    logs.error("Error on autoUpdates interval", e);
  }
}

/**
 * If the DAPPMANAGER is updated the pending state will never be updated to
 * "completed". So on every DAPPMANAGER start it must checked if a successful
 * update happen before restarting
 */
async function checkForCompletedCoreUpdates(): Promise<void> {
  const dnps = await listPackages();
  const currentCorePackages = dnps.filter(d => d.isCore);
  clearCompletedCoreUpdatesIfAny(currentCorePackages);
}

/**
 * Auto updates daemon, run at most every interval
 */
export function startAutoUpdatesDaemon(signal: AbortSignal): void {
  eventBus.packagesModified.on(({ dnpNames, removed }) => {
    for (const dnpName of dnpNames) {
      if (removed) clearPendingUpdates(dnpName);
      clearRegistry(dnpName);
    }
  });

  checkForCompletedCoreUpdates().catch(e => {
    logs.error("Error on checkForCompletedCoreUpdates", e);
  });

  runAtMostEvery(checkAutoUpdates, params.AUTO_UPDATE_DAEMON_INTERVAL, signal);
}
