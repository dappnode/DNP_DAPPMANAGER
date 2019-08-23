const db = require("db");
const params = require("params");
const { eventBus, eventBusTag } = require("eventBus");
const { pick, omit } = require("lodash");
const { parseCoreVersionIdToStrings } = require("./coreVersionId");
const { includesArray } = require("./arrays");

// Groups of packages keys
const MY_PACKAGES = "my-packages";
const SYSTEM_PACKAGES = "system-packages";
// Db keys
const AUTO_UPDATE_SETTINGS = "auto-update-settings";
const AUTO_UPDATE_REGISTRY = "auto-update-registry";
const AUTO_UPDATE_PENDING = "auto-update-pending";

const updateDelay = params.AUTO_UPDATE_DELAY || 24 * 60 * 60 * 1000; // 1 day
const coreDnpName = params.coreDnpName;

/**
 * Get current auto-update settings
 *
 * @returns {object} autoUpdateSettings = {
 *   "system-packages": { enabled: true }
 *   "my-packages": { enabled: true }
 *   "bitcoin.dnp.dappnode.eth": { enabled: false }
 * }
 */
async function getSettings() {
  const autoUpdateSettings = await db.get(AUTO_UPDATE_SETTINGS);
  if (!autoUpdateSettings) await db.set(AUTO_UPDATE_SETTINGS, {});
  return autoUpdateSettings || {};
}

/**
 * Set the current
 * Abstracts the lengthy object merging to simply the other functions
 *
 * @param {string} id "bitcoin.dnp.dappnode.eth"
 * @param {boolean} enabled true
 */
async function setSettings(id, enabled) {
  const autoUpdateSettings = await getSettings();

  await db.set(AUTO_UPDATE_SETTINGS, {
    ...autoUpdateSettings,
    [id]: { enabled }
  });

  // Update the UI dynamically of the new successful auto-update
  eventBus.emit(eventBusTag.emitAutoUpdateData);
}

/**
 * Edit the settings of regular DNPs
 * - pass the `name` argument to edit a specific DNP
 * - set `name` to null to edit the general My packages setting
 *
 * @param {bool} enabled
 * @param {string} name, if null modifies MY_PACKAGES settings
 */
async function editDnpSetting(enabled, name = MY_PACKAGES) {
  const autoUpdateSettings = await getSettings();

  // When disabling MY_PACKAGES, turn off all DNPs settings by
  // Ignoring all entries but the system packages
  if (name === MY_PACKAGES && !enabled)
    await db.set(
      AUTO_UPDATE_SETTINGS,
      pick(autoUpdateSettings, SYSTEM_PACKAGES)
    );

  // When disabling any DNP, clear their pending updates
  // Ignoring all entries but the system packages
  if (!enabled) await clearPendingUpdates(name);

  await setSettings(name, enabled);
}

/**
 * Edit the general system packages setting
 *
 * @param {bool} enabled
 */
async function editCoreSetting(enabled) {
  await setSettings(SYSTEM_PACKAGES, enabled);

  // When disabling any DNP, clear their pending updates
  // Ignoring all entries but the system packages
  if (!enabled) await clearPendingUpdates(SYSTEM_PACKAGES);
}

/**
 * Check if auto updates are enabled for a specific DNP
 * @param {string} name optional
 * @returns {bool} isEnabled
 */
async function isDnpUpdateEnabled(name = MY_PACKAGES) {
  const settings = await getSettings();

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
async function isCoreUpdateEnabled() {
  return await isDnpUpdateEnabled(SYSTEM_PACKAGES);
}

/**
 * Flags a DNP version as successfully auto-updated
 * The purpose of this information is just to provide feedback in the ADMIN UI
 *
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @param {string} version "0.2.5"
 * @param {number} timestamp Use ONLY to make tests deterministic
 */
async function flagCompletedUpdate(name, version, timestamp) {
  await setRegistry(name, version, {
    updated: timestamp || Date.now(),
    successful: true
  });

  await clearPendingUpdatesOfDnp(name);
}

/**
 * Flags a pending auto-update as error-ed
 * The purpose of this information is just to provide feedback in the ADMIN UI
 *
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @param {string} errorMessage "Mainnet is still syncing"
 */
async function flagErrorUpdate(name, errorMessage) {
  await setPending(name, { errorMessage });
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
async function isUpdateDelayCompleted(name, version, timestamp) {
  if (!timestamp) timestamp = Date.now();

  const pending = await getPending();
  const pendingUpdate = pending[name];

  if (pendingUpdate && pendingUpdate.version === version) {
    const { scheduledUpdate, completedDelay } = pendingUpdate;
    if (timestamp > scheduledUpdate) {
      // Flag the delay as completed (if necessary) and allow the update
      if (!completedDelay) await setPending(name, { completedDelay: true });
      return true;
    } else {
      // Do not allow the update, the delay is not completed
      return false;
    }
  } else {
    // Start the delay object by recording the first seen time
    await setPending(name, {
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
async function clearPendingUpdates(id) {
  const pending = await getPending();

  if (id === MY_PACKAGES) {
    const dnpNames = Object.keys(pending).filter(name => name !== coreDnpName);
    for (const dnpName of dnpNames) {
      await clearPendingUpdatesOfDnp(dnpName);
    }
  } else if (id === SYSTEM_PACKAGES) {
    await clearPendingUpdatesOfDnp(coreDnpName);
  } else {
    await clearPendingUpdatesOfDnp(id);
  }

  // Update the UI dynamically of the new successful auto-update
  eventBus.emit(eventBusTag.emitAutoUpdateData);
}

/**
 * Clears the pending updates from the registry so:
 * - The update delay time is reseted
 * - The UI does no longer show the "Scheduled" info
 *
 * @param {string} name "core.dnp.dappnode.eth", "bitcoin.dnp.dappnode.eth"
 */
async function clearPendingUpdatesOfDnp(name) {
  const pending = await getPending();
  await db.set(AUTO_UPDATE_PENDING, omit(pending, name));
}

/**
 * Clears the auto-update registry entries.
 * Should be used when uninstalling a DNP, for clearing the UI
 * and the install history of the DNP.
 *
 * @param {string} name "core.dnp.dappnode.eth", "bitcoin.dnp.dappnode.eth"
 */
async function clearRegistry(name) {
  const registry = await getRegistry();
  await db.set(AUTO_UPDATE_REGISTRY, omit(registry, name));

  // Update the UI dynamically of the new successful auto-update
  eventBus.emit(eventBusTag.emitAutoUpdateData);
}

/**
 * If the DAPPMANAGER is updated the pending state will never be updated to
 * "completed". So on every DAPPMANAGER start it must checked if a successful
 * update happen before restarting
 *
 * @param {string} currentVersionId "admin@0.2.6,core@0.2.8"
 * @param {number} timestamp Use ONLY to make tests deterministic
 */
async function clearCompletedCoreUpdatesIfAny(currentVersionId, timestamp) {
  const pending = await getPending();

  const { version: pendingVersionId } = pending[coreDnpName] || {};
  const pendingVersionsAreInstalled =
    pendingVersionId &&
    includesArray(
      parseCoreVersionIdToStrings(pendingVersionId),
      parseCoreVersionIdToStrings(currentVersionId)
    );

  if (pendingVersionsAreInstalled) {
    await flagCompletedUpdate(coreDnpName, pendingVersionId, timestamp);
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
async function getRegistry() {
  const registry = await db.get(AUTO_UPDATE_REGISTRY);
  if (!registry) await db.set(AUTO_UPDATE_REGISTRY, {});
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
async function setRegistry(name, version, data) {
  const registry = await getRegistry();

  await db.set(AUTO_UPDATE_REGISTRY, {
    ...registry,
    [name]: {
      ...(registry[name] || {}),
      [version]: {
        ...((registry[name] || {})[version] || {}),
        ...data
      }
    }
  });

  // Update the UI dynamically of the new successful auto-update
  eventBus.emit(eventBusTag.emitAutoUpdateData);
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
async function getPending() {
  const pending = await db.get(AUTO_UPDATE_PENDING);
  if (!pending) await db.set(AUTO_UPDATE_PENDING, {});
  return pending || {};
}

/**
 * Set a DNP version entry in the registry by merging data
 * Abstracts the lengthy object merging to simply the other functions
 *
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @param {object} data { version: "0.2.6", param: "value" }
 */
async function setPending(name, data) {
  const pending = await getPending();
  await db.set(AUTO_UPDATE_PENDING, {
    ...pending,
    [name]: {
      ...(pending[name] || {}),
      ...data
    }
  });

  // Update the UI dynamically of the new successful auto-update
  eventBus.emit(eventBusTag.emitAutoUpdateData);
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
async function getDnpFeedbackMessage({
  id,
  currentVersion,
  registry,
  pending
}) {
  if (!registry) registry = await getRegistry();
  if (!pending) pending = await getPending();

  const currentVersionRegistry = (registry[id] || {})[currentVersion] || {};
  const { version: pendingVersion, scheduledUpdate, errorMessage } =
    pending[id] || {};

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
async function getCoreFeedbackMessage({ currentVersionId, registry, pending }) {
  if (!registry) registry = await getRegistry();
  if (!pending) pending = await getPending();

  const id = coreDnpName;
  /**
   * Let's figure out the version of the core
   */

  const { version: pendingVersion, scheduledUpdate, errorMessage } =
    pending[id] || {};
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
function getLastRegistryEntry(registryDnp = {}) {
  return (
    Object.entries(registryDnp)
      .map(([version, { updated, successful }]) => ({
        version,
        updated,
        successful
      }))
      .filter(({ successful }) => successful)
      .sort((a, b) => a.updated - b.updated)
      .slice(-1)[0] || {}
  );
}

module.exports = {
  // DNPs / my-packages
  editDnpSetting,
  isDnpUpdateEnabled,
  // Core / system-packages
  editCoreSetting,
  isCoreUpdateEnabled,
  getSettings,
  // To keep a registry of performed updates
  // + Enforce a delay before auto-updating
  flagCompletedUpdate,
  flagErrorUpdate,
  isUpdateDelayCompleted,
  clearPendingUpdates,
  clearRegistry,
  clearCompletedCoreUpdatesIfAny,
  getRegistry,
  // Pending updates
  getPending,
  getDnpFeedbackMessage,
  getCoreFeedbackMessage,
  // Utils
  getLastRegistryEntry,
  // String constants
  MY_PACKAGES,
  SYSTEM_PACKAGES,
  AUTO_UPDATE_SETTINGS,
  AUTO_UPDATE_REGISTRY,
  AUTO_UPDATE_PENDING
};
