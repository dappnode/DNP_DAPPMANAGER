import { dockerContainerInspect } from "@dappnode/dockerapi";
import { params } from "@dappnode/params";

/**
 * Returns a string list with the aliases from the container provided
 */
export async function getContainerAliases(containerId: string): Promise<any> {
  const inspectOutput = await dockerContainerInspect(containerId);
  const aliases =
    inspectOutput.NetworkSettings.Networks["dncore_network"].Aliases;
  return aliases;
}
