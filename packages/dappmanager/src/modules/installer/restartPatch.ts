import fs from "fs";
import path from "path";
import * as getPath from "../../utils/getPath";
import * as validate from "../../utils/validate";
import * as db from "../../db";
import shell from "../../utils/shell";
import { pause } from "../../utils/asyncFlows";
import params from "../../params";
import { logs } from "../../logs";
import Dockerode from "dockerode";
import {
  dockerContainerInspect,
  logContainer,
  dockerContainerRemove
} from "../docker/api";
import { getLogUi } from "../../utils/logUi";
import { rollbackPackages } from "./rollbackPackages";
import { postInstallClean } from "./postInstallClean";
import { afterInstall } from "./afterInstall";
import { flagPackagesAreInstalling } from "./packageIsInstalling";
import { ComposeEditor } from "../compose/editor";
import { InstallPackageData, InstallPackageDataPaths } from "@dappnode/common";

const restartId = params.restartDnpName;
const dappmanagerName = params.dappmanagerDnpName;
const restartContainerName = params.restartContainerName;
const restartScriptPath = path.join(params.DNCORE_DIR, "restart-dappnode.sh");
const timeoutWaitForRestart = 60 * 1000;

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
  const composeRestartPath = getPath.dockerCompose(restartId, true);
  if (!composeBackupPath) composeBackupPath = getPath.backupPath(composePath);

  // Must make sure that there is no restart container running previously
  // If it's still running it will wait for a few seconds before killing it. If it working
  // properly, before the timeout expires the restart patch should kill the DAPPMANAGER;
  // but if something went wrong it will unlock the situation by killing a frozen restart container
  // If it's exited it will be removed beforehand
  try {
    const restart = await waitForRestartPatchToFinish();
    // Restart is defined if the container exists even if exited
    // Remove it to make sure that the exit signal after running the restart patch is for this run
    if (restart) {
      await logRestartPatchStatus(restart);
      await dockerContainerRemove(restart.Id);
    }
  } catch (e) {
    // Since removing restart is non-essential, don't block a core update, just log
    logs.error(`Error removing ${restartContainerName}`, e);
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
   * [NOTE]: This script MUST exit with code > 0 for postRestartPatch() to know when to rollback
   */
  const restartScript = `
docker-compose -f ${composePath} up -d --force-recreate
UPEXIT=$?
if [ $UPEXIT -ne 0 ]
then
    echo "${dappmanagerName} up failed with exit $UPEXIT, starting backup"
    if [ "$(docker ps -aq -f status=running -f name=${dappmanagerName})" ]
    then
        echo "${dappmanagerName} is still running"
        docker-compose -f ${composeBackupPath} up -d
    else
        echo "${dappmanagerName} is not running, using --force-recreate"
        docker-compose -f ${composeBackupPath} up -d --force-recreate
    fi
fi
exit $UPEXIT
`;

  fs.writeFileSync(restartScriptPath, restartScript);

  const dappmCompose = new ComposeEditor(ComposeEditor.readFrom(composePath));
  const dappmanagerNewImage = dappmCompose.firstService().get().image;

  const composeRestart = new ComposeEditor({
    version: "3.5",
    services: {
      [restartId]: {
        image: dappmanagerNewImage,
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
  });

  validate.path(composeRestartPath);
  composeRestart.writeTo(composeRestartPath);

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
 * Completes a core update / restart if necessary
 * The restart container MUST exit with code > 0 if there was an error
 * Its exit code is the indicator to trigger a rollback in this function
 */
export async function postRestartPatch(): Promise<void> {
  const restart = await waitForRestartPatchToFinish();

  if (restart) {
    await logRestartPatchStatus(restart);

    const packagesDataRaw = db.coreUpdatePackagesData.get();
    const log = getLogUi(params.coreDnpName);
    if (!packagesDataRaw) {
      // Assuming the dappmanager has been reseted, not updated
      logs.info(`No core update packages data found`);
    } else {
      // Ensure compatibility across core updates
      const packagesData = packagesDataRaw.map(parsePackageDataRaw);

      if (restart.State.ExitCode > 0) {
        // Error during update, needs to rollback
        const dnpNames = packagesData.map(({ dnpName }) => dnpName);
        flagPackagesAreInstalling(dnpNames);
        rollbackPackages(packagesData, log);
        afterInstall(dnpNames);
      } else {
        // All okay, finish installation
        postInstallClean(packagesData, log);
      }
    }

    // Remove the pending core update packages data
    db.coreUpdatePackagesData.set(null);

    // Remove restart patch container
    await dockerContainerRemove(params.restartContainerName);
  } else {
    logs.info(`No restart patch found, assuming a manual restart`);
  }
}

/**
 * Report on the status of the restart container
 * Non-essential, so wrap in try catch to not prevent a rollback
 * @param restart
 */
async function logRestartPatchStatus(
  restart: Dockerode.ContainerInspectInfo
): Promise<void> {
  try {
    if (!restart) {
      logs.info(`No restart patch found, assuming a manual restart`);
      return;
    }

    const finishTime = new Date(restart.State.FinishedAt);
    const finishSecAgo = (Date.now() - finishTime.getTime()) / 1000;
    const restartLogs = await logContainer(restartContainerName);
    const restartLogsIndented = restartLogs
      .split("\n")
      .map(line => "\t" + line)
      .join("\n");
    logs.info(`Restart patch status:
  Finished: ${finishTime.toISOString()}, ${finishSecAgo} seconds ago
  ExitCode: ${restart.State.ExitCode} ${restart.State.Error}
  Logs: 
${restartLogsIndented}
`);
  } catch (e) {
    logs.error("Error reporting restart patch status", e);
  }
}

/**
 * Await for the restart patch container to be removed or exited
 */
async function waitForRestartPatchToFinish(): Promise<Dockerode.ContainerInspectInfo | null> {
  try {
    let restart = await dockerContainerInspect(restartContainerName);
    const start = Date.now();
    while (
      Date.now() - start < timeoutWaitForRestart &&
      restart.State.Running
    ) {
      restart = await dockerContainerInspect(restartContainerName);
      await pause(1000);
    }
    return restart;
  } catch (e) {
    if (e.statusCode === 404 || e.reason === "no such container") return null;
    else throw e;
  }
}

/**
 * Package data is stored in the DB before an update
 * Previous versions of DAppNode had a different schema,
 * so this function ensures compatibility cross-version
 * - packageData from < v0.2.35, won't have property .dnpName
 */
function parsePackageDataRaw(
  packageData: InstallPackageDataPaths
): InstallPackageDataPaths {
  if (packageData.dnpName) {
    // New OK data
    return packageData;
  }

  const pre0235Data = packageData as unknown as {
    name: string;
    version: string;
  };
  if (pre0235Data.name) {
    // packageData from < v0.2.35, won't have property .dnpName
    return {
      ...packageData,
      dnpName: pre0235Data.name,
      semVersion: pre0235Data.version
    };
  }

  throw Error(`Unknown packageData format: ${JSON.stringify(packageData)}`);
}
