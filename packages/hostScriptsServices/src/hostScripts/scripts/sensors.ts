import { runScript } from "../runScripts.js";

/**
 * Updates and upgrades the host machine
 */
export async function sensors(): Promise<string> {
  return await runScript("sensors.sh");
}
