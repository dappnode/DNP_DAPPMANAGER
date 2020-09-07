import * as eventBus from "../eventBus";
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

  await restartPackage({ dnpName, serviceNames, forceRecreate: true });

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: [dnpName] });
}
