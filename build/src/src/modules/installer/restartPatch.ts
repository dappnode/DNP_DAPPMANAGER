import fs from "fs";
import path from "path";
import * as getPath from "../../utils/getPath";
import * as validate from "../../utils/validate";
import * as db from "../../db";
import { listContainer, listContainerNoThrow } from "../docker/listContainers";
import shell from "../../utils/shell";
import { pause } from "../../utils/asyncFlows";
import params from "../../params";
import Logs from "../../logs";
import { Compose, InstallPackageData } from "../../common/types";
import { writeComposeObj, readComposeObj } from "../../utils/dockerComposeFile";
import { parseService } from "../../utils/dockerComposeParsers";
import Dockerode from "dockerode";
import { containerInspect, logContainer } from "../docker/dockerApi";
import { dockerRm } from "../docker/dockerCommands";
import { getLogUi } from "../../utils/logUi";
import { rollbackPackages } from "./rollbackPackages";
import { postInstallClean } from "./postInstallClean";
const logs = Logs(module);

const restartId = params.restartDnpName;
const dappmanagerName = params.dappmanagerDnpName;
const restartContainerName = params.restartContainerName;
const restartScriptPath = path.join(params.DNCORE_DIR, "restart-dappnode.sh");

/* eslint-disable @typescript-eslint/camelcase */

/**
 * The DAPPMANAGER is unable to reset itself. When it calls docker-compose up it
 * will first stop the current package which cancels the call and the container
 * stays exited forcing the user to ssh into the server to start the DAppNode again.
 *
 * This package spins a secondary container with the sole purpose of calling
 * docker-compose up on the DAPPMANAGER. Then it will end execution and remain exited
 * The name of the container is DAppNodeTool-restart.dnp.dappnode.eth so it doesn't
 * shows up in the ADMIN UI's package list
 */
export async function restartDappmanagerPatch({
  composePath,
  composeBackupPath,
  restartCommand,
  restartLaunchCommand,
  packagesData
}: {
  composePath: string;
  composeBackupPath?: string;
  restartCommand?: string;
  restartLaunchCommand?: string;
  packagesData?: InstallPackageData[];
}): Promise<void> {
  const dnp = await listContainer(dappmanagerName);
  const imageName = dnp.image;

  const composeRestartPath = getPath.dockerCompose(restartId, true);
  if (!composeBackupPath) composeBackupPath = getPath.backupPath(composePath);

  // Must make sure that there is no restart container running previously
  // If it's still running it will wait for a few seconds before killing it. If it working
  // properly, before the timeout expires the restart patch should kill the DAPPMANAGER;
  // but if something went wrong it will unlock the situation by killing a frozen restart container
  // If it's exited it will be removed beforehand
  try {
    await waitForRestartPatchToFinish({ timeout: 60 * 1000 });
    // Returns null if container is not found, then do nothing
    const restart = await listContainerNoThrow(restartContainerName);
    if (restart && restart.running) await dockerRm(params.restartContainerName);
  } catch (e) {
    // Since removing restart is non-essential, don't block a core update, just log
    logs.error(`Error removing ${restartContainerName}: ${e.stack}`);
  }

  /**
   * Script to run inside the restart container
   * - Up the target DAPPMANAGER compose. Use --force-recreate in case it's a restart
   * - If it fails, up the previous DAPPMANAGER compose. The function calling the
   *   restart patch must copy the previous compose to the backup path.
   * - Records to exit code to exit with it latter in case the original DAPPMANAGER
   *   it is still running, it will be able to capture the error.
   * - If the first docker-compose up fails at the start stage, and the original container
   *   is left renamed to `${shortId}_${name}`. To correct the name, the container is
   *   force recreated.
   */
  const restartScript = `
docker-compose -f ${composePath} up -d --force-recreate
UPEXIT=$?
if [ $UPEXIT -ne 0 ]
then
    echo "${dappmanagerName} up failed, starting backup"
    if [ "$(docker ps -aq -f status=running -f name=${dappmanagerName})" ]
    then
        docker-compose -f ${composeBackupPath} up -d -t 0
    else
        docker-compose -f ${composeBackupPath} up -d -t 0 --force-recreate
    fi
fi
exit $UPEXIT
`;

  fs.writeFileSync(restartScriptPath, restartScript);

  const dappmanagerCompose = readComposeObj(composePath);
  const dappmanagerService = parseService(dappmanagerCompose);
  const composeRestart: Compose = {
    version: "3.4",
    services: {
      [restartId]: {
        image: dappmanagerService.image || imageName,
        container_name: restartContainerName,
        // Using `network_mode: none` to prevent creating a useless
        // network that may conflict with future restart containers (it has happen in Dec 2019)
        network_mode: "none",
        volumes: params.restartDnpVolumes,
        // The entrypoint property in the docker-compose overwrites
        // both the CMD [ ] and ENTRYPOINT [ ] directive in the Dockerfile
        entrypoint: restartCommand || `/bin/sh ${restartScriptPath}`
      }
    }
  };

  validate.path(composeRestartPath);
  writeComposeObj(composeRestartPath, composeRestart);

  try {
    if (packagesData) db.coreUpdatePackagesData.set(packagesData);

    // [NOTE1]: Attach to the restart container so it is a child process of the this command
    // If the restart container cannot recreate the DAPPMANAGER the error will be caught
    // This shell command should only resolve with an error. Otherwise, on success the container
    // will be removed and this process killed.
    //
    // [NOTE2]: Allow to customize the restart launch command with a parameter that comes from
    // the new DAPPMANAGER / CORE manifest, as an extra safety measure
    await shell(
      restartLaunchCommand ||
        `docker-compose -f ${composeRestartPath} up --force-recreate <&-`
    );

    if (packagesData) db.coreUpdatePackagesData.set(null);
  } catch (e) {
    db.coreUpdatePackagesData.set(null);
    throw e;
  }
}

/**
 * Completes a core update migration by making sure all steps are completed
 * - Move .next.yml files to .yml
 * - Up DAPPMANAGER if it's version is equal to the compose
 */
export async function postRestartPatch(): Promise<void> {
  try {
    await waitForRestartPatchToFinish({ timeout: 60 * 1000 });
    const restart = await containerInspect(params.restartContainerName);
    try {
      await logRestartPatchStatus(restart);
    } catch (e) {
      logs.error(`Error reporting restart patch status: ${e.stack}`);
    }

    const packagesData = db.coreUpdatePackagesData.get();
    const log = getLogUi(params.coreDnpName);
    if (!packagesData) {
      // Assuming the dappmanager has been reseted, not updated
      logs.info(`No core update packages data found`);
    } else if (restart.State.ExitCode > 0) {
      // Error during update, needs to rollback
      rollbackPackages(packagesData, log);
    } else {
      // All okay, finish installation
      postInstallClean(packagesData, log);
    }

    // Remove the pending core update packages data
    db.coreUpdatePackagesData.set(null);
    // Remove restart patch container
    await dockerRm(params.restartContainerName);
  } catch (e) {
    if (e.message.includes("No such container")) {
      // Restart container does no exist, the dappmanager has not been restarted
      // by the restartPatch, do nothing
      return;
    } else {
      throw e;
    }
  }
}

/**
 * Report on the status of the restart container
 * Non-essential, so wrap in try catch to not prevent a rollback
 * @param restart
 */
async function logRestartPatchStatus(restart: Dockerode.ContainerInspectInfo) {
  const finishTime = new Date(restart.State.FinishedAt);
  const finishSecAgo = (Date.now() - finishTime.getTime()) / 1000;
  const restartLogs = await logContainer(restartContainerName);
  const restartLogsIndented = restartLogs
    .split("\n")
    .map(line => "\t" + line)
    .join("\n");
  logs.info(`Restart patch status:
  Finished: ${finishTime.toISOString()}, ${finishSecAgo} seconds ago
  ExitCode: ${restart.State.ExitCode}
  Error: ${restart.State.Error}
  Logs: 
${restartLogsIndented}
`);
}

/**
 * Await for the restart patch container to be removed or exited
 */
async function waitForRestartPatchToFinish({
  timeout
}: {
  timeout: number;
}): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const restart = await containerInspect(restartContainerName);
    if (!restart.State.Running) return;
    await pause(2 * 1000);
  }
}

/* eslint-enable @typescript-eslint/camelcase */
