import { runScript } from "../runScripts.js";

/**
 * Set a static IP address of the host machine
 */
export async function setStaticIP(IpAddress: string): Promise<void> {
  await runScript("set_static_local_ip.sh", IpAddress);
}
