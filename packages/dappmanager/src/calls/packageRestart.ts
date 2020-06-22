import * as eventBus from "../eventBus";
import { restartPackage } from "../modules/docker/restartPackage";

/**
 * Calls docker rm and docker up on a package
 *
 * @param {string} id DNP .eth name
 */
export async function packageRestart({ id }: { id: string }): Promise<void> {
  if (!id) throw Error("kwarg id must be defined");

  await restartPackage(id);

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ ids: [id] });
}
