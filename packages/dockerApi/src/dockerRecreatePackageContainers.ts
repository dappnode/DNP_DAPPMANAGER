import fs from "fs";
import { getDockerComposePathSmart } from "@dappnode/utils";
import { dockerComposeDown, dockerComposeUp } from "./compose/cli.js";

/**
 * Recreates the containers of a package. They are stopped and removed, then created again.
 *
 * The package containers will be shown as stopped after this operation.
 *
 * @param dnpName
 */
export async function dockerRecreatePackageContainers(dnpName: string): Promise<void> {
  const composePath = getDockerComposePathSmart(dnpName);

  if (!fs.existsSync(composePath)) {
    throw Error(`No docker-compose found for ${dnpName} at ${composePath}`);
  }

  await dockerComposeDown(composePath);

  await dockerComposeUp(composePath, { noStart: true });
}
