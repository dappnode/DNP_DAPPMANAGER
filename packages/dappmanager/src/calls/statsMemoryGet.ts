import { HostStatMemory } from "@dappnode/types";
import osu from "node-os-utils";

/**
 * Returns the memory statistics (use, free, shared, etc)
 */
export async function statsMemoryGet(): Promise<HostStatMemory> {
  const stats = await osu.mem.info();
  return parseMemoryStats(stats);
}

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

/**
 * Function reuturns bytes. Accepts mb, kb and gb
 */
function toBytes(amount: number, unit: "kb" | "mb" | "gb"): number {
  switch (unit) {
    case "kb":
      return Math.round(amount * Math.pow(1024, 1));
    case "mb":
      return Math.round(amount * Math.pow(1024, 2));
    case "gb":
      return Math.round(amount * Math.pow(1024, 3));
  }
}
