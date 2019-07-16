const db = require("db");
const computeSemverUpdateType = require("utils/computeSemverUpdateType");

const AUTO_UPDATE_SETTINGS = "auto-update-settings";
const MY_PACKAGES = "my-packages";
const validSettings = ["off", "patch", "minor"];
const validCoreSettings = ["off", "patch"];
const coreName = "core.dnp.dappnode.eth";

/**
 * Checks the local DB for user settings, to decide if an update is allowed
 *
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @param {string} from "0.2.0"
 * @param {string} to "0.2.1"
 */
async function isUpdateAllowed(name, from, to) {
  const autoUpdateSettings = await getSettings();

  // Compute the update type
  const updateType = computeSemverUpdateType(from, to);
  if (!updateType) return false;

  // Check if the update type is allowed
  if (name === coreName) {
    // For the core / system packages, only patch is allowed
    return updateType === "patch" && autoUpdateSettings[name] === "patch";
  } else {
    const setting = autoUpdateSettings[name] || autoUpdateSettings[MY_PACKAGES];
    const allowedIndex = validSettings.indexOf(setting);
    const requestedIndex = validSettings.indexOf(updateType);
    return requestedIndex > 0 && allowedIndex >= requestedIndex;
  }
}

/**
 * Get current auto-update settings
 *
 * @returns {object} autoUpdateSettings = {
 *   "any": "minor"
 *   "bitcoin.dnp.dappnode.eth": "off"
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
 * Edit auto update settings that apply to only one DNP
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @param {object} settings = "patch"
 */
async function editDnpSettings(name, setting) {
  const autoUpdateSettings = await getSettings();

  if (name === coreName && !validCoreSettings.includes(setting))
    throw Error(`Invalid core key in update settings: ${setting}`);
  if (!validSettings.includes(setting))
    throw Error(`Invalid key in update settings: ${setting}`);

  await db.set(AUTO_UPDATE_SETTINGS, {
    ...autoUpdateSettings,
    [name]: setting
  });
}

/**
 * Edit auto update settings that apply to ALL DNPs
 * @param {object} settings = "any"
 */
async function editGeneralSettings(setting) {
  await editDnpSettings(MY_PACKAGES, setting);
}

/**
 * Reset the auto update settings of no-core packages to no setting
 */
async function resetDnpsSettings() {
  const autoUpdateSettings = await getSettings();
  const coreSetting = autoUpdateSettings[coreName];
  await db.set(
    AUTO_UPDATE_SETTINGS,
    coreSetting ? { [coreName]: coreSetting } : {}
  );
}

module.exports = {
  isUpdateAllowed,
  editDnpSettings,
  editGeneralSettings,
  resetDnpsSettings,
  getSettings
};
