import { HostStatMemory } from "@dappnode/common";
import { parseMemoryStats } from "../utils/parseMemoryStats";
import osu from "node-os-utils";

/**
 * Returns the memory statistics (use, free, shared, etc)
 */
export async function statsMemoryGet(): Promise<HostStatMemory> {
  const stats = await osu.mem.info();
  return parseMemoryStats(stats);
}
