import fs from "fs";
import * as getPath from "../../utils/getPath";
import * as validate from "../../utils/validate";
import listContainers from "./listContainers";
import docker from "./dockerCommands";
import params from "../../params";

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

export default async function restartPatch(IMAGE_NAME = ""): Promise<void> {
  if (!IMAGE_NAME.includes(":")) {
    const dnpList = await listContainers();
    const container = dnpList.find(c => (c.name || "").includes(IMAGE_NAME));
    if (container) {
      const version = container.version;
      IMAGE_NAME += ":" + version;
    } else {
      throw Error(`No image found for ${IMAGE_NAME}`);
    }
  }

  const DOCKERCOMPOSE_RESTART_PATH = getPath.dockerCompose(
    "restart.dnp.dappnode.eth",
    params,
    true
  );
  const PATH_LOCAL = "/usr/src/dappnode/DNCORE/docker-compose-dappmanager.yml";
  const PATH_REMOTE = "/usr/src/app/DNCORE/docker-compose-dappmanager.yml";
  const DOCKERCOMPOSE_DATA = `version: '3.4'

services:
    restart.dnp.dappnode.eth:
        image: ${IMAGE_NAME}
        container_name: DAppNodeTool-restart.dnp.dappnode.eth
        volumes:
            - '${PATH_LOCAL}:${PATH_REMOTE}'
            - '/usr/local/bin/docker-compose:/usr/local/bin/docker-compose'
            - '/var/run/docker.sock:/var/run/docker.sock'
        entrypoint:
            docker-compose -f ${PATH_REMOTE} up -d --force-recreate`;

  validate.path(DOCKERCOMPOSE_RESTART_PATH);
  await fs.writeFileSync(DOCKERCOMPOSE_RESTART_PATH, DOCKERCOMPOSE_DATA);
  await docker.compose.up(DOCKERCOMPOSE_RESTART_PATH);
}
