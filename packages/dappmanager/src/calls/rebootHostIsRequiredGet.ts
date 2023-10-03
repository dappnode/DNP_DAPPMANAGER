import { shellHost } from "@dappnode/utils";

/**
 * Checks weather or not the host machine needs to be rebooted
 * @returns true if the host machine needs to be rebooted
 */
export async function rebootHostIsRequiredGet(): Promise<boolean> {
  try {
    // Check if the host machine needs to be rebooted by
    // checking for the existence of the reboot-required file
    await shellHost("test -f /var/run/reboot-required");
    return true;
  } catch (e) {
    // If the file does not exist, the host machine does not need to be rebooted
    return false;
  }
}
