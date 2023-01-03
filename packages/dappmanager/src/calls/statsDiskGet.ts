import { HostStatDisk } from "@dappnode/common";
import shell from "../utils/shell";

/**
 * Returns the disk statistics (used, available, etc)
 */
export async function statsDiskGet(): Promise<HostStatDisk> {
  const dfPB1Output = await shell("df -PB1 /");
  return parseDfPB1Output(dfPB1Output);
}

/**
 * Parse the output of `df -PB1 /`
 */
export function parseDfPB1Output(output: string): HostStatDisk {
  const lines = output.trim().split(/\r?\n/);
  if (lines.length < 2) throw Error(`Unexpected df format: ${output}`);

  // Filesystem           1-blocks       Used Available Capacity Mounted on
  // overlay              420695474176 97052733440 302201196544  24% /
  const [, blocks, , Available] = lines[1].trim().split(/\s+/);

  // In DAPPMANAGER the total disk usage does not match
  // Used + Available != Blocks
  //
  // Instead there is some disk space reserved for something
  // therefore if we display Used / Total (%Used) it will look like this
  // 370.62 GB / 391.8 GB (100%)
  //
  // To make things easier to understand, we display Used = Total - Avail
  // so that Used + Avail = Total, and thinks look logical in the UI...

  const total = parseInt(blocks, 10);
  const free = parseInt(Available, 10);
  const used = total - free;
  const usedPercentage = Math.round(100 * (used / total));

  return { total, used, free, usedPercentage };
}
