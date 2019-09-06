import * as db from "../db";
import params from "../params";
import * as eventBus from "../eventBus";
import { pick, omit } from "lodash";
import { parseCoreVersionIdToStrings } from "./coreVersionId";
import { includesArray } from "./arrays";
import {
  AutoUpdateSettings,
  AutoUpdateRegistryEntry,
  AutoUpdateRegistryDnp,
  AutoUpdateRegistry,
  AutoUpdatePendingEntry,
  AutoUpdatePending,
  AutoUpdateFeedback
} from "../types";

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
 * @returns {object} autoUpdateSettings = {
 *   "system-packages": { enabled: true }
 *   "my-packages": { enabled: true }
 *   "bitcoin.dnp.dappnode.eth": { enabled: false }
 * }
 */
export function getSettings(): AutoUpdateSettings {
  const autoUpdateSettings: AutoUpdateSettings = db.getAutoUpdateSettings();
  if (!autoUpdateSettings) db.setAutoUpdateSettings({});
  return autoUpdateSettings || {};
}

/**
 * Set the current
 * Abstracts the lengthy object merging to simply the other functions
 *
 * @param {string} id "bitcoin.dnp.dappnode.eth"
 * @param {boolean} enabled true
 */
function setSettings(id: string, enabled: boolean): void {
  const autoUpdateSettings = getSettings();

  db.setAutoUpdateSettings({
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
 * @param {bool} enabled
 * @param {string} name, if null modifies MY_PACKAGES settings
 */
export function editDnpSetting(enabled: boolean, name = MY_PACKAGES): void {
  const autoUpdateSettings = getSettings();

  // When disabling MY_PACKAGES, turn off all DNPs settings by
  // Ignoring all entries but the system packages
  if (name === MY_PACKAGES && !enabled)
    db.setAutoUpdateSettings(pick(autoUpdateSettings, SYSTEM_PACKAGES));

  // When disabling any DNP, clear their pending updates
  // Ignoring all entries but the system packages
  if (!enabled) clearPendingUpdates(name);

  setSettings(name, enabled);
}

/**
 * Edit the general system packages setting
 *
 * @param {bool} enabled
 */
export function editCoreSetting(enabled: boolean): void {
  setSettings(SYSTEM_PACKAGES, enabled);

  // When disabling any DNP, clear their pending updates
  // Ignoring all entries but the system packages
  if (!enabled) clearPendingUpdates(SYSTEM_PACKAGES);
}

/**
 * Check if auto updates are enabled for a specific DNP
 * @param {string} name optional
 * @returns {bool} isEnabled
 */
export function isDnpUpdateEnabled(name = MY_PACKAGES): boolean {
  const settings = getSettings();

  // If checking the general MY_PACKAGES setting,
  // or a DNP that does not has a specific setting,
  // use the general MY_PACKAGES setting
  if (!settings[name]) name = MY_PACKAGES;
  return (settings[name] || {}).enabled ? true : false;
}

/**
 * Check if auto updates are enabled for system packages
 * @returns {bool} isEnabled
 */
export function isCoreUpdateEnabled(): boolean {
  const settings = getSettings();
  return (settings[SYSTEM_PACKAGES] || {}).enabled ? true : false;
}

/**
 * Flags a DNP version as successfully auto-updated
 * The purpose of this information is just to provide feedback in the ADMIN UI
 *
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @param {string} version "0.2.5"
 * @param {number} timestamp Use ONLY to make tests deterministic
 */
export function flagCompletedUpdate(
  name: string,
  version: string,
  timestamp?: number
): void {
  setRegistry(name, version, {
    updated: timestamp || Date.now(),
    successful: true
  });

  clearPendingUpdatesOfDnp(name);
}

/**
 * Flags a pending auto-update as error-ed
 * The purpose of this information is just to provide feedback in the ADMIN UI
 *
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @param {string} errorMessage "Mainnet is still syncing"
 */
export function flagErrorUpdate(name: string, errorMessage: string): void {
  setPending(name, { errorMessage });
}

/**
 * Auto-updates must be performed 24h after "seeing" the new version
 * - There is a "pending" queue with only one possible slot
 * - If the version is seen for the first time, it will be added
 *   to the queue and delete the older queue item if any
 * - If the version is the same as the one in the queue, the delay
 *   will be checked and if it's completed the update is authorized
 *
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @param {string} version "0.2.5"
 * @param {number} timestamp Use ONLY to make tests deterministic
 */
export function isUpdateDelayCompleted(
  name: string,
  version: string,
  timestamp?: number
): boolean {
  if (!timestamp) timestamp = Date.now();

  const pending = getPending();
  const pendingUpdate = pending[name];

  if (pendingUpdate && pendingUpdate.version === version) {
    const { scheduledUpdate, completedDelay } = pendingUpdate;
    if (scheduledUpdate && timestamp > scheduledUpdate) {
      // Flag the delay as completed (if necessary) and allow the update
      if (!completedDelay) setPending(name, { completedDelay: true });
      return true;
    } else {
      // Do not allow the update, the delay is not completed
      return false;
    }
  } else {
    // Start the delay object by recording the first seen time
    setPending(name, {
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
 * @param {string} id "my-packages", "system-packages", "bitcoin.dnp.dappnode.eth"
 */
export function clearPendingUpdates(id: string): void {
  const pending = getPending();

  if (id === MY_PACKAGES) {
    const dnpNames = Object.keys(pending).filter(name => name !== coreDnpName);
    for (const dnpName of dnpNames) {
      clearPendingUpdatesOfDnp(dnpName);
    }
  } else if (id === SYSTEM_PACKAGES) {
    clearPendingUpdatesOfDnp(coreDnpName);
  } else {
    clearPendingUpdatesOfDnp(id);
  }

  autoUpdateDataHasChanged();
}

/**
 * Clears the pending updates from the registry so:
 * - The update delay time is reseted
 * - The UI does no longer show the "Scheduled" info
 *
 * @param {string} name "core.dnp.dappnode.eth", "bitcoin.dnp.dappnode.eth"
 */
function clearPendingUpdatesOfDnp(name: string): void {
  const pending = getPending();
  db.setAutoUpdatePending(omit(pending, name));
}

/**
 * Clears the auto-update registry entries.
 * Should be used when uninstalling a DNP, for clearing the UI
 * and the install history of the DNP.
 *
 * @param {string} name "core.dnp.dappnode.eth", "bitcoin.dnp.dappnode.eth"
 */
export function clearRegistry(name: string): void {
  const registry = getRegistry();
  db.setAutoUpdateRegistry(omit(registry, name));

  autoUpdateDataHasChanged();
}

/**
 * If the DAPPMANAGER is updated the pending state will never be updated to
 * "completed". So on every DAPPMANAGER start it must checked if a successful
 * update happen before restarting
 *
 * @param {string} currentVersionId "admin@0.2.6,core@0.2.8"
 * @param {number} timestamp Use ONLY to make tests deterministic
 */
export function clearCompletedCoreUpdatesIfAny(
  currentVersionId: string,
  timestamp?: number
): void {
  const pending = getPending();

  const { version: pendingVersionId } =
    pending[coreDnpName] || ({} as AutoUpdatePendingEntry);
  const pendingVersionsAreInstalled =
    pendingVersionId &&
    includesArray(
      parseCoreVersionIdToStrings(pendingVersionId),
      parseCoreVersionIdToStrings(currentVersionId)
    );

  if (pendingVersionsAreInstalled && pendingVersionId) {
    flagCompletedUpdate(coreDnpName, pendingVersionId, timestamp);
  }
}

/**
 * Returns a registry of successfully completed auto-updates
 *
 * @returns {object} registry = {
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
  const registry = db.getAutoUpdateRegistry();
  if (!registry) db.setAutoUpdateRegistry({});
  return registry || {};
}

/**
 * Set a DNP version entry in the registry by merging data
 * Abstracts the lengthy object merging to simply the other functions
 *
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @param {string} version "0.2.5"
 * @param {object} data { param: "value" }
 */
function setRegistry(
  name: string,
  version: string,
  data: AutoUpdateRegistryEntry
): void {
  const registry = getRegistry();

  db.setAutoUpdateRegistry({
    ...registry,
    [name]: {
      ...(registry[name] || {}),
      [version]: {
        ...((registry[name] || {})[version] || {}),
        ...data
      }
    }
  });

  autoUpdateDataHasChanged();
}

/**
 * Returns a list of pending auto-updates, 1 per DNP max
 *
 * @returns {object} pending = {
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
  const pending = db.getAutoUpdatePending();
  if (!pending) db.setAutoUpdatePending({});
  return pending || {};
}

/**
 * Set a DNP version entry in the registry by merging data
 * Abstracts the lengthy object merging to simply the other functions
 *
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @param {object} data { version: "0.2.6", param: "value" }
 */
function setPending(name: string, data: AutoUpdatePendingEntry): void {
  const pending = getPending();
  db.setAutoUpdatePending({
    ...pending,
    [name]: {
      ...(pending[name] || {}),
      ...data
    }
  });

  autoUpdateDataHasChanged();
}

/**
 * Get an auto-update feedback message
 *
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @param {string} currentVersion "0.2.6", must come from dockerList, dnp.version
 * @return {object} feedback = {
 *   updated: 15363818244,
 *   manuallyUpdated: true,
 *   inQueue: true,
 *   scheduled: 15363818244
 * }
 */
export function getDnpFeedbackMessage({
  id,
  currentVersion,
  registry,
  pending
}: {
  id: string;
  currentVersion: string;
  registry?: AutoUpdateRegistry;
  pending?: AutoUpdatePending;
}): AutoUpdateFeedback {
  if (!registry) registry = getRegistry();
  if (!pending) pending = getPending();

  const currentVersionRegistry = (registry[id] || {})[currentVersion] || {};
  const { version: pendingVersion, scheduledUpdate, errorMessage } =
    pending[id] || ({} as AutoUpdatePendingEntry);

  const lastUpdatedVersion = getLastRegistryEntry(registry[id] || {});
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
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @param {string} currentVersion "0.2.6", must come from dockerList, dnp.version
 * @return {object} feedback = {
 *   updated: 15363818244,
 *   manuallyUpdated: true,
 *   inQueue: true,
 *   scheduled: 15363818244
 * }
 */
export function getCoreFeedbackMessage({
  currentVersionId,
  registry,
  pending
}: {
  currentVersionId: string;
  registry?: AutoUpdateRegistry;
  pending?: AutoUpdatePending;
}): AutoUpdateFeedback {
  if (!registry) registry = getRegistry();
  if (!pending) pending = getPending();

  const id = coreDnpName;
  /**
   * Let's figure out the version of the core
   */

  const { version: pendingVersion, scheduledUpdate, errorMessage } =
    pending[id] || ({} as AutoUpdatePendingEntry);
  const lastUpdatedVersion = getLastRegistryEntry(registry[id] || {});
  const lastUpdatedVersionsAreInstalled =
    lastUpdatedVersion.version &&
    includesArray(
      parseCoreVersionIdToStrings(lastUpdatedVersion.version),
      parseCoreVersionIdToStrings(currentVersionId)
    );
  const pendingVersionsAreInstalled =
    pendingVersion &&
    includesArray(
      parseCoreVersionIdToStrings(pendingVersion),
      parseCoreVersionIdToStrings(currentVersionId)
    );

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
 * @param {object} registryDnp
 * @return {object}
 */
export function getLastRegistryEntry(
  registryDnp: AutoUpdateRegistryDnp
): {
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
