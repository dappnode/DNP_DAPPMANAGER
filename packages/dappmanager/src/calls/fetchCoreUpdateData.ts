import { CoreUpdateData } from "@dappnode/common";
import { getCoreUpdateData } from "@dappnode/daemons";

/**
 * Fetches the core update data, if available
 */
export async function fetchCoreUpdateData({
  version
}: {
  version?: string;
}): Promise<CoreUpdateData> {
  return await getCoreUpdateData(version);
}
