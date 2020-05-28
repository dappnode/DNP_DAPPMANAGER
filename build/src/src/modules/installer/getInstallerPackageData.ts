import merge from "deepmerge";
import { getUserSettingsSafe } from "../../utils/dockerComposeFile";
import * as getPath from "../../utils/getPath";
import {
  applyUserSet,
  addGeneralDataToCompose
} from "../../utils/dockerComposeParsers";
import { fileToMultiaddress } from "../../utils/distributedFile";
import orderInstallPackages from "./orderInstallPackages";
import { UserSettingsAllDnps } from "../../common/types";
import { PackageRelease, UserSettings, InstallPackageData } from "../../types";

export function getInstallerPackagesData({
  releases,
  userSettings,
  currentVersion,
  reqName
}: {
  releases: PackageRelease[];
  userSettings: UserSettingsAllDnps;
  currentVersion: { [name: string]: string | undefined };
  reqName: string;
}): InstallPackageData[] {
  const packagesDataUnordered = releases.map(release =>
    getInstallerPackageData(
      release,
      userSettings[release.name] || {},
      currentVersion[release.name]
    )
  );
  return orderInstallPackages(packagesDataUnordered, reqName);
}

/**
 * Receives a release and returns all the information and instructions
 * for the installer to process it.
 * This step is isolated to be a pure function and ease its testing
 * [PURE] Function
 */
export default function getInstallerPackageData(
  release: PackageRelease,
  userSettings: UserSettings,
  currentVersion: string | undefined
): InstallPackageData {
  const { name, semVersion, isCore, compose, metadata, origin } = release;
  /**
   * Compute paths
   */
  const composePath = getPath.dockerCompose(name, isCore);
  const composeBackupPath = getPath.backupPath(composePath);
  const manifestPath = getPath.manifest(name, isCore);
  const manifestBackupPath = getPath.backupPath(manifestPath);
  const imagePath = getPath.image(name, semVersion, isCore);

  // If composePath does not exist, or is invalid: returns {}
  const previousUserSettings = getUserSettingsSafe(name, isCore);

  // Aditional metadata
  const avatar = fileToMultiaddress(release.avatarFile);

  return {
    ...release,
    isUpdate: Boolean(currentVersion),
    // Paths
    composePath,
    composeBackupPath,
    manifestPath,
    manifestBackupPath,
    imagePath,
    // Data to write
    compose: addGeneralDataToCompose(
      applyUserSet(compose, merge(previousUserSettings, userSettings)),
      { metadata, avatar, origin, isCore }
    ),
    // User settings to be applied by the installer
    fileUploads: userSettings.fileUploads
  };
}
