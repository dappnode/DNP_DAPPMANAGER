import { RequestData } from "../route-types/volumeRemove";
import { dockerVolumeRm } from "../modules/docker/dockerCommands";
import * as eventBus from "../eventBus";
import { RpcHandlerReturn } from "../types";

/**
 * Stops or starts after fetching its status
 *
 * @param {string} id DNP .eth name
 * @param {number} timeout seconds to stop the package
 */
export default async function volumeRemove({
  name
}: RequestData): RpcHandlerReturn {
  if (!name) throw Error("kwarg name must be defined");

  await dockerVolumeRm(name);

  // Emit packages update
  eventBus.requestPackages.emit();

  return {
    message: `Successfully removed volume: ${name}`,
    logMessage: true,
    userAction: true
  };
}
