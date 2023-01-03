import { getHostInfoMemoized } from "../modules/hostScripts/scripts/hostInfo";
import { HostDiagnoseItem } from "@dappnode/common";

/**
 * Returns a list of checks done as a diagnose
 */
export async function diagnose(): Promise<HostDiagnoseItem[]> {
  try {
    const hostInfo = await getHostInfoMemoized();
    return Object.entries(hostInfo).map(([name, data]) => ({ name, data }));
  } catch (e) {
    e = `Error collecting host info: ${e.message}`;
    throw e;
  }
}
