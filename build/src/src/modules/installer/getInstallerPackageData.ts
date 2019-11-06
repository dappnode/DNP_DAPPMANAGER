import { PackageRelease, UserSettings, InstallPackageData } from "../../types";
import merge from "deepmerge";
import { getUserSettings } from "../../utils/dockerComposeFile";
import * as getPath from "../../utils/getPath";
import {
  applyUserSet,
  addGeneralDataToCompose
} from "../../utils/dockerComposeParsers";
import Logs from "../../logs";
const logs = Logs(module);

/**
 * Receives a release and returns all the information and instructions
 * for the installer to process it.
 * This step is isolated to be a pure function and ease its testing
 * [PURE] Function
 */
export default function getInstallerPackageData(
  release: PackageRelease,
  userSettings: UserSettings
): InstallPackageData {
  const { name, version, isCore, compose, metadata, origin } = release;
  /**
   * Compute paths
   */
  const composePath = getPath.dockerCompose(name, isCore);
  const composeNextPath = getPath.nextPath(composePath);
  const manifestPath = getPath.manifest(name, isCore);
  const imagePath = getPath.image(name, version, isCore);

  /**
   * Gather extra data
   */
  const previousUserSettings = getPreviousUserSettings(name, isCore);

  return {
    ...release,
    // Paths
    composePath,
    composeNextPath,
    manifestPath,
    imagePath,
    // Data to write
    compose: addGeneralDataToCompose(
      applyUserSet(compose, merge(previousUserSettings, userSettings)),
      { metadata, origin, isCore }
    ),
    // User settings to be applied by the installer
    fileUploads: userSettings.fileUploads
  };
}

/**
 * If composePath does not exist, returns empty object {}
 * If the compose is invalid, just return empty ENVs
 */
function getPreviousUserSettings(name: string, isCore: boolean): UserSettings {
  try {
    const composePath = getPath.dockerCompose(name, isCore);
    return getUserSettings(composePath);
  } catch (e) {
    logs.error(`Error getting user set envs: ${e.stack}`);
    return {};
  }
}
