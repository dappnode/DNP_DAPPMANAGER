const db = require("db");
const params = require("params");

// Groups of packages keys
const MY_PACKAGES = "my-packages";
const SYSTEM_PACKAGES = "system-packages";
// Db keys
const AUTO_UPDATE_SETTINGS = "auto-update-settings";
const AUTO_UPDATE_REGISTRY = "auto-update-registry";

const updateDelay = params.AUTO_UPDATE_DELAY || 24 * 60 * 60 * 1000; // 1 day

/**
 * Get current auto-update settings
 *
 * - "system-packages" = if the update is enabled
 * - "my-packages" = an object, means the default settings is update enabled
 * - "my-packages"["bitcoin.dnp.dappnode.eth"] = true, means that the
 *   update is NOT enabled
 *
 * @returns {object} autoUpdateSettings = {
 *   "system-packages": true
 *   "my-packages": {
 *     "bitcoin.dnp.dappnode.eth": true
 *   }
 * }
 */
async function getSettings() {
  const autoUpdateSettings = await db.get(AUTO_UPDATE_SETTINGS);
  if (autoUpdateSettings) {
    return autoUpdateSettings;
  } else {
    await db.set(AUTO_UPDATE_SETTINGS, {});
    return {};
  }
}

/**
 * Edit the settings of regular DNPs
 * - pass the `name` argument to edit a specific DNP
 * - set `name` to null to edit the general My packages setting
 *
 * @param {bool} enabled
 * @param {string} name optional
 */
async function editDnpSetting(enabled, name) {
  const autoUpdateSettings = await getSettings();
  if (name) {
    // Modify the specific DNP settings. The are stored INVERTED.
    // true = not enabled, false = enabled
    await db.set(AUTO_UPDATE_SETTINGS, {
      ...autoUpdateSettings,
      [MY_PACKAGES]: {
        ...(autoUpdateSettings[MY_PACKAGES] || {}),
        [name]: !enabled
      }
    });
  } else {
    if (enabled) {
      // Set the "my-packages" property to an empty object to be truthy
      // and turn on updates for all packages
      if (!autoUpdateSettings[MY_PACKAGES])
        await db.set(AUTO_UPDATE_SETTINGS, {
          ...autoUpdateSettings,
          [MY_PACKAGES]: {}
        });
    } else {
      // Set the "my-packages" property to an null to turn OFF
      // updates for all packages and override the custom settings
      await db.set(AUTO_UPDATE_SETTINGS, {
        ...autoUpdateSettings,
        [MY_PACKAGES]: null
      });
    }
  }
}

/**
 * Edit the general system packages setting
 *
 * @param {bool} enabled
 */
async function editCoreSetting(enabled) {
  const autoUpdateSettings = await getSettings();
  await db.set(AUTO_UPDATE_SETTINGS, {
    ...autoUpdateSettings,
    [SYSTEM_PACKAGES]: enabled
  });
}

/**
 * Check if auto updates are enabled for a specific DNP
 * @param {string} name optional
 * @returns {bool} isEnabled
 */
async function isDnpUpdateEnabled(name) {
  const settings = await getSettings();
  const myPackages = settings[MY_PACKAGES];
  if (name) {
    return myPackages && !myPackages[name] ? true : false;
  } else {
    return myPackages ? true : false;
  }
}

/**
 * Check if auto updates are enabled for system packages
 * @returns {bool} isEnabled
 */
async function isCoreUpdateEnabled() {
  return (await getSettings())[SYSTEM_PACKAGES] || false;
}

/**
 * Flags a DNP version as successfully auto-updated
 * The purpose of this information is just to provide feedback in the ADMIN UI
 *
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @param {string} version "0.2.5"
 * @param {number} timestamp Use ONLY to make tests deterministic
 */
async function flagSuccessfulUpdate(name, version, timestamp) {
  await setRegistry(name, version, { updated: timestamp || Date.now() });
}

/**
 * Unflag a successful update. Used only for core update, since if
 * the DAPPMANAGER is updated the update can never be flagged as successful
 *
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @param {string} version "0.2.5"
 */
async function unflagSuccessfulUpdate(name, version) {
  await setRegistry(name, version, { updated: null });
}

/**
 * Auto-updates must be performed 24h after "seeing" the new version
 *
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @param {string} version "0.2.5"
 * @param {number} timestamp Use ONLY to make tests deterministic
 */
async function isUpdateDelayCompleted(name, version, timestamp) {
  const registry = await getRegistry();
  const { firstSeen } = ((registry || {})[name] || {})[version] || {};
  if (firstSeen) {
    if (Date.now() - firstSeen > updateDelay) {
      // Flag the delay as completed and allow the update
      await setRegistry(name, version, { completedDelay: true });
      return true;
    } else {
      // Do not allow the update, the delay is not completed
      return false;
    }
  } else {
    // Start the delay object by recording the first seen time
    await setRegistry(name, version, { firstSeen: timestamp || Date.now() });
    return false;
  }
}

/**
 * Returns a registry of successfully completed auto-updates
 *
 * @returns {object} registry = {
 *   "core.dnp.dappnode.eth": {
 *     "0.2.4": { firstSeen: 1563218436285, updated: 1563304834738, completedDelay: true },
 *     "0.2.5": { firstSeen: 1563371560487 }
 *   },
 *   "bitcoin.dnp.dappnode.eth": {
 *     "0.1.1": { firstSeen: 1563218436285, updated: 1563304834738, completedDelay: true },
 *     "0.1.2": { firstSeen: 1563371560487 }
 *   }
 * }
 */
async function getRegistry() {
  const registry = await db.get(AUTO_UPDATE_REGISTRY);
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
  flagSuccessfulUpdate,
  unflagSuccessfulUpdate,
  isUpdateDelayCompleted,
  getRegistry,
  // String constants
  MY_PACKAGES,
  SYSTEM_PACKAGES,
  AUTO_UPDATE_SETTINGS,
  AUTO_UPDATE_REGISTRY
};
