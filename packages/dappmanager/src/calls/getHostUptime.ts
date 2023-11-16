import { shellHost, shell } from "@dappnode/utils";

/**
 * Returns the uptime of the host
 */
export async function getHostUptime(): Promise<string> {
  try {
    const output = await shellHost("uptime -- -p"); // 11:28:51 up 8 days, 23:46,  0 users,  load average: 2.20, 2.05, 2.13
    return output;
  } catch (e) {
    console.log("Error getting host uptime");
    throw e;
  }
}
