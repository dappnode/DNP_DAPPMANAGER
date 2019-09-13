import fs from "fs";
import * as getPath from "../utils/getPath";
import restartPatch from "../modules/docker/restartPatch";
import { dockerComposeRm } from "../modules/docker/dockerCommands";
import { dockerComposeUpSafe } from "../modules/docker/dockerSafe";
import * as eventBus from "../eventBus";
import { RpcHandlerReturn } from "../types";

/**
 * Calls docker rm and docker up on a package
 *
 * @param {string} id DNP .eth name
 */
export default async function restartPackage({
  id
}: {
  id: string;
}): Promise<RpcHandlerReturn> {
  if (!id) throw Error("kwarg id must be defined");

  const dockerComposePath = getPath.dockerComposeSmart(id);
  if (!fs.existsSync(dockerComposePath)) {
    throw Error(`No docker-compose found: ${dockerComposePath}`);
  }

  if (id.includes("dappmanager.dnp.dappnode.eth")) {
    await restartPatch(id);
  } else {
    // Combining rm && up doesn't prevent the installer from crashing
    await dockerComposeRm(dockerComposePath);
    await dockerComposeUpSafe(dockerComposePath);

    // Emit packages update
    eventBus.requestPackages.emit();
  }

  return {
    message: `Restarted package: ${id}`,
    logMessage: true,
    userAction: true
  };
}
