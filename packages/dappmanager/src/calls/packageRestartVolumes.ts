import fs from "fs";
import { removeNamedVolume } from "../modules/docker/removeNamedVolume.js";
import { eventBus } from "../eventBus.js";
import { params } from "@dappnode/params";
import { logs } from "@dappnode/logger";
import * as getPath from "../utils/getPath.js";
import {
  dockerContainerRemove,
  dockerVolumesList,
  dockerComposeUpPackage,
  getContainersStatus,
  getContainersAndVolumesToRemove,
  dockerContainerStop
} from "../modules/docker/index.js";
import { listPackage } from "../modules/docker/list/index.js";
import { packageInstalledHasPid } from "../utils/pid.js";
import { ComposeFileEditor } from "../modules/compose/editor.js";
import { containerNamePrefix, containerCoreNamePrefix } from "@dappnode/types";
import { unregister } from "../modules/ethicalMetrics/unregister.js";
import {
  ethicalMetricsDnpName,
  ethicalMetricsTorServiceVolume
} from "../modules/ethicalMetrics/index.js";

/**
 * Removes a package volumes. The re-ups the package
 */
export async function packageRestartVolumes({
  dnpName,
  volumeId: volumeName
}: {
  dnpName: string;
  /**
   * volumeId = "gethdnpdappnodeeth_geth"
   */
  volumeId?: string;
}): Promise<void> {
  if (!dnpName) throw Error("kwarg dnpName must be defined");

  if (dnpName === params.dappmanagerDnpName)
    throw Error("The dappmanager cannot be restarted");

  // Needs the extended info that includes the volume ownership data
  // Fetching all containers to not re-fetch below
  const volumes = await dockerVolumesList();
  const dnp = await listPackage({ dnpName });
  const { compose } = new ComposeFileEditor(dnp.dnpName, dnp.isCore);

  // Make sure the compose exists before deleting it's containers
  const composePath = getPath.dockerCompose(dnp.dnpName, dnp.isCore);
  if (!fs.existsSync(composePath))
    throw Error(`No compose found for ${dnp.dnpName}: ${composePath}`);

  const { volumesToRemove, containersToRemove } =
    getContainersAndVolumesToRemove(dnp, volumeName, volumes);
  logs.debug({ dnpName, volumesToRemove, containersToRemove });

  // Skip early to prevent calling dockerComposeUp
  if (volumesToRemove.length === 0) {
    return;
  }

  // The Ethical Metrics instance must be unregistered if the tor hidden service volume is removed
  if (
    (dnp.dnpName === ethicalMetricsDnpName && !volumeName) ||
    volumeName === ethicalMetricsTorServiceVolume
  ) {
    try {
      await unregister();
    } catch (e) {
      logs.error(`Error unregistering Ethical Metrics instance`, e);
    }
  }

  const containersStatus = await getContainersStatus({ dnpName });

  let err: Error | null = null;
  try {
    for (const containerName of containersToRemove) {
      // get the service name from the container name
      const serviceName = containerName
        .split(
          containerName.includes(containerNamePrefix)
            ? containerNamePrefix
            : containerCoreNamePrefix
        )[1]
        .split(".")[0];
      // only stop containers that are running
      if (containersStatus[serviceName]?.targetStatus === "running")
        await dockerContainerStop(containerName, { timeout: 5 });

      await dockerContainerRemove(containerName);
    }
    for (const volName of volumesToRemove) {
      await removeNamedVolume(volName);
    }
  } catch (e) {
    err = e;
  }

  // In case of error: FIRST up the dnp, THEN throw the error
  await dockerComposeUpPackage(
    { dnpName },
    containersStatus,
    (packageInstalledHasPid(compose) && { forceRecreate: true }) || {}
  );

  if (err) {
    throw err;
  }

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: [dnpName] });
}
