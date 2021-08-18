import fs from "fs";
import params from "../params";
import { eventBus } from "../eventBus";
import * as getPath from "../utils/getPath";
import { dockerContainerRestart, dockerComposeUp } from "../modules/docker";
import { listPackage } from "../modules/docker/list";
import { restartDappmanagerPatch } from "../modules/installer/restartPatch";
import { packageInstalledHasPid, getServicesSharingPid } from "../utils/pid";
import { ComposeFileEditor } from "../modules/compose/editor";

/**
 * Recreates a package containers
 */
export async function packageRestart({
  dnpName,
  serviceNames
}: {
  dnpName: string;
  serviceNames?: string[];
}): Promise<void> {
  if (!dnpName) throw Error("kwarg dnpName must be defined");

  const dnp = await listPackage({ dnpName });
  const { compose } = new ComposeFileEditor(dnp.dnpName, dnp.isCore);
  let isPidTargetServiceIncluded = false;

  // DAPPMANAGER patch
  if (dnp.dnpName === params.dappmanagerDnpName) {
    const composePath = getPath.dockerComposeSmart(dnpName);
    if (!fs.existsSync(composePath))
      throw Error(`No docker-compose found for ${dnpName} at ${composePath}`);
    return await restartDappmanagerPatch({ composePath });
  }

  const targetContainers = dnp.containers.filter(
    c => !serviceNames || serviceNames.includes(c.serviceName)
  );

  if (targetContainers.length === 0) {
    const queryId = [dnpName, ...(serviceNames || [])].join(", ");
    throw Error(`No targetContainers found for ${queryId}`);
  }

  // Check if targetService contains pid
  if (packageInstalledHasPid(compose)) {
    const servicesSharingPid = getServicesSharingPid(compose);
    isPidTargetServiceIncluded = targetContainers.some(tc =>
      servicesSharingPid
        .map(service => service.targetPidService)
        .includes(tc.serviceName)
    );
  }

  if (isPidTargetServiceIncluded) {
    // If the target PID service will be restartedt, the whole package must be recreated
    const composePath = getPath.dockerComposeSmart(dnpName);
    if (!fs.existsSync(composePath))
      throw Error(`No docker-compose found for ${dnpName} at ${composePath}`);
    await dockerComposeUp(composePath);
  } else {
    await Promise.all(
      targetContainers.map(async c =>
        dockerContainerRestart(c.containerName, { timeout: c.dockerTimeout })
      )
    );
  }

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: [dnpName] });
}
