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
