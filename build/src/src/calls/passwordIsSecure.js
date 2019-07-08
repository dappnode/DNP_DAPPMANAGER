const db = require("db");
const { isPasswordSecure } = require("modules/passwordManager");

const IS_PASSWORD_SECURE = "is-password-secure";

/**
 * Checks if the user `dappnode`'s password in the host machine
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
const passwordIsSecure = async () => {
  let isSecure;
  isSecure = await db.get(IS_PASSWORD_SECURE);

  if (!isSecure) {
    isSecure = await isPasswordSecure();
    await db.set(IS_PASSWORD_SECURE, isSecure);
  }

  return {
    message: `Checked if password is secure`,
    result: isSecure
  };
};

module.exports = passwordIsSecure;
