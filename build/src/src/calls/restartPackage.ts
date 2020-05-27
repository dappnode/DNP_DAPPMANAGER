import fs from "fs";
import params from "../params";
import * as getPath from "../utils/getPath";
import { restartDappmanagerPatch } from "../modules/docker/restartPatch";
import { dockerComposeRm } from "../modules/docker/dockerCommands";
import { dockerComposeUpSafe } from "../modules/docker/dockerSafe";
import * as eventBus from "../eventBus";

/**
 * Calls docker rm and docker up on a package
 *
 * @param {string} id DNP .eth name
 */
export async function restartPackage({ id }: { id: string }): Promise<void> {
  if (!id) throw Error("kwarg id must be defined");

  const composePath = getPath.dockerComposeSmart(id);
  if (!fs.existsSync(composePath)) {
    throw Error(`No docker-compose found: ${composePath}`);
  }

  if (id.includes(params.dappmanagerDnpName)) {
    await restartDappmanagerPatch({ composePath });
  } else {
    // Combining rm && up doesn't prevent the installer from crashing
    await dockerComposeRm(composePath);
    await dockerComposeUpSafe(composePath);

    // Emit packages update
    eventBus.requestPackages.emit();
    eventBus.packagesModified.emit({ ids: [id] });
  }
}
