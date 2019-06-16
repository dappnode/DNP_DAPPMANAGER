const path = require("path");
const fs = require("fs");
const composeUp = require("./composeUp");
const getImage = require("./getImage");

/**
 * Constants
 */

// Restart tool
const idRestart = "restart.dnp.dappnode.eth";
const composeNameRestart = "docker-compose-restart.yml";
// DAPPMANAGER
const composeName = "docker-compose-dappmanager.yml";
const composePathLocal = path.join("/usr/src/dappnode/DNCORE", composeName);
const composePathRemote = path.join("/usr/src/app/DNCORE", composeName);
const restartComposePath = path.join(
  "/usr/src/dappnode/DNCORE",
  composeNameRestart
);

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
 *
 * @returns {object} success info
 */
async function dappmanagerRestartPatch() {
  const dappmanagerImage = await getImage("dappmanager.dnp.dappnode.eth");
  const composeData = `version: '3.4'
services:
  restart.dnp.dappnode.eth:
    image: ${dappmanagerImage.Id}
      container_name: DAppNodeTool-restart.dnp.dappnode.eth
      volumes:
        - '${composePathLocal}:${composePathRemote}'
        - '/usr/local/bin/docker-compose:/usr/local/bin/docker-compose'
        - '/var/run/docker.sock:/var/run/docker.sock'
      entrypoint:
        docker-compose -f ${composePathRemote} up -d --force-recreate`;

  await fs.writeFileSync(restartComposePath, composeData);
  await composeUp(idRestart);
}

module.exports = dappmanagerRestartPatch;
