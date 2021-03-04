import { DockerScriptOptions } from "../common";
import { dockerUpdate } from "../modules/hostScripts";

/**
 * option engine:
 *  --version: returns docker version
 *  --install: updates docker
 * options compose:
 *  --version: returns docker compose version
 *  --install: updates docker compose
 */
export async function updateDocker({
  updateOption
}: {
  updateOption: DockerScriptOptions;
}): Promise<string> {
  try {
    return await dockerUpdate(updateOption);
  } catch (e) {
    throw Error(`Error ${e.code}: ${e.stdout}`);
  }
}
