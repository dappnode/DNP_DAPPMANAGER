const autoUpdateHelper = require("utils/autoUpdateHelper");

/**
 * Edits the auto-update settings
 *
 * @param {string} id = "bitcoin.dnp.dappnode.eth"
 * @param {bool} generalSettings Edit the general settings
 * @param {bool} applyToAll Reset all DNP individual settings
 * @param {object} settings = { major: false, minor: false, patch: true }
 */
const autoUpdateSettingsEdit = async ({
  id,
  generalSettings,
  applyToAll,
  settings
}) => {
  if (!id && !generalSettings)
    throw Error(`Argument id is required or generalSettings must be true`);
  if (!settings) throw Error(`Argument settings must be defined`);

  if (generalSettings) {
    if (applyToAll) await autoUpdateHelper.resetDnpsSettings();
    await autoUpdateHelper.editGeneralSettings(settings);
  } else {
    await autoUpdateHelper.editDnpSettings(id, settings);
  }

  return {
    message: `Edited auto update settings for ${id}`,
    logMessage: true,
    userAction: true
  };
};

module.exports = autoUpdateSettingsEdit;
