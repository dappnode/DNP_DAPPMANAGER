const { isSshPasswordSecure } = require("modules/sshPassword");

/**
 * Changes the SSH password of the host for the user `dappnode`
 * Only allows it if the current password has the salt `insecur3`
 *
 * @param {string} newPassword super-secure-password
 */
const sshPasswordIsSecure = async () => {
  const isSecure = await isSshPasswordSecure();

  return {
    message: `Checked if SSH password is secure`,
    result: isSecure
  };
};

module.exports = sshPasswordIsSecure;
