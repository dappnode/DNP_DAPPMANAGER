const autoUpdateHelper = require("utils/autoUpdateHelper");

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
const autoUpdateSettingsGet = async () => {
  return {
    message: `Got auto updated settings`,
    result: await autoUpdateHelper.getSettings()
  };
};

module.exports = autoUpdateSettingsGet;
