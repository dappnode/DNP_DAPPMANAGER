import { mapValues } from "lodash";
import { dockerVolumeInspect } from "../modules/docker/dockerApi";
import { listContainer } from "../modules/docker/listContainers";
import { readManifestIfExists } from "../modules/manifest";
import * as db from "../db";
import { InstalledPackageDetailData } from "../types";
import { logs } from "../logs";
import { parseDevicePath } from "../modules/compose";
import { ComposeFileEditor } from "../modules/compose/editor";

/**
 * Toggles the visibility of a getting started block
 * @param show Should be shown on hidden
 */
export async function packageGet({
  id
}: {
  id: string;
}): Promise<InstalledPackageDetailData> {
  if (!id) throw Error("kwarg id must be defined");

  const dnp: InstalledPackageDetailData = await listContainer(id);

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

    dnp.volumesSize = mapValues(volDevicePaths, (devicePath /* volName */) => {
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

  try {
    const manifest = readManifestIfExists(dnp);
    if (manifest && manifest.setupWizard) {
      // Setup wizard, only include the environment fields
      dnp.setupWizard = {
        ...manifest.setupWizard,
        fields: manifest.setupWizard.fields.filter(
          field => field.target && field.target.type === "environment"
        )
      };

      // Getting started
      dnp.gettingStarted = manifest.gettingStarted;
      dnp.gettingStartedShow = Boolean(
        db.packageGettingStartedShow.get(dnp.name)
      );
    }
  } catch (e) {
    logs.warn(`Error getting manifest for ${dnp.name}`, e);
  }

  // User settings
  try {
    // Why not fetch the ENVs from a container inspect > config ??
    // ENVs that are not declared in the compose will show up (i.e. PATH)
    // So it's easier and cleaner to just parse the docker-compose.yml
    const compose = new ComposeFileEditor(dnp.name, dnp.isCore);
    dnp.userSettings = {
      environment: compose.service().getEnvs()
    };
  } catch (e) {
    logs.warn(`Error getting user settings for ${dnp.name}`, e);
  }

  return dnp;
}
