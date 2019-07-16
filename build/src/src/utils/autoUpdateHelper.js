const db = require("db");
const computeSemverUpdateType = require("utils/computeSemverUpdateType");

// Groups of packages keys
const MY_PACKAGES = "my-packages";
const SYSTEM_PACKAGES = "system-packages";
// Db keys
const AUTO_UPDATE_SETTINGS = "auto-update-settings";

/**
 * Checks the local DB for user settings, to decide if an update is allowed
 *
 * @param {string} name "bitcoin.dnp.dappnode.eth"
 * @param {string} from "0.2.0"
 * @param {string} to "0.2.1"
 */
async function isUpdateAllowed(id, from, to) {
  const autoUpdateSettings = await getSettings();

  // Check if autoupdates are allowed for this id
  if (!autoUpdateSettings[id]) return false;

  // Compute the update type: "major", "minor", "patch"
  const updateType = computeSemverUpdateType(from, to);
  if (!updateType) return false;

  // My packages are allowed to be updated for "minor" and "patch"
  if (id === MY_PACKAGES)
    return updateType === "minor" || updateType === "patch";

  // System packages are only allowed to be updated for "patch"
  if (id === SYSTEM_PACKAGES) return updateType === "patch";

  throw Error(`Unknown id ${id}`);
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
async function editSettings(id, active) {
  if (id !== MY_PACKAGES && id !== SYSTEM_PACKAGES)
    throw Error(`id must be ${MY_PACKAGES} or ${SYSTEM_PACKAGES}: ${id}`);

  const autoUpdateSettings = await getSettings();

  await db.set(AUTO_UPDATE_SETTINGS, {
    ...autoUpdateSettings,
    [id]: active
  });
}

/**
 * Shortcuts to prevent naming errors
 */

async function editDnpSetting(active) {
  return await editSettings(MY_PACKAGES, active);
}

async function editCoreSetting(active) {
  return await editSettings(SYSTEM_PACKAGES, active);
}

async function isDnpUpdateAllowed(from, to) {
  return await isUpdateAllowed(MY_PACKAGES, from, to);
}

async function isCoreUpdateAllowed(from, to) {
  return await isUpdateAllowed(SYSTEM_PACKAGES, from, to);
}

async function isDnpUpdateEnabled() {
  return (await getSettings())[MY_PACKAGES] || false;
}

async function isCoreUpdateEnabled() {
  return (await getSettings())[SYSTEM_PACKAGES] || false;
}

module.exports = {
  // DNPs / my-packages
  editDnpSetting,
  isDnpUpdateEnabled,
  isDnpUpdateAllowed,
  // Core / system-packages
  editCoreSetting,
  isCoreUpdateEnabled,
  isCoreUpdateAllowed,
  editSettings,
  getSettings,
  // String constants
  MY_PACKAGES,
  SYSTEM_PACKAGES,
  AUTO_UPDATE_SETTINGS
};
