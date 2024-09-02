import { CoreUpdateData } from "@dappnode/types";
import { getCoreUpdateData } from "@dappnode/daemons";
import { dappnodeInstaller } from "../index.js";

/**
 * Fetches the core update data, if available
 */
export async function fetchCoreUpdateData({ version }: { version?: string }): Promise<CoreUpdateData> {
  return await getCoreUpdateData(dappnodeInstaller, version);
}
