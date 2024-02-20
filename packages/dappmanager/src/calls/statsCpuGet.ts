import { HostStatCpu } from "@dappnode/types";
import si from "systeminformation";

/**
 * Returns the cpu use percentage in string
 */
export async function statsCpuGet(): Promise<HostStatCpu> {
  const cpuLoad = await si.currentLoad();
  const cpuTemperature = await si.cpuTemperature();
  return {
    numberOfCores: cpuLoad.cpus.length,
    usedPercentage: cpuLoad.currentLoad,
    temperatureAverage: cpuTemperature.main
  };
}
