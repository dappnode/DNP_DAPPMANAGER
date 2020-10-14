import { restartPackageVolumes } from "../modules/docker/restartPackageVolumes";
import * as eventBus from "../eventBus";

/**
 * Removes a package volumes. The re-ups the package
 */
export async function packageRestartVolumes({
  dnpName,
  volumeId
}: {
  dnpName: string;
  /**
   * volumeId = "gethdnpdappnodeeth_geth"
   */
  volumeId?: string;
}): Promise<void> {
  const { removedDnps } = await restartPackageVolumes({ dnpName, volumeId });

  // Emit packages update
  if (removedDnps.length > 0) {
    eventBus.requestPackages.emit();
    eventBus.packagesModified.emit({ dnpNames: removedDnps });
  }
}
