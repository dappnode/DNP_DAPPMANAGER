const autoUpdateHelper = require("utils/autoUpdateHelper");

/**
 * Get current auto-update settings
 *
 * @returns {object} autoUpdateSettings = {
 *   "any": { major: false, minor: false, patch: true },
 *   "bitcoin.dnp.dappnode.eth": { major: false, minor: true, patch: true }
 * }
 */
const autoUpdateSettingsGet = async () => {
  return {
    message: `Got auto updated settings`,
    result: await autoUpdateHelper.getSettings()
  };
};

module.exports = autoUpdateSettingsGet;
