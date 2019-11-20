import fs from "fs";
import * as getPath from "../../utils/getPath";
import * as validate from "../../utils/validate";
import { listContainer } from "./listContainers";
import { dockerComposeUp } from "./dockerCommands";

export const restartId = "restart.dnp.dappnode.eth";
const dappmanagerName = "dappmanager.dnp.dappnode.eth";

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

export default async function restartPatch(imageName = ""): Promise<void> {
  if (!imageName.includes(":")) {
    const dnp = await listContainer(dappmanagerName);
    imageName = dnp.image;
  }

  const DOCKERCOMPOSE_RESTART_PATH = getPath.dockerCompose(restartId, true);
  const PATH_LOCAL = "/usr/src/dappnode/DNCORE/docker-compose-dappmanager.yml";
  const PATH_REMOTE = "/usr/src/app/DNCORE/docker-compose-dappmanager.yml";
  const DOCKERCOMPOSE_DATA = `version: '3.4'

services:
    ${restartId}:
        image: ${imageName}
        container_name: DAppNodeTool-${restartId}
        volumes:
            - '${PATH_LOCAL}:${PATH_REMOTE}'
            - '/usr/local/bin/docker-compose:/usr/local/bin/docker-compose'
            - '/var/run/docker.sock:/var/run/docker.sock'
        entrypoint:
            docker-compose -f ${PATH_REMOTE} up -d --force-recreate`;

  validate.path(DOCKERCOMPOSE_RESTART_PATH);
  await fs.writeFileSync(DOCKERCOMPOSE_RESTART_PATH, DOCKERCOMPOSE_DATA);
  await dockerComposeUp(DOCKERCOMPOSE_RESTART_PATH);
}
