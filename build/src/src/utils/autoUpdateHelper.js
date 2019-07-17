const db = require("db");

// Groups of packages keys
const MY_PACKAGES = "my-packages";
const SYSTEM_PACKAGES = "system-packages";
// Db keys
const AUTO_UPDATE_SETTINGS = "auto-update-settings";

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

module.exports = {
  // DNPs / my-packages
  editDnpSetting,
  isDnpUpdateEnabled,
  // Core / system-packages
  editCoreSetting,
  isCoreUpdateEnabled,
  getSettings,
  // String constants
  MY_PACKAGES,
  SYSTEM_PACKAGES,
  AUTO_UPDATE_SETTINGS
};
