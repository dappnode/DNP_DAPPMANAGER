import { HostStatMemory } from "../types";

/**
 * Parses the 'free /' bash output command
 * @param mem string with memory usage info
 */
export function parseMemoryStats(freeOutput: string): HostStatMemory {
  const [headers, row1, row2] = freeOutput.split("\n");
  const [
    memoryTitle,
    memTotal,
    memUsed,
    free,
    shared,
    buffCache,
    available
  ] = row1.trim().split(/\s+/);

  const [swapTitle, swapTotal, swapUsed, swapFree] = row2.trim().split(/\s+/);

  return {
    memTotal,
    memUsed,
    free,
    shared,
    buffCache,
    available,
    swapTotal,
    swapUsed,
    swapFree,
    useFraction: parseInt(swapUsed) / parseInt(memTotal)
  };
}
