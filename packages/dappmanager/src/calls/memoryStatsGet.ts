import { HostStatMemory } from "../types";
import shellParse from "shell-quote";
import shellExec from "../utils/shell";
/**
 * Returns the memory statistics (use, free, shared, etc)
 */
export async function getMemoryStats(): Promise<HostStatMemory> {
  const mem = await shellExec(`free / --bytes`); // bytes format
  return parseMemoryStats(mem);
}

/**
 * Parses the 'free /' bash output command
 * @param mem string with memory usage info
 */
function parseMemoryStats(mem: string): HostStatMemory {
  const parsedMemory = shellParse.parse(mem);
  return {
    memTotal: parsedMemory[7].toString(),
    memUsed: parsedMemory[8].toString(),
    free: parsedMemory[9].toString(),
    shared: parsedMemory[10].toString(),
    buffCache: parsedMemory[11].toString(),
    available: parsedMemory[12].toString(),
    usepercentage: (
      (parseInt(parsedMemory[15].toString()) /
        parseInt(parsedMemory[7].toString())) *
      100
    ).toString()
  };
}
