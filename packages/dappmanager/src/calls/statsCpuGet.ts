import osu from "node-os-utils";
import { HostStatCpu } from "../types";

/**
 * Returns the cpu use percentage in string
 */
export async function statsCpuGet(): Promise<HostStatCpu> {
  const cpuPercentage = await osu.cpu.usage(5000);
  return { used: (Math.round(cpuPercentage) + "%").toString() };
}
