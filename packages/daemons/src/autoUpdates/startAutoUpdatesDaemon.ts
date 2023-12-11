import { params } from "@dappnode/params";
import { eventBus } from "@dappnode/eventbus";
import { DappnodeInstaller, getEthUrl } from "@dappnode/installer";
import { listPackages } from "@dappnode/dockerapi";
import { runAtMostEvery } from "@dappnode/utils";
import { logs } from "@dappnode/logger";
import { checkNewPackagesVersion } from "./updateMyPackages.js";
import { checkSystemPackagesVersion } from "./updateSystemPackages.js";
import { EthProviderError } from "@dappnode/common";
import { clearPendingUpdates } from "./clearPendingUpdates.js";
import { clearCompletedCoreUpdatesIfAny } from "./clearCompletedCoreUpdatesIfAny.js";
import { clearRegistry } from "./clearRegistry.js";

/**
 * Auto-update:
 * All code is sequential, to not perform more than one update at once.
 * One of the update might be the core and crash the other updates.
 */
async function checkAutoUpdates(
  dappnodeInstaller: DappnodeInstaller
): Promise<void> {
  try {
    // Make sure the eth client provider is available before checking each package
    // Do it once and return for expected errors to reduce cluttering
    try {
      await getEthUrl();
    } catch (e) {
      if (e instanceof EthProviderError) return;
      logs.warn("Error getting eth provider", e);
    }

    try {
      await checkNewPackagesVersion(dappnodeInstaller);
    } catch (e) {
      logs.error("Error on updateMyPackages", e);
    }

    try {
      await checkSystemPackagesVersion(dappnodeInstaller);
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
  const currentCorePackages = dnps.filter((d) => d.isCore);
  clearCompletedCoreUpdatesIfAny(currentCorePackages);
}

/**
 * Auto updates daemon, run at most every interval
 */
export function startAutoUpdatesDaemon(
  dappnodeInstaller: DappnodeInstaller,
  signal: AbortSignal
): void {
  eventBus.packagesModified.on(({ dnpNames, removed }) => {
    for (const dnpName of dnpNames) {
      if (removed) clearPendingUpdates(dnpName);
      clearRegistry(dnpName);
    }
  });

  checkForCompletedCoreUpdates().catch((e) => {
    logs.error("Error on checkForCompletedCoreUpdates", e);
  });

  runAtMostEvery(
    () => checkAutoUpdates(dappnodeInstaller),
    params.AUTO_UPDATE_DAEMON_INTERVAL,
    signal
  );
}
