import { HostStatDisk } from "../types";
import { toBytes } from "./toBytes";
import osu from "node-os-utils";

/**
 * Parses the 'df /' bash output command
 * @param disk string with disk usage info
 */
export function parseDiskStats(stats: osu.DriveInfo): HostStatDisk {
  return {
    total: toBytes(stats.totalGb, "gb"),
    used: toBytes(stats.usedGb, "gb"),
    free: toBytes(stats.freeGb, "gb"),
    usedPercentage: stats.usedPercentage
  };
}
