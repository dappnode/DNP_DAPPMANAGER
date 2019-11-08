import { PackageRelease, UserSettings, InstallPackageData } from "../../types";
import merge from "deepmerge";
import { getUserSettingsSafe } from "../../utils/dockerComposeFile";
import * as getPath from "../../utils/getPath";
import {
  applyUserSet,
  addGeneralDataToCompose
} from "../../utils/dockerComposeParsers";

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
  const { name, semVersion, isCore, compose, metadata, origin } = release;
  /**
   * Compute paths
   */
  const composePath = getPath.dockerCompose(name, isCore);
  const composeNextPath = getPath.nextPath(composePath);
  const manifestPath = getPath.manifest(name, isCore);
  const imagePath = getPath.image(name, semVersion, isCore);

  // If composePath does not exist, or is invalid: returns {}
  const previousUserSettings = getUserSettingsSafe(name, isCore);

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
