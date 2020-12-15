import * as eventBus from "../eventBus";
import { listPackage } from "../modules/docker/list";
import { restartPackage } from "../modules/docker/restartPackage";
import { getDockerTimeoutMax } from "../modules/docker/utils";

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
  const timeout = getDockerTimeoutMax(dnp.containers);
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
