import fs from "fs";
import { eventBus } from "@dappnode/eventbus";
import { params } from "@dappnode/params";
import { getRepoDirPath, getDockerComposePath, shell } from "@dappnode/utils";
import { logs } from "@dappnode/logger";
import {
  getDockerTimeoutMax,
  dockerContainerRemove,
  dockerContainerStop,
  dockerComposeDown,
  listPackage
} from "@dappnode/dockerapi";
import { isRunningHttps } from "../modules/https-portal/utils/isRunningHttps.js";
import { httpsPortal } from "./httpsPortal.js";
import * as db from "../db/index.js";
import { mevBoostMainnet, mevBoostPrater, stakerPkgs } from "@dappnode/types";
import {
  ethicalMetricsDnpName,
  unregister
} from "../modules/ethicalMetrics/index.js";

/**
 * Remove package data: docker down + disk files
 *
 * @param id DNP .eth name
 * @param deleteVolumes flag to also clear permanent package data
 */
export async function packageRemove({
  dnpName,
  deleteVolumes = false
}: {
  dnpName: string;
  deleteVolumes?: boolean;
}): Promise<void> {
  if (!dnpName) throw Error("kwarg dnpName must be defined");

  const dnp = await listPackage({ dnpName });
  const timeout = getDockerTimeoutMax(dnp.containers);

  if (
    (dnp.isCore && params.corePackagesNotRemovable.includes(dnp.dnpName)) ||
    dnp.dnpName === params.dappmanagerDnpName
  ) {
    throw Error("Core packages cannot be removed");
  }

  // Remove portal https portal mappings if any.
  // MUST removed before deleting containers
  try {
    if ((await isRunningHttps()) === true) {
      const mappings = await httpsPortal.getMappings(dnp.containers);
      for (const mapping of mappings) {
        if (mapping.dnpName === dnpName)
          await httpsPortal
            .removeMapping(mapping)
            // Bypass error to continue deleting mappings
            .catch(e =>
              logs.error(`Error removing https mapping of ${dnp.dnpName}`, e)
            );
      }
    }
  } catch (e) {
    // Bypass error to continue deleting the package
    logs.error(
      `Error trying to remove https mappings from ${dnp.dnpName}. Continue with package remove`,
      e
    );
  }

  // If Ethical Metrics is being removed, unregister the instance first
  if (dnp.dnpName === ethicalMetricsDnpName) {
    try {
      await unregister();
    } catch (e) {
      logs.error(`Error unregistering Ethical Metrics instance`, e);
    }
  }

  // Only no-cores reach this block
  const composePath = getDockerComposePath(dnp.dnpName, false);
  const packageRepoDir = getRepoDirPath(dnp.dnpName, false);

  // [NOTE] Not necessary to close the ports since they will just
  // not be renewed in the next interval

  // If there is no docker-compose, do a docker rm directly
  // Otherwise, try to do a docker-compose down and if it fails,
  // log to console and do docker-rm
  let hasRemoved = false;
  if (fs.existsSync(composePath)) {
    try {
      await dockerComposeDown(composePath, {
        volumes: deleteVolumes,
        // Ignore timeout is user doesn't want to keep any data
        timeout: deleteVolumes ? undefined : timeout
      });
      hasRemoved = true; // To mimic an early return
    } catch (e) {
      logs.error(`Error on dockerComposeDown of ${dnp.dnpName}`, e);
    }
  }

  if (!hasRemoved) {
    const containerNames = dnp.containers.map(c => c.containerName);
    await Promise.all(
      containerNames.map(async containerName => {
        // Continue removing package even if container is already stopped
        await dockerContainerStop(containerName, { timeout }).catch(e => {
          if (
            e.reason.includes("container already stopped") &&
            e.statusCode === 304
          )
            return;
          else throw e;
        });
        await dockerContainerRemove(containerName, { volumes: deleteVolumes });
      })
    );
  }

  // Remove DNP folder and files
  if (fs.existsSync(packageRepoDir)) await shell(`rm -r ${packageRepoDir}`);

  // Remove client from maindb.json if it is a staker package
  if (stakerPkgs.some(stakerPkg => stakerPkg === dnp.dnpName))
    await removeStakerPkgFromDbIfSelected({ dnpName });

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: [dnp.dnpName], removed: true });
}
/**
 * Removes the package from the main DB if it is a staker package and it is selected as current client
 *
 * @param dnpName DNP of the removed package
 */
async function removeStakerPkgFromDbIfSelected({
  dnpName
}: {
  dnpName: string;
}): Promise<void> {
  switch (dnpName) {
    case db.executionClientMainnet.get():
      await db.executionClientMainnet.set(undefined);
      break;
    case db.executionClientGnosis.get():
      await db.executionClientGnosis.set(undefined);
      break;
    case db.executionClientPrater.get():
      await db.executionClientPrater.set(undefined);
      break;
    case db.executionClientLukso.get():
      await db.executionClientLukso.set(undefined);
      break;
    case db.consensusClientMainnet.get():
      await db.consensusClientMainnet.set(undefined);
      break;
    case db.consensusClientGnosis.get():
      await db.consensusClientGnosis.set(undefined);
      break;
    case db.consensusClientPrater.get():
      await db.consensusClientPrater.set(undefined);
      break;
    case db.consensusClientLukso.get():
      await db.consensusClientLukso.set(undefined);
      break;
    case mevBoostMainnet:
      await db.mevBoostMainnet.set(false);
      break;
    case mevBoostPrater:
      await db.mevBoostPrater.set(false);
      break;
    default:
      return;
  }

  logs.info(`Removed client ${dnpName} from main DB after package is removed`);
}
