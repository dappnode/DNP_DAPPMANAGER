import { HostStatDisk } from "../types";
import { parseDiskStats } from "../utils/parseDiskStats";
import osu from "node-os-utils";
/**
 * Returns the disk statistics (used, available, etc)
 */
export async function statsDiskGet(): Promise<HostStatDisk> {
  const stats = await osu.drive.info("/");
  return parseDiskStats(stats);
}
