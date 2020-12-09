import deepmerge from "deepmerge";
import * as getPath from "../../utils/getPath";
import orderInstallPackages from "./orderInstallPackages";
import {
  UserSettingsAllDnps,
  UserSettings,
  InstalledPackageData
} from "../../types";
import { PackageRelease, InstallPackageData } from "../../types";
import { ComposeEditor, ComposeFileEditor } from "../compose/editor";
import { parseTimeoutSeconds } from "../../utils/timeout";

export function getInstallerPackagesData({
  releases,
  userSettings,
  currentVersions,
  reqName,
  packageInfo
}: {
  releases: PackageRelease[];
  userSettings: UserSettingsAllDnps;
  currentVersions: { [dnpName: string]: string | undefined };
  reqName: string;
  packageInfo?: InstalledPackageData;
}): InstallPackageData[] {
  const packagesDataUnordered = releases.map(release =>
    getInstallerPackageData(
      release,
      userSettings[release.dnpName],
      currentVersions[release.dnpName],
      packageInfo
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
function getInstallerPackageData(
  release: PackageRelease,
  userSettings: UserSettings | undefined,
  currentVersion: string | undefined,
  packageInfo?: InstalledPackageData
): InstallPackageData {
  const { dnpName, semVersion, isCore, imageFile } = release;

  // Compute paths
  const composePath = getPath.dockerCompose(dnpName, isCore);
  const composeBackupPath = getPath.backupPath(composePath);
  const manifestPath = getPath.manifest(dnpName, isCore);
  const manifestBackupPath = getPath.backupPath(manifestPath);
  // Prepend the hash to the version to make image files unique
  // Necessary for the image download cache to re-download different
  // images for the same semantic version
  const versionWithHash = `${semVersion}-${imageFile.hash}`;
  const imagePath = getPath.image(dnpName, versionWithHash, isCore);

  // If composePath does not exist, or is invalid: returns {}
  const prevUserSet = ComposeFileEditor.getUserSettingsIfExist(dnpName, isCore);
  const nextUserSet = deepmerge(prevUserSet, userSettings || {});

  // Append to compose
  const compose = new ComposeEditor(release.compose);
  compose.applyUserSettings(nextUserSet, { dnpName });

  const dockerTimeout = parseTimeoutSeconds(release.metadata.dockerTimeout);

  const runningServicesNames = packageInfo?.containers
    .filter(container => container.running)
    .map(container => container.serviceName);

  const allServicesRunning = packageInfo?.containers.every(
    container => container.running
  );

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
    compose: compose.output(),
    // User settings to be applied by the installer
    fileUploads: userSettings?.fileUploads,
    dockerTimeout,
    runningServicesNames: runningServicesNames
      ? runningServicesNames
      : undefined,
    allServicesRunning: allServicesRunning ? allServicesRunning : undefined
  };
}
