const {
  MY_PACKAGES, // "my-packages"
  SYSTEM_PACKAGES, // "system-packages"
  editDnpSetting,
  editCoreSetting
} = require("utils/autoUpdateHelper");

/**
 * Edits the auto-update settings
 *
 * @param {string} id = "my-packages", "system-packages" or "bitcoin.dnp.dappnode.eth"
 * @param {bool} enabled Auto update is enabled for ID
 */
const autoUpdateSettingsEdit = async ({ id, enabled }) => {
  if (!id)
    throw Error(`Argument id is required or generalSettings must be true`);

  if (id === MY_PACKAGES) await editDnpSetting(enabled);
  else if (id === SYSTEM_PACKAGES) await editCoreSetting(enabled);
  else await editDnpSetting(enabled, id);

  const name = ((id || "").split(".")[0] || "").replace("-", " ");
  return {
    message: `${enabled ? "Enabled" : "Disabled"} auto updates for ${name}`,
    logMessage: true,
    userAction: true
  };
};

module.exports = autoUpdateSettingsEdit;
