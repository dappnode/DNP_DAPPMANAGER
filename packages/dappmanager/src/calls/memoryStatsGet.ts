import { HostStatMemory } from "../types";
import shellExec from "../utils/shell";
/**
 * Returns the memory statistics (use, free, shared, etc)
 */
export async function getMemoryStats(): Promise<HostStatMemory> {
  const mem = await shellExec(`free / --bytes`);
  return parseMemoryStats(mem);
}

/**
 * Parses the 'free /' bash output command
 * @param mem string with memory usage info
 */
function parseMemoryStats(memory: string): HostStatMemory {
  const arr = memory.replace(/\n/g, " ").split(/\s+/);
  const memArgs = arr.slice(7, 13);
  const swapArgs = arr.slice(14, 17);
  return {
    memTotal: memArgs[0],
    memUsed: memArgs[1],
    free: memArgs[2],
    shared: memArgs[3],
    buffCache: memArgs[4],
    available: memArgs[5],
    swapTotal: swapArgs[0],
    swapUsed: swapArgs[1],
    swapFree: swapArgs[2],
    usePercentage: (
      (parseInt(swapArgs[1]) * 100) /
      parseInt(memArgs[0])
    ).toString()
  };
}
