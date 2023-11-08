import fs from "fs";
import { params } from "@dappnode/params";
import { eventBus } from "@dappnode/eventbus";
import { dockerContainerRestart, listPackage } from "@dappnode/dockerapi";
import { restartDappmanagerPatch } from "@dappnode/installer";
import { getServicesSharingPid } from "@dappnode/utils";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import { PackageContainer } from "@dappnode/common";
import { getDockerComposePathSmart } from "@dappnode/utils";

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
    const composePath = getDockerComposePathSmart(dnpName);
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
