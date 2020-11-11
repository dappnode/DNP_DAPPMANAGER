import { HostStatDisk } from "../types";

/**
 * Parses the 'df /' bash output command
 * @param disk string with disk usage info
 */
export function parseDiskStats(dfOutput: string): HostStatDisk {
  const [headers, row] = dfOutput.split("\n");
  const [
    filesystem,
    bBlocks,
    used,
    available,
    usePercentage,
    mountedOn
  ] = row.split(/\s+/);
  return {
    filesystem,
    bBlocks,
    used,
    available,
    usePercentage,
    mountedOn,
    useFraction: parseInt(used) / (parseInt(used) + parseInt(available))
  };
}
