import { docker } from "./docker.js";

/**
 * Get docker version
 *
 */
export async function getDockerVersion(): Promise<string> {
  const dockerVersion = await docker.version();
  return dockerVersion.Version;
}
