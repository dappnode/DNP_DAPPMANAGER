import { runScript } from "../runScripts.js";

export async function ensureIpv4Forward(): Promise<void> {
  await runScript("ensure_ipv4_forward.sh");
}
