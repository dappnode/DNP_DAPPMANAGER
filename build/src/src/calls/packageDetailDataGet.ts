import { mapValues } from "lodash";
import { dockerVolumeInspect } from "../modules/docker/dockerApi";
import { listContainer } from "../modules/docker/listContainers";
import { parseDevicePath } from "../utils/dockerComposeParsers";
import { readManifest, readEnvironment } from "../utils/configFiles";
import { PackageDetailData } from "../types";
import { logs } from "../logs";

/**
 * Toggles the visibility of a getting started block
 * @param show Should be shown on hidden
 */
export async function packageDetailDataGet({
  id
}: {
  id: string;
}): Promise<PackageDetailData> {
  if (!id) throw Error("kwarg id must be defined");

  const packageDetail: PackageDetailData = {};

  const dnp = await listContainer(id);

  // Detailed volume info
  try {
    const volDevicePaths: { [volumeName: string]: string } = {};

    for (const vol of dnp.volumes) {
      if (vol.name) {
        const volInfo = await dockerVolumeInspect(vol.name);
        if (
          volInfo.Options &&
          volInfo.Options.device &&
          volInfo.Driver === "local" &&
          volInfo.Options.o === "bind"
        )
          volDevicePaths[vol.name] = volInfo.Options.device;
      }
    }

    // Only call this very expensive function if necessary
    // TODO: This feature is deactivated until UX is sorted out
    //       calling du on massive dirs is too resource consuming
    //       and can take +30min on Storj data
    // const volumeSizes = isEmpty(volDevicePaths)
    //   ? {}
    //   : await getHostVolumeSizes(volDevicePaths);

    packageDetail.volumes = mapValues(volDevicePaths, (
      devicePath /* volName */
    ) => {
      const pathParts = parseDevicePath(devicePath);
      return {
        size: undefined, // volumeSizes[volName]
        devicePath,
        mountpoint: pathParts ? pathParts.mountpoint : undefined
      };
    });
  } catch (e) {
    logs.warn(`Error getting volume details for ${dnp.name}`, e);
  }

  // Setup wizard
  try {
    const manifest = readManifest(dnp);
    if (manifest && manifest.setupWizard) {
      // Setup wizard, only include the environment fields
      packageDetail.setupWizard = {
        ...manifest.setupWizard,
        fields: manifest.setupWizard.fields.filter(
          field => field.target && field.target.type === "environment"
        )
      };
    }
  } catch (e) {
    logs.warn(`Error getting manifest for ${dnp.name}`, e);
  }

  // User settings
  try {
    const environment = readEnvironment(dnp);
    packageDetail.userSettings = {
      environment: environment
    };
  } catch (e) {
    logs.warn(`Error getting user settings for ${dnp.name}`, e);
  }

  return packageDetail;
}
