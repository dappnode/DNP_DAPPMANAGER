const { changeSshPassword } = require("modules/sshPassword");
// External calls
const sshPasswordIsSecure = require("./sshPasswordIsSecure");

/**
 * Changes the SSH password of the host for the user `dappnode`
 * Only allows it if the current password has the salt `insecur3`
 *
 * @param {string} newPassword super-secure-password
 */
const sshPasswordChange = async ({ newPassword }) => {
  if (!newPassword) throw Error("Argument newPassword must be defined");

  await changeSshPassword(newPassword);

  // Update the DB "is-ssh-password-secure" check
  await sshPasswordIsSecure();

  return {
    message: `Changed SSH password`,
    logMessage: true,
    userAction: true
  };
};

module.exports = sshPasswordChange;
