import { HostStatDisk } from "../types";
import { toBytes } from "./toBytes";
import osu from "node-os-utils";

/**
 * Parses the 'df /' bash output command
 * @param disk string with disk usage info
 */
export function parseDiskStats(stats: osu.DriveInfo): HostStatDisk {
  const diskStats = Object.values(stats).map(item => toBytes(item, "gb"));

  return {
    total: diskStats[0],
    used: diskStats[1],
    free: diskStats[2],
    usedPercentage: stats.usedPercentage,
    freePercentage: stats.freePercentage
  };
}
