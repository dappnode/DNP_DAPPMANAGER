import fs from "fs";
import semver from "semver";
import params from "../../params";
import * as db from "../../db";
import { listContainerNoThrow } from "../docker/listContainers";
import { containerInspect, logContainer } from "../docker/dockerApi";
import { restartDappmanagerPatch } from "../docker/restartPatch";
import { pause } from "../../utils/asyncFlows";
import * as getPath from "../../utils/getPath";
import { readComposeObj } from "../../utils/dockerComposeFile";
import { parseService } from "../../utils/dockerComposeParsers";
import Dockerode from "dockerode";
import Logs from "../../logs";
import { dockerRm } from "../docker/dockerCommands";
import { rollbackPackages, postInstallClean } from "../../calls/installPackage";
import { InstallPackageData } from "../../common/types";
import { getLogUi } from "../../utils/logUi";
const logs = Logs(module);

const maxRestartContainerWait = 60 * 1000;
const waitBetweenRestarts = 5 * 60 * 1000;

/**
 * Completes a core update migration by making sure all steps are completed
 * - Move .next.yml files to .yml
 * - Up DAPPMANAGER if it's version is equal to the compose
 */
export async function postCoreUpdate(): Promise<void> {
  try {
    await waitForRestartPatchToFinish();
    const restart = await containerInspect(params.restartContainerName);
    await logRestartPatchStatus(restart);

    const log = getLogUi(params.coreDnpName);
    const packagesData = db.coreUpdatePackagesData.get();
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

export function isCoreUpdate(packagesData: InstallPackageData[]): boolean {
  return packagesData.some(({ name }) => name === params.dappmanagerDnpName);
}

/**
 * Report on the status of the restart container
 * Non-essential, so wrap in try catch to not prevent a rollback
 * @param restart
 */
async function logRestartPatchStatus(restart: Dockerode.ContainerInspectInfo) {
  try {
    const finishTime = new Date(restart.State.FinishedAt);
    const finishSecAgo = (Date.now() - finishTime.getTime()) / 1000;
    const restartLogs = await logContainer(params.restartContainerName);
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
  } catch (e) {
    logs.error(`Error reporting restart patch status: ${e.stack}`);
  }
}

/**
 * Await for the restart patch container to be removed or exited
 */
async function waitForRestartPatchToFinish(): Promise<
  Dockerode.ContainerInspectInfo
> {
  const start = Date.now();
  while (Date.now() - start < maxRestartContainerWait) {
    const restart = await containerInspect(params.restartContainerName);
    if (!restart.State.Running) return restart;
    await pause(2 * 1000);
  }
  throw Error(`Wait for restart patch to finish timeout`);
}
