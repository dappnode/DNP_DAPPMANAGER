import * as db from "../db";
import params from "../params";
import { eventBus } from "../eventBus";
import { pick, omit } from "lodash-es";
import { isVersionIdUpdated } from "./coreVersionId";
import {
  AutoUpdateSettings,
  AutoUpdateRegistryEntry,
  AutoUpdateRegistryDnp,
  AutoUpdateRegistry,
  AutoUpdatePendingEntry,
  AutoUpdatePending,
  AutoUpdateFeedback
} from "@dappnode/common";

// Groups of packages keys
export const MY_PACKAGES = "my-packages";
export const SYSTEM_PACKAGES = "system-packages";

const updateDelay = params.AUTO_UPDATE_DELAY || 24 * 60 * 60 * 1000; // 1 day
const coreDnpName = params.coreDnpName;

/**
 * Define types
 */

function autoUpdateDataHasChanged(): void {
  // Update the UI dynamically of the new successful auto-update
  eventBus.requestAutoUpdateData.emit();
}

/**
 * Get current auto-update settings
 *
 * @returns autoUpdateSettings = {
 *   "system-packages": { enabled: true }
 *   "my-packages": { enabled: true }
 *   "bitcoin.dnp.dappnode.eth": { enabled: false }
 * }
 */
export function getSettings(): AutoUpdateSettings {
  return db.autoUpdateSettings.get();
}

/**
 * Set the current
 * Abstracts the lengthy object merging to simply the other functions
 *
 * @param id "bitcoin.dnp.dappnode.eth"
 * @param enabled true
 */
function setSettings(id: string, enabled: boolean): void {
  const autoUpdateSettings = getSettings();

  db.autoUpdateSettings.set({
    ...autoUpdateSettings,
    [id]: { enabled }
  });

  autoUpdateDataHasChanged();
}

/**
 * Edit the settings of regular DNPs
 * - pass the `name` argument to edit a specific DNP
 * - set `name` to null to edit the general My packages setting
 *
 * @param enabled
 * @param dnpName, if null modifies MY_PACKAGES settings
 */
export function editDnpSetting(enabled: boolean, dnpName = MY_PACKAGES): void {
  const autoUpdateSettings = getSettings();

  // When disabling MY_PACKAGES, turn off all DNPs settings by
  // Ignoring all entries but the system packages
  if (dnpName === MY_PACKAGES && !enabled)
    db.autoUpdateSettings.set(pick(autoUpdateSettings, SYSTEM_PACKAGES));

  // When disabling any DNP, clear their pending updates
  // Ignoring all entries but the system packages
  if (!enabled) clearPendingUpdates(dnpName);

  setSettings(dnpName, enabled);
}

/**
 * Edit the general system packages setting
 *
 * @param enabled
 */
export function editCoreSetting(enabled: boolean): void {
  setSettings(SYSTEM_PACKAGES, enabled);

  // When disabling any DNP, clear their pending updates
  // Ignoring all entries but the system packages
  if (!enabled) clearPendingUpdates(SYSTEM_PACKAGES);
}

/**
 * Check if auto updates are enabled for a specific DNP
 * @param dnpName optional
 * @returns isEnabled
 */
export function isDnpUpdateEnabled(dnpName = MY_PACKAGES): boolean {
  const settings = getSettings();

  // If checking the general MY_PACKAGES setting,
  // or a DNP that does not has a specific setting,
  // use the general MY_PACKAGES setting
  if (!settings[dnpName]) dnpName = MY_PACKAGES;
  return (settings[dnpName] || {}).enabled ? true : false;
}

/**
 * Check if auto updates are enabled for system packages
 * @returns isEnabled
 */
export function isCoreUpdateEnabled(): boolean {
  const settings = getSettings();
  return (settings[SYSTEM_PACKAGES] || {}).enabled ? true : false;
}

/**
 * Flags a DNP version as successfully auto-updated
 * The purpose of this information is just to provide feedback in the ADMIN UI
 *
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 * @param version "0.2.5"
 * @param timestamp Use ONLY to make tests deterministic
 */
export function flagCompletedUpdate(
  dnpName: string,
  version: string,
  timestamp?: number
): void {
  setRegistry(dnpName, version, {
    updated: timestamp || Date.now(),
    successful: true
  });

  clearPendingUpdatesOfDnp(dnpName);
}

/**
 * Flags a pending auto-update as error-ed
 * The purpose of this information is just to provide feedback in the ADMIN UI
 *
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 * @param errorMessage "Mainnet is still syncing"
 */
export function flagErrorUpdate(dnpName: string, errorMessage: string): void {
  setPending(dnpName, { errorMessage });
}

/**
 * Auto-updates must be performed 24h after "seeing" the new version
 * - There is a "pending" queue with only one possible slot
 * - If the version is seen for the first time, it will be added
 *   to the queue and delete the older queue item if any
 * - If the version is the same as the one in the queue, the delay
 *   will be checked and if it's completed the update is authorized
 *
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 * @param version "0.2.5"
 * @param timestamp Use ONLY to make tests deterministic
 */
export function isUpdateDelayCompleted(
  dnpName: string,
  version: string,
  timestamp?: number
): boolean {
  if (!timestamp) timestamp = Date.now();

  const pending = getPending();
  const pendingUpdate = pending[dnpName];

  if (pendingUpdate && pendingUpdate.version === version) {
    const { scheduledUpdate, completedDelay } = pendingUpdate;
    if (scheduledUpdate && timestamp > scheduledUpdate) {
      // Flag the delay as completed (if necessary) and allow the update
      if (!completedDelay) setPending(dnpName, { completedDelay: true });
      return true;
    } else {
      // Do not allow the update, the delay is not completed
      return false;
    }
  } else {
    // Start the delay object by recording the first seen time
    setPending(dnpName, {
      version,
      firstSeen: timestamp,
      scheduledUpdate: timestamp + updateDelay,
      completedDelay: false
    });
    return false;
  }
}

/**
 * Clears the pending updates from the registry
 * from a setting ID.
 *
 * @param dnpName "my-packages", "system-packages", "bitcoin.dnp.dappnode.eth"
 */
export function clearPendingUpdates(dnpName: string): void {
  const pending = getPending();

  if (dnpName === MY_PACKAGES) {
    const dnpNames = Object.keys(pending).filter(
      dnpName => dnpName !== coreDnpName
    );
    for (const dnpName of dnpNames) {
      clearPendingUpdatesOfDnp(dnpName);
    }
  } else if (dnpName === SYSTEM_PACKAGES) {
    clearPendingUpdatesOfDnp(coreDnpName);
  } else {
    clearPendingUpdatesOfDnp(dnpName);
  }

  autoUpdateDataHasChanged();
}

/**
 * Clears the pending updates from the registry so:
 * - The update delay time is reseted
 * - The UI does no longer show the "Scheduled" info
 *
 * @param dnpName "core.dnp.dappnode.eth", "bitcoin.dnp.dappnode.eth"
 */
function clearPendingUpdatesOfDnp(dnpName: string): void {
  const pending = getPending();
  db.autoUpdatePending.set(omit(pending, dnpName));
}

/**
 * Clears the auto-update registry entries.
 * Should be used when uninstalling a DNP, for clearing the UI
 * and the install history of the DNP.
 *
 * @param dnpName "core.dnp.dappnode.eth", "bitcoin.dnp.dappnode.eth"
 */
export function clearRegistry(dnpName: string): void {
  const registry = getRegistry();
  db.autoUpdateRegistry.set(omit(registry, dnpName));

  autoUpdateDataHasChanged();
}

/**
 * If the DAPPMANAGER is updated the pending state will never be updated to
 * "completed". So on every DAPPMANAGER start it must checked if a successful
 * update happen before restarting
 *
 * @param currentCorePackages To get the current version of installed packages
 * If stored pending coreVersionId contains versions higher than this, it will
 * be marked as done
 * @param timestamp Use ONLY to make tests deterministic
 */
export function clearCompletedCoreUpdatesIfAny(
  currentCorePackages: { dnpName: string; version: string }[],
  timestamp?: number
): void {
  const pending = getPending();

  const { version: pendingVersionId } = pending[coreDnpName] || {};
  const pendingVersionsAreInstalled =
    pendingVersionId &&
    isVersionIdUpdated(pendingVersionId, currentCorePackages);

  if (pendingVersionsAreInstalled && pendingVersionId) {
    flagCompletedUpdate(coreDnpName, pendingVersionId, timestamp);
  }
}

/**
 * Returns a registry of successfully completed auto-updates
 *
 * @returns registry = {
 *   "core.dnp.dappnode.eth": {
 *     "0.2.4": { updated: 1563304834738, successful: true },
 *     "0.2.5": { updated: 1563304834738, successful: false }
 *   },
 *   "bitcoin.dnp.dappnode.eth": {
 *     "0.1.1": { updated: 1563304834738, successful: true },
 *     "0.1.2": { updated: 1563304834738, successful: true }
 *   }
 * }
 */
export function getRegistry(): AutoUpdateRegistry {
  return db.autoUpdateRegistry.get();
}

/**
 * Set a DNP version entry in the registry by merging data
 * Abstracts the lengthy object merging to simply the other functions
 *
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 * @param version "0.2.5"
 * @param data { param: "value" }
 */
function setRegistry(
  dnpName: string,
  version: string,
  data: AutoUpdateRegistryEntry
): void {
  const registry = getRegistry();

  db.autoUpdateRegistry.set({
    ...registry,
    [dnpName]: {
      ...(registry[dnpName] || {}),
      [version]: {
        ...((registry[dnpName] || {})[version] || {}),
        ...data
      }
    }
  });

  autoUpdateDataHasChanged();
}

/**
 * Returns a list of pending auto-updates, 1 per DNP max
 *
 * @returns pending = {
 *   "core.dnp.dappnode.eth": {
 *     version: "0.2.4",
 *     firstSeen: 1563218436285,
 *     scheduledUpdate: 1563304834738,
 *     completedDelay: true
 *   },
 *   "bitcoin.dnp.dappnode.eth": {
 *     version: "0.1.2",
 *     firstSeen: 1563218436285,
 *     scheduledUpdate: 1563304834738,
 *     completedDelay: false,
 *   }
 * }
 */
export function getPending(): AutoUpdatePending {
  return db.autoUpdatePending.get();
}

/**
 * Set a DNP version entry in the registry by merging data
 * Abstracts the lengthy object merging to simply the other functions
 *
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 * @param data { version: "0.2.6", param: "value" }
 */
function setPending(dnpName: string, data: AutoUpdatePendingEntry): void {
  const pending = getPending();
  db.autoUpdatePending.set({
    ...pending,
    [dnpName]: {
      ...(pending[dnpName] || {}),
      ...data
    }
  });

  autoUpdateDataHasChanged();
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
  if (!registry) registry = getRegistry();
  if (!pending) pending = getPending();

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
  const registry = data?.registry || getRegistry();
  const pending = data?.pending || getPending();

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
