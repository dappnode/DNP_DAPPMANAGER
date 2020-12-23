import { eventBus } from "../eventBus";
import { dockerComposeUpPackage, getContainersStatus } from "../modules/docker";

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

  const containersStatus = await getContainersStatus({ dnpName });
  await dockerComposeUpPackage({ dnpName }, containersStatus, {
    serviceNames,
    forceRecreate: true
  });

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: [dnpName] });
}
