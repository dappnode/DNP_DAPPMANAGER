import osu from "node-os-utils";
import { HostStatCpu } from "../types";

/**
 * Returns the cpu use percentage in string
 */
export async function getCPUStats(): Promise<HostStatCpu> {
  const cpuPercentage = await osu.cpu.usage(5000); // 10.38
  return { used: (Math.round(cpuPercentage) + "%").toString() };
}
