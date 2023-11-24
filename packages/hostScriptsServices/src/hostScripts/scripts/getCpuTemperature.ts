import { runScript } from "../runScripts.js";

/**
 * Get temperature of the cpu cores
 * Use the command "sensors"
 */
export async function getCpuTemperature(): Promise<number> {
  const sensorsTemp = await runScript("getCpuTemperature.sh");
  const temperature = parseFloat(sensorsTemp);
  if(isNaN(temperature)){
    throw Error("Unable to get CPU Temperature");
  }
  return temperature;
}
