const { changeSshPassword } = require("modules/sshPassword");

/**
 * Changes the SSH password of the host for the user `dappnode`
 * Only allows it if the current password has the salt `insecur3`
 *
 * @param {string} newPassword super-secure-password
 */
const sshPasswordChange = async ({ newPassword }) => {
  await changeSshPassword(newPassword);

  return {
    message: `Changed SSH password`,
    logMessage: true,
    userAction: true
  };
};

module.exports = sshPasswordChange;
