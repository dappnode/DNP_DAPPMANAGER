import * as db from "@dappnode/db";
import { shell } from "@dappnode/utils";
import { getDappmanagerImage } from "@dappnode/dockerapi";

const insecureSalt = "insecur3";

const baseCommand = `docker run --rm -v /etc:/etc --privileged --entrypoint=""`;

/**
 * Checks if the user `dappnode`'s password in the host machine
 * is NOT the insecure default set at installation time.
 * It does so by checking if the current salt is `insecur3`
 *
 * @returns true = is secure / false = is not
 */
export async function isPasswordSecure(): Promise<boolean> {
  const image = await getDappmanagerImage();
  try {
    const res = await shell(
      `${baseCommand} ${image} sh -c "grep dappnode:.*${insecureSalt} /etc/shadow"`
    );
    return !res;
  } catch (e) {
    /**
     * From the man grep page:
     * The exit status is 0 if selected lines are found and 1 otherwise
     * The exit status is 2 if an error occurred
     */
    if (e.code == 1) return true;
    else throw e;
  }
}

/**
 * Changes the user `dappnode`'s password in the host machine
 * Only allows it if the current password is considered insecure
 *
 * @param newPassword = "super-secure-password"
 */
export async function changePassword(newPassword: string): Promise<void> {
  if (!newPassword) throw Error("newPassword must be defined");
  if (typeof newPassword !== "string")
    throw Error("newPassword must be a string");

  /**
   * Make sure the password is OK:
   * - Is longer than 8 characters, for security
   * - Does not contain the `'` character, which would break the command
   * - Does not contain non-ascii characters which may cause trouble in the command
   */
  if (newPassword.length < 8)
    throw Error("password length must be at least 8 characters");
  if (!/^((?!['])[\x20-\x7F])*$/.test(newPassword))
    throw Error(
      `Password must contain only ASCII characters and not the ' character`
    );

  if (await isPasswordSecure())
    throw Error(
      "The password can only be changed if it's the insecure default"
    );

  const image = await getDappmanagerImage();
  await shell(
    `${baseCommand} -e PASS='${newPassword}' ${image} sh -c 'echo dappnode:$PASS | chpasswd'`
  );
}

// API calls

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
 * @returns true = is secure / false = is not
 */
export async function passwordIsSecure(): Promise<boolean> {
  if (db.passwordIsSecure.get()) {
    return true;
  } else {
    const isSecure = await isPasswordSecure();
    if (isSecure) db.passwordIsSecure.set(isSecure);
    return isSecure;
  }
}

/**
 * Changes the user `dappnode`'s password in the host machine
 * Only allows it if the current password has the salt `insecur3`
 *
 * @param newPassword super-secure-password
 */
export async function passwordChange({
  newPassword
}: {
  newPassword: string;
}): Promise<void> {
  if (!newPassword) throw Error("Argument newPassword must be defined");

  await changePassword(newPassword);

  // Update the DB "is-password-secure" check
  await passwordIsSecure();
}
