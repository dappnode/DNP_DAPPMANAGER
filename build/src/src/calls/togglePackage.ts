import { listContainer } from "../modules/docker/listContainers";
import * as getPath from "../utils/getPath";
import {
  dockerComposeStart,
  dockerComposeStop
} from "../modules/docker/dockerCommands";
import * as eventBus from "../eventBus";
import { RpcHandlerReturn } from "../types";

/**
 * Stops or starts after fetching its status
 *
 * @param {string} id DNP .eth name
 * @param {number} timeout seconds to stop the package
 */
export default async function togglePackage({
  id,
  timeout = 10
}: {
  id: string;
  timeout?: number;
}): RpcHandlerReturn {
  if (!id) throw Error("kwarg id must be defined");

  const dockerComposePath = getPath.dockerComposeSmart(id);

  const dnp = await listContainer(id);

  if (dnp.running) await dockerComposeStop(dockerComposePath, { timeout });
  else await dockerComposeStart(dockerComposePath);

  // Emit packages update
  eventBus.requestPackages.emit();

  return {
    message: `Successfully toggled package: ${id}`,
    logMessage: true,
    userAction: true
  };
}
