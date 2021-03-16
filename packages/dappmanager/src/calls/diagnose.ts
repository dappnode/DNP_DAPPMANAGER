import { getHostInfoMemoized } from "../modules/hostScripts/scripts/hostInfo";
import { HostInfoScript, HostInfoTopic } from "../common";

/**
 * Returns a list of checks done as a diagnose
 */
export async function diagnose(): Promise<HostInfoTopic[]> {
  try {
    const hostInfo: HostInfoScript = await getHostInfoMemoized();
    return parseHostInfo(hostInfo);
  } catch (e) {
    throw Error(`Error collecting host info: ${e}`);
  }
}

// Utils
function parseHostInfo(hostInfo: HostInfoScript): HostInfoTopic[] {
  return Object.entries(hostInfo).map((info: [string, string]) => {
    return {
      name: info[0],
      result: info[1]
    };
  });
}
