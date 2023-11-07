import { updateUpgrade as executeUpdateUpgrade } from "@dappnode/hostscripts";

/**
 * Updates and upgrades the host machine
 */
export async function updateUpgrade(): Promise<string> {
  return await executeUpdateUpgrade();
}
