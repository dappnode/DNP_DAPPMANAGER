import fs from "fs";
import semver from "semver";
import params from "../../params";
import * as db from "../../db";
import { listContainerNoThrow } from "../docker/listContainers";
import restartDappmanagerPatch from "../docker/restartPatch";
import { pause } from "../../utils/asyncFlows";
import * as getPath from "../../utils/getPath";
import { readComposeObj } from "../../utils/dockerComposeFile";
import { parseService } from "../../utils/dockerComposeParsers";
import Logs from "../../logs";
const logs = Logs(module);

const maxRestartContainerWait = 60 * 1000;
const waitBetweenRestarts = 5 * 60 * 1000;

/**
 * Completes a core update migration by making sure all steps are completed
 * - Move .next.yml files to .yml
 * - Up DAPPMANAGER if it's version is equal to the compose
 */
export async function postCoreUpdate(): Promise<void> {
  await Promise.all([
    // Await for restart patch to finish,
    waitForRestartPatchToFinish(),
    // and, wait at least 5 seconds
    pause(5 * 1000)
  ]);

  // Move .next.yml files to .yml
  const composePath = getPath.dockerCompose(params.dappmanagerDnpName, true);
  mvIfExists(getPath.nextPath(composePath), composePath);

  // Up DAPPMANAGER if it's version is equal to the compose
  const composeVersion = readComposeVersion(composePath);
  const dappmanager = await listContainerNoThrow(params.dappmanagerDnpName);
  const currentVersion = (dappmanager || {}).version || "";
  if (
    semver.valid(currentVersion) &&
    semver.valid(composeVersion) &&
    semver.lt(currentVersion, composeVersion)
  ) {
    // Add additional wait if there are two restarts to quickly
    // and a least 5 minutes between restarts
    const lastRestart = db.lastPostCoreUpdateRestart.get();
    const waitTime = waitBetweenRestarts + lastRestart - Date.now();
    if (waitTime > 0) {
      logs.warn(
        `Two consecutive DAPPMANAGER restarts in post core update step: \n  Waiting ${waitTime} ms to restart`
      );
      await pause(waitTime);
    }

    logs.info(
      `Restarting DAPPMANAGER in post core update step: \n  Applying update ${currentVersion} => ${composeVersion}`
    );
    db.lastPostCoreUpdateRestart.set(Date.now());
    await restartDappmanagerPatch();
  }
}

/**
 * Util to parse semver from a DNP compose
 * @param composePath "/usr/src/dappnode/DNCORE/docker-compose-dappmanager.yml"
 */
function readComposeVersion(composePath: string): string {
  const compose = readComposeObj(composePath);
  const { image } = parseService(compose) || {};
  return (image || "").split(":")[1] || "";
}

/**
 * Util to move a file only if exists
 * @param from
 * @param to
 */
function mvIfExists(from: string, to: string): void {
  try {
    fs.renameSync(from, to);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
}

/**
 * Await for the restart patch container to be removed or exited
 */
async function waitForRestartPatchToFinish(): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxRestartContainerWait) {
    const restart = await listContainerNoThrow(params.restartContainerName);
    if (!restart || !restart.running) return;
    await pause(2 * 1000);
  }
}
