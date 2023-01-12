import osu from "node-os-utils";
import { HostStatCpu } from "@dappnode/common";

/**
 * Returns the cpu use percentage in string
 */
export async function statsCpuGet(): Promise<HostStatCpu> {
  return {
    usedPercentage: await osu.cpu.usage()
  };
}
