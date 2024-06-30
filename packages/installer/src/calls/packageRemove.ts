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
  listPackage,
} from "@dappnode/dockerapi";
import { httpsPortal } from "@dappnode/httpsportal";
import { ethicalMetricsDnpName, unregister } from "@dappnode/ethicalmetrics";

/**
 * Remove package data: docker down + disk files
 *
 * @param id DNP .eth name
 * @param deleteVolumes flag to also clear permanent package data
 */
export async function packageRemove({
  dnpName,
  deleteVolumes = false,
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
    httpsPortal.removeMappings(dnp);
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
        timeout: deleteVolumes ? undefined : timeout,
      });
      hasRemoved = true; // To mimic an early return
    } catch (e) {
      logs.error(`Error on dockerComposeDown of ${dnp.dnpName}`, e);
    }
  }

  if (!hasRemoved) {
    const containerNames = dnp.containers.map((c) => c.containerName);
    await Promise.all(
      containerNames.map(async (containerName) => {
        // Continue removing package even if container is already stopped
        await dockerContainerStop(containerName, { timeout }).catch((e) => {
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

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: [dnp.dnpName], removed: true });
}
