const {
  MY_PACKAGES, // "my-packages"
  SYSTEM_PACKAGES, // "system-packages"
  editDnpSetting,
  editCoreSetting
} = require("utils/autoUpdateHelper");

/**
 * Edits the auto-update settings
 *
 * @param {string} id = "bitcoin.dnp.dappnode.eth"
 * @param {bool} active Auto update is active for ID
 */
const autoUpdateSettingsEdit = async ({ id, active }) => {
  if (!id)
    throw Error(`Argument id is required or generalSettings must be true`);

  if (id === MY_PACKAGES) await editDnpSetting(active);
  else if (id === SYSTEM_PACKAGES) await editCoreSetting(active);
  else throw Error(`id must be ${MY_PACKAGES} or ${SYSTEM_PACKAGES}: ${id}`);

  const name = (id || "").replace("-", " ");
  return {
    message: `${active ? "Enabled" : "Disabled"} auto updates for ${name}`,
    logMessage: true,
    userAction: true
  };
};

module.exports = autoUpdateSettingsEdit;
