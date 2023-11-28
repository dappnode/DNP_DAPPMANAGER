import { runScript } from "../runScripts.js";

/**
 * Get temperature of the cpu
 * Uses a script in bash return a numeric value
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
