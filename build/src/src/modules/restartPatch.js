const fs = require("fs");
const getPath = require("utils/getPath");
const validate = require("utils/validate");
const dockerList = require("modules/dockerList");
const docker = require("modules/docker");
const params = require("params");

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

async function restartPatch(imageName = "", { restartVolumes = false } = {}) {
  if (!imageName.includes(":")) {
    let dnpList = await dockerList.listContainers();
    let container = dnpList.find(c => (c.name || "").includes(imageName));
    let version = container.version;
    imageName += ":" + version;
  }

  // Generate the docker-compose
  const pathLocal = "/usr/src/dappnode/DNCORE/docker-compose-dappmanager.yml";
  const pathRemote = "/usr/src/app/DNCORE/docker-compose-dappmanager.yml";
  const command = restartVolumes
    ? `docker-compose -f ${pathRemote} down --volumes; docker-compose -f ${pathRemote} up -d`
    : `docker-compose -f ${pathRemote} up -d`;
  const dockerComposeRestartData = `version: '3.4'

services:
    restart.dnp.dappnode.eth:
        image: ${imageName}
        container_name: DAppNodeTool-restart.dnp.dappnode.eth
        volumes:
            - '${pathLocal}:${pathRemote}'
            - '/usr/local/bin/docker-compose:/usr/local/bin/docker-compose'
            - '/var/run/docker.sock:/var/run/docker.sock'
        entrypoint:
            ${command}`;

  // Write the docker-compose
  const dockerComposeRestartPath = getPath.dockerCompose(
    "restart.dnp.dappnode.eth",
    params,
    true
  );

  validate.path(dockerComposeRestartPath);
  fs.writeFileSync(dockerComposeRestartPath, dockerComposeRestartData);
  await docker.compose.up(dockerComposeRestartPath);
}

module.exports = restartPatch;
