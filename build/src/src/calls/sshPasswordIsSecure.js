const db = require("db");
const { isSshPasswordSecure } = require("modules/sshPassword");

const IS_SSH_PASSWORD_SECURE = "is-ssh-password-secure";

/**
 * Checks if the SSH password of the host for the user `dappnode`
 * is NOT the insecure default set at installation time.
 * It does so by checking if the current salt is `insecur3`
 *
 * - This check will be run every time this node app is started
 *   - If the password is SECURE it will NOT be run anymore
 *     and this call will return true always
 *   - If the password is INSECURE this check will be run every
 *     time the admin requests it (on page load)
 *
 * @returns {bool} true = is secure / false = is not
 */
const sshPasswordIsSecure = async () => {
  let isSecure;
  isSecure = await db.get(IS_SSH_PASSWORD_SECURE);

  if (!isSecure) {
    isSecure = await isSshPasswordSecure();
    await db.set(IS_SSH_PASSWORD_SECURE, isSecure);
  }

  return {
    message: `Checked if SSH password is secure`,
    result: isSecure
  };
};

module.exports = sshPasswordIsSecure;
