import listContainers from "../modules/listContainers";
import * as getPath from "../utils/getPath";
import params from "../params";
import docker from "../modules/docker";
import { eventBus, eventBusTag } from "../eventBus";
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
}): Promise<RpcHandlerReturn> {
  if (!id) throw Error("kwarg id must be defined");

  const dockerComposePath = getPath.dockerComposeSmart(id, params);

  const dnpList = await listContainers({ byName: id });
  const dnp = dnpList[0];
  if (!dnp) throw Error(`No DNP was found for name ${id}`);

  if (dnp.running) await docker.compose.stop(dockerComposePath, { timeout });
  else await docker.compose.start(dockerComposePath);

  // Emit packages update
  eventBus.emit(eventBusTag.emitPackages);

  return {
    message: `Successfully toggled package: ${id}`,
    logMessage: true,
    userAction: true
  };
}
