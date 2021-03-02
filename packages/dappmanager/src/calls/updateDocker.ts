import { dockerUpdate } from "../modules/hostScripts";
import { DockerScriptOptions } from "../types";

/**
 * Updates docker: engine or compose
 */
export async function updateDocker({
  updateOption
}: {
  updateOption: DockerScriptOptions;
}): Promise<string> {
  return await dockerUpdate(updateOption);
}
