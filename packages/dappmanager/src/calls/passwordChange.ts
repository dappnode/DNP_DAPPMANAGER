import { changePassword } from "../modules/passwordManager.js";
// External calls
import { passwordIsSecure } from "./passwordIsSecure.js";

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
