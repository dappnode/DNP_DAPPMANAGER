import { HostStatMemory } from "../types";
import { toBytes } from "./toBytes";
import osu from "node-os-utils";

/**
 * Parses the 'free /' bash output command
 * @param mem string with memory usage info
 */
export function parseMemoryStats(stats: osu.MemInfo): HostStatMemory {
  const memoryStats = Object.values(stats).map(item => toBytes(item, "mb"));

  return {
    total: memoryStats[0],
    used: memoryStats[1],
    free: memoryStats[2],
    freePercentage: stats.freeMemPercentage
  };
}
