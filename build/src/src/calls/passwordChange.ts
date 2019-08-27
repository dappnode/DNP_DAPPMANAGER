import { changePassword } from "../modules/passwordManager";
// External calls
import passwordIsSecure from "./passwordIsSecure";

/**
 * Changes the user `dappnode`'s password in the host machine
 * Only allows it if the current password has the salt `insecur3`
 *
 * @param {string} newPassword super-secure-password
 */
export default async function passwordChange({
  newPassword
}: {
  newPassword: string;
}) {
  if (!newPassword) throw Error("Argument newPassword must be defined");

  await changePassword(newPassword);

  // Update the DB "is-password-secure" check
  await passwordIsSecure();

  return {
    message: `Changed password`,
    logMessage: true,
    userAction: true,
    privateKwargs: true
  };
}
