import fs from "fs";
import params from "../../params";
import * as getPath from "../../utils/getPath";
import { restartDappmanagerPatch } from "../installer/restartPatch";
import { dockerComposeRm } from "./dockerCommands";
import { dockerComposeUpSafe } from "./dockerSafe";

/**
 * Calls docker rm and docker up on a package
 *
 * @param {string} id DNP .eth name
 */
export async function restartPackage(id: string): Promise<void> {
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
  }
}
