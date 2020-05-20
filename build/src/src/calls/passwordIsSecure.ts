import { ReturnData } from "../route-types/passwordIsSecure";
import { isPasswordSecure } from "../modules/passwordManager";
import * as db from "../db";

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
export async function passwordIsSecure(): Promise<ReturnData> {
  if (db.passwordIsSecure.get()) {
    return true;
  } else {
    const isSecure = await isPasswordSecure();
    if (isSecure) db.passwordIsSecure.set(isSecure);
    return isSecure;
  }
}
