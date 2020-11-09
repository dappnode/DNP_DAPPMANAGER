import { HostStatDisk } from "../types";
import shellParse from "shell-quote";
import shellExec from "../utils/shell";
/**
 * Returns the disk statistics (used, available, etc)
 */
export async function getDiskStats(): Promise<HostStatDisk> {
  const disk = await shellExec(`df / --block-size=1`); // bytes format
  return parseDiskStats(disk);
}

/**
 * Parses the 'df /' bash output command
 * @param disk string with disk usage info
 */
function parseDiskStats(disk: string): HostStatDisk {
  const parsedDisk = shellParse.parse(disk);
  return {
    filesystem: parsedDisk[7].toString(),
    kblocks: parsedDisk[8].toString(),
    used: parsedDisk[9].toString(),
    available: parsedDisk[10].toString(),
    usepercentage: parsedDisk[11].toString() + "%",
    mountedon: parsedDisk[12].toString()
  };
}
