import { restartPackageVolumes } from "../modules/docker/restartPackageVolumes";
import * as eventBus from "../eventBus";

/**
 * Removes a package volumes. The re-ups the package
 */
export async function packageRestartVolumes({
  id,
  volumeId
}: {
  id: string;
  /**
   * volumeId = "gethdnpdappnodeeth_geth"
   */
  volumeId?: string;
}): Promise<void> {
  const { removedVols, removedDnps } = await restartPackageVolumes({
    id,
    volumeId
  });

  // Emit packages update
  if (removedVols.length > 0) {
    eventBus.requestPackages.emit();
    eventBus.packagesModified.emit({ ids: removedDnps });
  }
}
