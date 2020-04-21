import fs from "fs";
import path from "path";
import * as getPath from "../../utils/getPath";
import * as validate from "../../utils/validate";
import { listContainer, listContainerNoThrow } from "./listContainers";
import shell from "../../utils/shell";
import { pause } from "../../utils/asyncFlows";
import params from "../../params";
import Logs from "../../logs";
const logs = Logs(module);

const restartId = params.restartDnpName;
const dappmanagerName = params.dappmanagerDnpName;
const restartContainerName = params.restartContainerName;

/**
 * The DAPPMANAGER is unable to reset itself. When it calls docker-compose up it
 * will first stop the current package which cancels the call and the container
 * stays exited forcing the user to ssh into the server to regain control of
 * her/his DAppNode.
 *
 * This package spins a secondary container with the sole purpose of calling
 * docker-compose up on the DAPPMANAGER. Then it will end execution and remain exited
 * The name of the container is DAppNodeTool-restart.dnp.dappnode.eth so it doesn't
 * shows up in the ADMIN UI's package list
 */

export default async function restartDappmanagerPatch(): Promise<void> {
  const dnp = await listContainer(dappmanagerName);
  const imageName = dnp.image;

  const composeRestartPath = getPath.dockerCompose(restartId, true);
  const composePathFromDncore = getPath.dockerCompose(dappmanagerName, true);
  const pathRemote = path.resolve(composePathFromDncore);
  // NOTE: pathLocal MUST be an ABSOLUTE path or docker-compose will consider it
  // a named volume and error
  const pathLocal = path.join(params.HOST_HOME, composePathFromDncore);

  /**
   * [NOTE1]: The entrypoint property in the docker-compose overwrites
   * both the CMD [ ] and ENTRYPOINT [ ] directive in the Dockerfile
   *
   * [NOTE2]: Using `network_mode: none` to prevent creating a useless
   * network that may conflict with future restart containers (it has happen in Dec 2019)
   *
   * [NOTE3]: Must make sure that there is no restart container running previously
   * If it's still running it will wait for a few seconds before killing it. If it working
   * properly, before the timeout expires the restart patch should kill the DAPPMANAGER;
   * but if something went wrong it will unlock the situation by killing a frozen restart container
   * If it's exited it will be removed beforehand
   */

  // Returns null if container is not found, then do nothing
  const restartContainer = await listContainerNoThrow(restartContainerName);
  if (restartContainer) {
    if (restartContainer.running) await pause(15 * 1000);
    try {
      await shell(`docker rm -f ${restartContainerName}`);
    } catch (e) {
      // Since removing restart is non-essential, don't block a core update, just log
      logs.error(`Error removing ${restartContainerName}: ${e.stack}`);
    }
  }

  // NOTE: pathLocal MUST be an ABSOLUTE path or docker-compose will consider it
  // a named volume and error
  const composeData = `version: '3.4'
services:
  ${restartId}:
    image: ${imageName}
    container_name: ${restartContainerName}
    volumes:
      - '${pathLocal}:${pathRemote}'
      - '/usr/local/bin/docker-compose:/usr/local/bin/docker-compose'
      - '/var/run/docker.sock:/var/run/docker.sock'
    entrypoint: docker-compose -f ${pathRemote} up -d --force-recreate
    network_mode: none
`;

  validate.path(composeRestartPath);
  fs.writeFileSync(composeRestartPath, composeData);
  await shell(`docker-compose -f ${composeRestartPath} up -d <&-`);
}
