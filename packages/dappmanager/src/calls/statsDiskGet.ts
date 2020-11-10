import { HostStatDisk } from "../types";
import shellExec from "../utils/shell";
/**
 * Returns the disk statistics (used, available, etc)
 */
export async function statsDiskGet(): Promise<HostStatDisk> {
  const disk = await shellExec(`df / --block-size=1`);
  return parseDiskStats(disk);
}

/**
 * Parses the 'df /' bash output command
 * @param disk string with disk usage info
 */
function parseDiskStats(disk: string): HostStatDisk {
  const arr = disk.replace(/\n/g, " ").split(/\s+/);
  return {
    filesystem: arr[7],
    bBlocks: arr[8],
    used: arr[9],
    available: arr[10],
    usePercentage: arr[11],
    mountedOn: arr[12]
  };
}
