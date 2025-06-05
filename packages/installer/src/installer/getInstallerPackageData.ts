import deepmerge from "deepmerge";
import { orderInstallPackages } from "./orderInstallPackages.js";
import { ComposeEditor, ComposeFileEditor } from "@dappnode/dockercompose";
import { getContainersStatus, listPackages } from "@dappnode/dockerapi";
import { parseTimeoutSeconds } from "../utils.js";
import {
  UserSettingsAllDnps,
  UserSettings,
  PackageRelease,
  InstallPackageData,
  ContainersStatus,
  NotificationsConfig,
  NotificationsSettingsAllDnps
} from "@dappnode/types";
import { getBackupPath, getDockerComposePath, getImagePath, getManifestPath } from "@dappnode/utils";
import { gt } from "semver";
import { logs } from "@dappnode/logger";

interface GetInstallerPackageDataArg {
  releases: PackageRelease[];
  userSettings: UserSettingsAllDnps;
  notificationsSettings: NotificationsSettingsAllDnps;
  currentVersions: { [dnpName: string]: string | undefined };
  reqName: string;
}

export async function getInstallerPackagesData({
  releases,
  userSettings,
  notificationsSettings,
  currentVersions,
  reqName
}: GetInstallerPackageDataArg): Promise<InstallPackageData[]> {
  // Gather packageData first to prevent calling multiple times
  // listPackage inside of getContainersStatus
  const dnps = await listPackages();

  const packagesDataUnordered = await Promise.all(
    releases.map(
      async (release): Promise<InstallPackageData> =>
        getInstallerPackageData(
          release,
          userSettings[release.dnpName],
          notificationsSettings?.[release.dnpName],
          currentVersions[release.dnpName],
          await getContainersStatus({
            dnpName: release.dnpName,
            dnp: dnps.find((pkg) => pkg.dnpName === release.dnpName)
          })
        )
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
  notificationsSettings: NotificationsConfig | undefined,
  currentVersion: string | undefined,
  containersStatus: ContainersStatus
): InstallPackageData {
  const { dnpName, semVersion, isCore, imageFile, manifest } = release;

  // Compute paths
  const composePath = getDockerComposePath(dnpName, isCore);
  const composeBackupPath = getBackupPath(composePath);
  const manifestPath = getManifestPath(dnpName, isCore);
  const manifestBackupPath = getBackupPath(manifestPath);
  // Prepend the hash to the version to make image files unique
  // Necessary for the image download cache to re-download different
  // images for the same semantic version
  const versionWithHash = `${semVersion}-${imageFile.hash}`;
  const imagePath = getImagePath(dnpName, versionWithHash, isCore);

  // If composePath does not exist, or is invalid: returns {}
  const prevUserSet = ComposeFileEditor.getUserSettingsIfExist(dnpName, isCore);
  migrateGethUserSettingsIfNeeded(prevUserSet, dnpName, semVersion);
  const nextUserSet = deepmerge(prevUserSet, userSettings || {});

  // Append to compose
  const compose = new ComposeEditor(release.compose);
  compose.applyUserSettings(nextUserSet, { dnpName });

  const dockerTimeout = parseTimeoutSeconds(release.manifest.dockerTimeout);

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
    manifest: release.manifest.notifications
      ? {
          ...release.manifest,
          // Apply notitications user settings if any
          notifications: notificationsSettings
        }
      : manifest,
    // User settings to be applied by the installer
    fileUploads: userSettings?.fileUploads,
    dockerTimeout,
    containersStatus
  };
}

/**
 * Migrates the user settings from the old service name to the new service name
 *
 * Edge case for dnpName "geth.dnp.dappnode.eth" and serviceName "geth.dnp.dappnode.eth"
 * The service name of the geth package has migrated to "geth" and the user settings should be applied to the new service name
 * This edge case is implemented in core release 0.3.0 and should be safe to remove in the future
 */
function migrateGethUserSettingsIfNeeded(prevUserSet: UserSettings, dnpName: string, semVersion: string) {
  const gethDnpName = "geth.dnp.dappnode.eth";
  const legacyGethServiceName = gethDnpName;
  const newGethServiceName = "geth";

  // consider alreadyMigrated if the serviceName of the previous user settings is already the new service name
  // use serviceNetworks, portsMappings and environment to check for the old service name
  const alreadyMigrated =
    prevUserSet.networks?.serviceNetworks?.[newGethServiceName] ||
    prevUserSet.portMappings?.[newGethServiceName] ||
    prevUserSet.environment?.[newGethServiceName];

  if (alreadyMigrated) {
    logs.info(`User settings of geth already migrated for ${dnpName}`);
    return;
  }

  if (dnpName === gethDnpName && gt(semVersion, "0.1.43")) {
    logs.info(`Version ${semVersion} is greater than 0.1.43. Using service name "geth"`);
    if (prevUserSet.networks) {
      logs.info(`Migrating user settings networks from geth.dnp.dappnode.eth to geth`);

      prevUserSet.networks.serviceNetworks.geth = prevUserSet.networks.serviceNetworks[legacyGethServiceName];
      delete prevUserSet.networks.serviceNetworks[legacyGethServiceName];
    }

    // migrate envs
    if (prevUserSet.environment) {
      logs.info(`Migrating user settings environment from geth.dnp.dappnode.eth to geth`);
      prevUserSet.environment.geth = prevUserSet.environment[legacyGethServiceName];
      delete prevUserSet.environment[legacyGethServiceName];
    }
  }
}
