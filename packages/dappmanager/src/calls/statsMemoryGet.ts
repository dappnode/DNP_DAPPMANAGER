import { HostStatMemory } from "@dappnode/types";
import si from "systeminformation";

/**
 * Returns the memory statistics (use, free, shared, etc)
 */
export async function statsMemoryGet(): Promise<HostStatMemory> {
  const memData = await si.mem();
  return parseMemoryStats(memData);
}

/**
 * Parses memory statistics
 * @param memData Memory data from systeminformation
 */
export function parseMemoryStats(
  memData: si.Systeminformation.MemData
): HostStatMemory {
  return {
    total: memData.total,
    used: memData.active, // Using 'active' as it's closer to 'used' in most contexts
    free: memData.free,
    usedPercentage: (memData.active / memData.total) * 100
  };
}
