import { HostStatDisk } from "../types";
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
  const [, blocks, Used, Available] = lines[1].trim().split(/\s+/);

  const total = parseInt(blocks, 10);
  const used = parseInt(Used, 10);
  const free = parseInt(Available, 10);
  const usedPercentage = Math.round(100 * (1 - free / total));

  return { total, used, free, usedPercentage };
}
