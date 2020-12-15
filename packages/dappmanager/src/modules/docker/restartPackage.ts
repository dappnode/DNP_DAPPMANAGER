import fs from "fs";
import params from "../../params";
import * as getPath from "../../utils/getPath";
import { restartDappmanagerPatch } from "../installer/restartPatch";
import { dockerComposeUp } from "./compose";

/**
 * Calls docker rm and docker up on a package
 *
 * @param id DNP .eth name
 */
export async function restartPackage({
  dnpName,
  serviceNames,
  forceRecreate,
  timeout
}: {
  dnpName: string;
  serviceNames?: string[];
  forceRecreate: boolean;
  timeout?: number;
}): Promise<void> {
  const composePath = getPath.dockerComposeSmart(dnpName);
  if (!fs.existsSync(composePath)) {
    throw Error(`No docker-compose found for ${dnpName} at ${composePath}`);
  }

  if (dnpName === params.dappmanagerDnpName) {
    await restartDappmanagerPatch({ composePath });
  } else {
    // Note: About restartPatch, combining rm && up doesn't prevent the installer from crashing
    await dockerComposeUp(composePath, {
      forceRecreate,
      serviceNames,
      timeout
    });
  }
}
