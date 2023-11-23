import { runScript } from "../runScripts.js";
import { Sensors } from "@dappnode/common";

/**
 * Get temperature of the cpu cores
 * Use the command "sensors"
 */
export async function sensors(): Promise<Sensors> {
    const sensorsTemp = await runScript("sensors.sh");
    const sensor = {
        temp1_input: parseFloat(sensorsTemp),
        temp1_max: 100, 
        temp1_min: 0 
      };
      return sensor;
}