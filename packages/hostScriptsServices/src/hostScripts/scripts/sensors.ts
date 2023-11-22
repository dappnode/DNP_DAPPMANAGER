import { runScript } from "../runScripts.js";
import { Sensors } from "@dappnode/common";

/**
 * Get temperature of the cpu cores
 * Use the command "sensors"
 */
export async function sensors(): Promise<Sensors> {
    const sensorsInfo = await runScript("sensors.sh");
    const parsedInfo: Sensors = JSON.parse(sensorsInfo);
    return parsedInfo;
}