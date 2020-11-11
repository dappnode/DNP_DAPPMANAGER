import osu from "node-os-utils";
import { HostStatCpu } from "../types";

/**
 * Returns the cpu use percentage in string
 */
export async function statsCpuGet(): Promise<HostStatCpu> {
  const cpuPercentage = await osu.cpu.usage(5000);
  return { usedFraction: Math.round(cpuPercentage) / 100 };
}
