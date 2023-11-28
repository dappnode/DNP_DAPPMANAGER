import { runScript } from "../runScripts.js";

/**
 * Get temperature of the cpu
 * Uses a bash script that return a numeric value
 * If the script fails, throws an Error
 */
export async function getCpuTemperature(): Promise<number> {
  try {
    const sensorsTemp = await runScript("get_cpu_temperature.sh");
    const temperature = parseFloat(sensorsTemp);
    return temperature;
  } catch (e) {
    throw Error("Unable to get CPU Temperature");
  }
}
