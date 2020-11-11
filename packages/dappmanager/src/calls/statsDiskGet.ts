import { HostStatDisk } from "../types";
import { parseDiskStats } from "../utils/parseDiskStats";
import shellExec from "../utils/shell";
/**
 * Returns the disk statistics (used, available, etc)
 */
export async function statsDiskGet(): Promise<HostStatDisk> {
  const disk = await shellExec(`df / --block-size=1`);
  return parseDiskStats(disk);
}
