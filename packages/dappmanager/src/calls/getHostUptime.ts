import { shellHost } from "@dappnode/utils";
import { logs } from "@dappnode/logger";
import memoize from "memoizee";

/**
 * Returns uptime of the host
 */
export async function getHostUptime(): Promise<string> {
  return await getHostUptimeMemo();
}

async function _getHostUptime(): Promise<string> {
  try {
    const output = await shellHost("uptime -- -p");
    return output;
  } catch (error) {
    error.message += `Unable to retrieve the uptime from te host machine: ${error.message}`;
    logs.error(error.message);
    throw error;
  }
}

const getHostUptimeMemo = memoize(_getHostUptime, {
  promise: true,
  maxAge: 60 * 1000 * 5 // 5 minutes
});
