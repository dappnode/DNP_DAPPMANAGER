import { PackageContainer } from "../common";
import * as eventBus from "../eventBus";
import { listPackage } from "../modules/docker/listContainers";
import { restartPackage } from "../modules/docker/restartPackage";

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
  const timeout = getDockerTimeout(dnp.containers);
  await restartPackage({
    dnpName,
    serviceNames,
    forceRecreate: true,
    timeout
  });

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: [dnpName] });
}

function getDockerTimeout(containers: PackageContainer[]): number | undefined {
  let timeout: number | undefined = undefined;

  for (const container of containers) {
    if (container.dockerTimeout) {
      const timeoutNumber = parseInt(container.dockerTimeout);
      if (!timeout || timeoutNumber > timeout) {
        timeout = timeoutNumber;
      }
    }
  }
  return timeout;
}
