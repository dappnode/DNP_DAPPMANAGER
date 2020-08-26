import { omit } from "lodash";
import { listContainers } from "../modules/docker/listContainers";
import { readManifestIfExists } from "../modules/manifest";
import * as db from "../db";
import { InstalledPackageDetailData } from "../types";
import { logs } from "../logs";
import { ComposeFileEditor } from "../modules/compose/editor";
import { getVolumesOwnershipData } from "../modules/docker/volumesData";
import { getDnpsToRemoveAll } from "../modules/docker/restartPackageVolumes";

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

  const dnpList = await listContainers();
  const dnp = dnpList.find(_dnp => _dnp.dnpName === id);
  if (!dnp) throw Error(`No DNP was found for name ${id}`);
  const volumesData = await getVolumesOwnershipData();

  // Metadata for package/:id/controls feedback
  const { dnpsToRemove } = getDnpsToRemoveAll(dnp, volumesData);

  const dnpData: InstalledPackageDetailData = {
    ...dnp,

    areThereVolumesToRemove:
      dnp.volumes.length > 0 &&
      dnp.volumes.some(vol => {
        const owner = volumesData.find(v => v.name === vol.name)?.owner;
        return !owner || owner === dnp.dnpName;
      }),
    volumeUsersToRemove: dnpsToRemove.filter(name => name !== dnp.dnpName),
    dependantsOf: dnpList.filter(d => d.dependencies[id]).map(d => d.dnpName),
    namedExternalVols: volumesData.filter(
      v => v.owner && v.owner !== dnp.dnpName && v.users.includes(dnp.dnpName)
    )
  };

  // Add non-blocking data
  try {
    const manifest = readManifestIfExists(dnp);
    if (manifest) {
      // Append manifest for general info
      dnpData.manifest = omit(manifest, [
        "setupWizard",
        "gettingStarted",
        "backup"
      ]);

      // Getting started
      if (manifest.gettingStarted) {
        dnpData.gettingStarted = manifest.gettingStarted;
        dnpData.gettingStartedShow = Boolean(
          db.packageGettingStartedShow.get(dnp.dnpName)
        );
      }

      // Backup
      if (manifest.backup) {
        dnpData.backup = manifest.backup;
      }

      // Setup wizard, only include the environment fields
      if (manifest.setupWizard) {
        dnpData.setupWizard = {
          ...manifest.setupWizard,
          fields: manifest.setupWizard.fields.filter(
            field => field.target && field.target.type === "environment"
          )
        };
      }
    } else {
      logs.debug(`No manifest found for ${dnp.dnpName} core = ${dnp.isCore}`);
    }
  } catch (e) {
    logs.warn(`Error getting manifest for ${dnp.dnpName}`, e);
  }

  // User settings
  try {
    // Why not fetch the ENVs from a container inspect > config ??
    // ENVs that are not declared in the compose will show up (i.e. PATH)
    // So it's easier and cleaner to just parse the docker-compose.yml
    const userSettings = ComposeFileEditor.getUserSettingsIfExist(
      dnp.dnpName,
      dnp.isCore
    );
    dnpData.userSettings = {
      environment: userSettings.environment
    };
  } catch (e) {
    logs.warn(`Error getting user settings for ${dnp.dnpName}`, e);
  }

  return dnpData;
}
