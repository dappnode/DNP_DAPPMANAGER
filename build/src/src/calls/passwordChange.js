const { changePassword } = require("modules/passwordManager");
// External calls
const passwordIsSecure = require("./passwordIsSecure");

/**
 * Changes the user `dappnode`'s password in the host machine
 * Only allows it if the current password has the salt `insecur3`
 *
 * @param {string} newPassword super-secure-password
 */
const passwordChange = async ({ newPassword }) => {
  if (!newPassword) throw Error("Argument newPassword must be defined");

  await changePassword(newPassword);

  // Update the DB "is-password-secure" check
  await passwordIsSecure();

  return {
    message: `Changed password`,
    logMessage: true,
    userAction: true
  };
};

module.exports = passwordChange;
