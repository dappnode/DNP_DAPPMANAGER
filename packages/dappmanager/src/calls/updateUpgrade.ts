import { checkDockerNetwork } from "@dappnode/hostscriptsservices";

/**
 * Updates and upgrades the host machine
 */
export async function updateUpgrade(): Promise<string> {
  return await checkDockerNetwork();
}
