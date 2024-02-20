import { valid, gt } from "semver";
import { listPackages } from "@dappnode/dockerapi";
import { prettyDnpName, isVersionIdUpdated } from "@dappnode/utils";
import {
  AutoUpdateDataView,
  AutoUpdateDataDnpView,
  InstalledPackageData,
  AutoUpdateRegistryDnp,
  AutoUpdateRegistry,
  AutoUpdatePending,
  AutoUpdateFeedback
} from "@dappnode/types";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
import {
  isCoreUpdateEnabled,
  SYSTEM_PACKAGES,
  MY_PACKAGES,
  isDnpUpdateEnabled
} from "@dappnode/daemons";

const coreDnpName = params.coreDnpName;

/**
 * Returns a auto-update data:
 * - settings: If auto-updates are enabled for a specific DNP or DNPs
 * - registry: List of executed auto-updates
 * - pending: Pending auto-update per DNP, can be already executed
 * - dnpsToShow: Parsed data to be shown in the UI
 */
export async function autoUpdateDataGet(): Promise<AutoUpdateDataView> {
  const settings = db.autoUpdateSettings.get();
  const registry = db.autoUpdateRegistry.get();
  const pending = db.autoUpdatePending.get();

  const dnpList = await listPackages();

  const dnpsToShow: AutoUpdateDataDnpView[] = [
    {
      id: SYSTEM_PACKAGES,
      displayName: "System packages",
      enabled: isCoreUpdateEnabled(),
      feedback: getCoreFeedbackMessage(dnpList.filter(({ isCore }) => isCore))
    },
    {
      id: MY_PACKAGES,
      displayName: "My packages",
      enabled: isDnpUpdateEnabled(),
      feedback: {}
    }
  ];

  if (isDnpUpdateEnabled()) {
    const singleDnpsToShow: InstalledPackageData[] = [];
    for (const dnp of dnpList) {
      const storedDnp = singleDnpsToShow.find(
        _dnp => _dnp.dnpName === dnp.dnpName
      );
      const storedVersion = storedDnp ? storedDnp.version : "";
      if (
        dnp.dnpName &&
        // Ignore core DNPs
        dnp.isDnp &&
        !dnp.isCore &&
        // Ignore wierd versions
        valid(dnp.version) &&
        // Ensure there are no duplicates
        (!storedVersion || gt(storedVersion, dnp.version))
      )
        singleDnpsToShow.push(dnp);
    }

    for (const dnp of singleDnpsToShow) {
      const enabled = isDnpUpdateEnabled(dnp.dnpName);
      dnpsToShow.push({
        id: dnp.dnpName,
        displayName: prettyDnpName(dnp.dnpName),
        enabled,
        feedback: enabled
          ? getDnpFeedbackMessage({
              dnpName: dnp.dnpName,
              currentVersion: dnp.version
            })
          : {}
      });
    }
  }

  return {
    settings,
    registry,
    pending,
    dnpsToShow
  };
}

// Utils

/**
 * Get an auto-update feedback message
 * [NOTE] since core versionId may include multiple verisons,
 * the logic is different than for a single version DNP
 *
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 * @param currentVersion "0.2.6", must come from dnp.version
 * @returns feedback = {
 *   updated: 15363818244,
 *   manuallyUpdated: true,
 *   inQueue: true,
 *   scheduled: 15363818244
 * }
 */
export function getCoreFeedbackMessage(
  currentCorePackages: { dnpName: string; version: string }[],
  data?: { registry?: AutoUpdateRegistry; pending?: AutoUpdatePending }
): AutoUpdateFeedback {
  const registry = data?.registry || db.autoUpdateRegistry.get();
  const pending = data?.pending || db.autoUpdatePending.get();

  /**
   * Let's figure out the version of the core
   */

  const {
    version: pendingVersion,
    scheduledUpdate,
    errorMessage
  } = pending[coreDnpName] || {};
  const lastUpdatedVersion = getLastRegistryEntry(registry[coreDnpName] || {});
  const lastUpdatedVersionsAreInstalled =
    lastUpdatedVersion.version &&
    isVersionIdUpdated(lastUpdatedVersion.version, currentCorePackages);
  const pendingVersionsAreInstalled =
    pendingVersion && isVersionIdUpdated(pendingVersion, currentCorePackages);

  if (scheduledUpdate) {
    // If the pending version is the current BUT it is NOT in the registry,
    // it must have been updated by the user
    if (pendingVersionsAreInstalled) return { manuallyUpdated: true };

    // Here, an update can be pending
    if (Date.now() > scheduledUpdate)
      return { inQueue: true, ...(errorMessage ? { errorMessage } : {}) };
    else return { scheduled: scheduledUpdate };
  } else {
    // If current version is auto-installed, it will show up in the registry
    if (lastUpdatedVersionsAreInstalled)
      return { updated: lastUpdatedVersion.updated };
  }

  return {};
}

/**
 * Get an auto-update feedback message
 *
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 * @param currentVersion "0.2.6", must come from dnp.version
 * @returns feedback = {
 *   updated: 15363818244,
 *   manuallyUpdated: true,
 *   inQueue: true,
 *   scheduled: 15363818244
 * }
 */
export function getDnpFeedbackMessage({
  dnpName,
  currentVersion,
  registry,
  pending
}: {
  dnpName: string;
  currentVersion: string;
  registry?: AutoUpdateRegistry;
  pending?: AutoUpdatePending;
}): AutoUpdateFeedback {
  if (!registry) registry = db.autoUpdateRegistry.get();
  if (!pending) pending = db.autoUpdatePending.get();

  const currentVersionRegistry =
    (registry[dnpName] || {})[currentVersion] || {};
  const {
    version: pendingVersion,
    scheduledUpdate,
    errorMessage
  } = pending[dnpName] || {};

  const lastUpdatedVersion = getLastRegistryEntry(registry[dnpName] || {});
  const lastUpdatedVersionsAreInstalled =
    lastUpdatedVersion.version && lastUpdatedVersion.version === currentVersion;
  const pendingVersionsAreInstalled =
    pendingVersion && pendingVersion === currentVersion;

  // If current version is auto-installed, it will show up in the registry
  if (lastUpdatedVersionsAreInstalled)
    return { updated: currentVersionRegistry.updated };

  // If the pending version is the current BUT it is NOT in the registry,
  // it must have been updated by the user
  if (pendingVersionsAreInstalled) return { manuallyUpdated: true };

  // Here, an update can be pending
  if (scheduledUpdate)
    if (Date.now() > scheduledUpdate) {
      return { inQueue: true, ...(errorMessage ? { errorMessage } : {}) };
    } else {
      return { scheduled: scheduledUpdate };
    }

  return {};
}

/**
 * Returns the last successful registry entry sorted by updated timestamp
 * @param registryDnp
 * @return
 */
export function getLastRegistryEntry(registryDnp: AutoUpdateRegistryDnp): {
  version: string;
  updated?: number;
  successful?: boolean;
} {
  return (
    Object.entries(registryDnp)
      .map(([version, { updated, successful }]) => ({
        version,
        updated,
        successful
      }))
      .filter(({ successful }) => successful)
      .sort((a, b) => (a.updated || 0) - (b.updated || 0))
      .slice(-1)[0] || {}
  );
}
