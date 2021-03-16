import { getHostInfoMemoized } from "../modules/hostScripts/scripts/hostInfo";
import { HostInfoScript, TopicDataItem } from "../common";

/**
 * Returns a list of checks done as a diagnose
 */
export async function diagnose(): Promise<TopicDataItem[]> {
  try {
    const hostInfo: HostInfoScript = await getHostInfoMemoized();
    return parseHostInfo(hostInfo);
  } catch (e) {
    throw Error(`Error collecting host info on collect_host_info.sh: ${e}`);
  }
}

// Utils
function parseHostInfo(hostInfo: HostInfoScript): TopicDataItem[] {
  return Object.entries(hostInfo).map((info: [string, string]) => {
    return {
      name: info[0],
      result: info[1]
    };
  });
}
