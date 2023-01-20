import { HostStatMemory } from "@dappnode/common";
import { toBytes } from "./toBytes.js";
import osu from "node-os-utils";

/**
 * Parses the 'free /' bash output command
 * @param mem string with memory usage info
 */
export function parseMemoryStats(stats: osu.MemInfo): HostStatMemory {
  return {
    total: toBytes(stats.totalMemMb, "mb"),
    used: toBytes(stats.usedMemMb, "mb"),
    free: toBytes(stats.freeMemMb, "mb"),
    usedPercentage: 100 - stats.freeMemPercentage
  };
}
