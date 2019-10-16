import { Compose } from "../../types";
import { writeComposeObj } from "../../utils/dockerComposeFile";
import { dockerComposeConfig } from "../docker/dockerCommands";

/**
 * Write the new compose and test it with config
 * `docker-compose config` will ONLY catch syntactic errors,
 * Stuff like port collisions or environment: - "" will NOT be reported
 *
 * #### TODO / IDEA: Up the compose replacing the image with a busybox
 * just try the package is able to start.
 */
export default async function writeAndValidateCompose(
  composePath: string,
  compose: Compose
): Promise<void> {
  writeComposeObj(composePath, compose);
  await dockerComposeConfig(composePath);
}
