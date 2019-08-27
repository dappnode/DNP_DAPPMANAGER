import { isPasswordSecure } from "../modules/passwordManager";

let isSecureCache = false;

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
export default async function passwordIsSecure() {
  if (!isSecureCache) isSecureCache = await isPasswordSecure();

  return {
    message: `Checked if password is secure`,
    result: isSecureCache
  };
}
