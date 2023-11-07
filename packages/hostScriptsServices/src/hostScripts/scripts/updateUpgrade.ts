import { runScript } from "../runScripts.js";

/**
 * Updates and upgrades the host machine
 */
export async function updateUpgrade(): Promise<string> {
  return await runScript("update_upgrade.sh");
}
