import { HostStatMemory } from "../types";
import { parseMemoryStats } from "../utils/parseMemoryStats";
import shellExec from "../utils/shell";
/**
 * Returns the memory statistics (use, free, shared, etc)
 */
export async function statsMemoryGet(): Promise<HostStatMemory> {
  const mem = await shellExec(`free / --bytes`);
  return parseMemoryStats(mem);
}
