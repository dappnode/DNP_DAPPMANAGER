import fs from "fs";
import params from "../params.js";
import { eventBus } from "../eventBus.js";
import * as getPath from "../utils/getPath.js";
import { dockerContainerRestart } from "../modules/docker/index.js";
import { listPackage } from "../modules/docker/list/index.js";
import { restartDappmanagerPatch } from "../modules/installer/restartPatch.js";
import { getServicesSharingPid } from "../utils/pid.js";
import { ComposeFileEditor } from "../modules/compose/editor.js";
import { PackageContainer } from "@dappnode/common";

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

  const servicesSharingPid = getServicesSharingPid(compose, targetContainers);

  if (servicesSharingPid) {
    // First restart targetPid services (Process MUST exist)
    const targetContainersPid = dnp.containers.filter(c =>
      servicesSharingPid.targetPidServices.includes(c.serviceName)
    );
    await containersRestart(targetContainersPid);

    // Second restart dependandtPidServices (Process exists)
    const dependantContainersPid = dnp.containers.filter(c =>
      servicesSharingPid.dependantPidServices.includes(c.serviceName)
    );
    await containersRestart(dependantContainersPid);
  } else {
    await containersRestart(targetContainers);
  }

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: [dnpName] });
}

// Utils

async function containersRestart(
  targetContainers: PackageContainer[]
): Promise<void> {
  await Promise.all(
    targetContainers.map(async c =>
      dockerContainerRestart(c.containerName, { timeout: c.dockerTimeout })
    )
  );
}
