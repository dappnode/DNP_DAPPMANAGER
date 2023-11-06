import { RebootRequiredScript } from "@dappnode/common";
import { getRebootRequiredMemoized } from "@dappnode/hostscripts";

/**
 * Checks weather or not the host machine needs to be rebooted
 *
 */
export async function rebootHostIsRequiredGet(): Promise<RebootRequiredScript> {
  return await getRebootRequiredMemoized();
}
