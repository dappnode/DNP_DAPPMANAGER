import deepmerge from "deepmerge";
import { orderInstallPackages } from "./orderInstallPackages.js";
import {
  ComposeEditor,
  ComposeFileEditor,
  parseVolumeMappings,
  stringifyVolumeMappings
} from "@dappnode/dockercompose";
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
import { getBackupPath, getDockerComposePath, getImagePath, getManifestPath, isNotFoundError } from "@dappnode/utils";
import { gt } from "semver";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";

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
  const compose = new ComposeEditor(release.compose, { dnpName });
  compose.applyUserSettings(nextUserSet, { dnpName });

  // Persist critical dappmanager env vars and volume paths across updates
  persistDappmanagerSettings(compose, dnpName, isCore);

  // Persist critical core env vars and volume paths across updates
  persistCoreSettings(compose, dnpName, isCore);

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
          // Apply notifications user settings if any otherwise use the default manifest notifications
          notifications: notificationsSettings ?? release.manifest.notifications
        }
      : manifest,
    // User settings to be applied by the installer
    fileUploads: userSettings?.fileUploads,
    dockerTimeout,
    containersStatus
  };
}

/**
 * When updating the dappmanager package, certain environment variables and volume
 * settings from the currently installed compose must be preserved, even if the new
 * compose being installed doesn't define them. This ensures:
 * - DISABLE_HOST_SCRIPTS is not lost during upgrades
 * - DAPPNODE_CORE_DIR is not lost during upgrades
 * - The DNCORE volume bind mount uses the correct host path from DAPPNODE_CORE_DIR
 */
export function persistDappmanagerSettings(compose: ComposeEditor, dnpName: string, isCore: boolean): void {
  if (dnpName !== params.dappmanagerDnpName) return;

  // Read the currently installed compose to get persisted env values
  let installedCompose: ComposeFileEditor;
  try {
    installedCompose = new ComposeFileEditor(dnpName, isCore);
  } catch (e) {
    if (!isNotFoundError(e)) throw e;
    // Fresh install - no existing compose to read from
    logs.info("No installed dappmanager compose found, skipping settings persistence");
    return;
  }

  const envsToPreserve = ["DISABLE_HOST_SCRIPTS", "DAPPNODE_CORE_DIR"];
  const DNCORE_CONTAINER_PATH = "/usr/src/app/DNCORE";

  // Collect env values from the installed compose services
  const installedEnvs: Record<string, string> = {};
  for (const serviceEditor of Object.values(installedCompose.services())) {
    const envs = serviceEditor.getEnvs();
    for (const envName of envsToPreserve) {
      if (envs[envName] !== undefined && envs[envName] !== "") {
        installedEnvs[envName] = envs[envName];
      }
    }
  }

  if (Object.keys(installedEnvs).length === 0) return;

  logs.info("Persisting dappmanager settings from installed compose", installedEnvs);

  // Apply persisted envs and volume mapping to new compose services
  for (const serviceEditor of Object.values(compose.services())) {
    // Merge preserved envs into the new compose (installed values take priority)
    const envsToInject: Record<string, string> = {};
    for (const envName of envsToPreserve) {
      if (installedEnvs[envName] !== undefined) {
        envsToInject[envName] = installedEnvs[envName];
      }
    }
    if (Object.keys(envsToInject).length > 0) {
      serviceEditor.mergeEnvs(envsToInject);
    }

    // Update the DNCORE volume host path to match DAPPNODE_CORE_DIR
    if (installedEnvs["DAPPNODE_CORE_DIR"]) {
      const dncoreHostDir = installedEnvs["DAPPNODE_CORE_DIR"];
      const service = serviceEditor.get();
      if (service.volumes) {
        const volumeMappings = parseVolumeMappings(service.volumes);
        const updatedVolumes = volumeMappings.map((vol) => {
          // Match the volume whose container side is /usr/src/app/DNCORE
          if (vol.container === DNCORE_CONTAINER_PATH) {
            return { ...vol, host: dncoreHostDir, name: undefined };
          }
          return vol;
        });
        service.volumes = stringifyVolumeMappings(updatedVolumes);
      }
    }
  }
}

/**
 * When updating the core package, certain environment variables and volume
 * settings from the currently installed dappmanager compose must be propagated.
 * This ensures:
 * - DISABLE_HOST_SCRIPTS is present in the core compose environment
 * - The /usr/src/dappnode/ volume bind mount uses the correct host path from DAPPNODE_CORE_DIR
 */
export function persistCoreSettings(compose: ComposeEditor, dnpName: string, _isCore: boolean): void {
  if (dnpName !== params.coreDnpName) return;

  // Read the currently installed dappmanager compose to get env values
  let installedDappmanagerCompose: ComposeFileEditor;
  try {
    installedDappmanagerCompose = new ComposeFileEditor(params.dappmanagerDnpName, true);
  } catch (e) {
    if (!isNotFoundError(e)) throw e;
    logs.info("No installed dappmanager compose found, skipping core settings persistence");
    return;
  }

  const DAPPNODE_CONTAINER_PATH = "/usr/src/dappnode";

  // Collect env values from the installed dappmanager compose services
  const installedEnvs: Record<string, string> = {};
  for (const serviceEditor of Object.values(installedDappmanagerCompose.services())) {
    const envs = serviceEditor.getEnvs();
    if (envs["DISABLE_HOST_SCRIPTS"] !== undefined && envs["DISABLE_HOST_SCRIPTS"] !== "") {
      installedEnvs["DISABLE_HOST_SCRIPTS"] = envs["DISABLE_HOST_SCRIPTS"];
    }
    if (envs["DAPPNODE_CORE_DIR"] !== undefined && envs["DAPPNODE_CORE_DIR"] !== "") {
      installedEnvs["DAPPNODE_CORE_DIR"] = envs["DAPPNODE_CORE_DIR"];
    }
  }

  if (Object.keys(installedEnvs).length === 0) return;

  logs.info("Persisting core settings from installed dappmanager compose", installedEnvs);

  // Apply persisted envs and volume mapping to new core compose services
  for (const serviceEditor of Object.values(compose.services())) {
    // Merge DISABLE_HOST_SCRIPTS into the core compose
    if (installedEnvs["DISABLE_HOST_SCRIPTS"]) {
      serviceEditor.mergeEnvs({ DISABLE_HOST_SCRIPTS: installedEnvs["DISABLE_HOST_SCRIPTS"] });
    }

    // Remove /etc:/etc volume when DISABLE_HOST_SCRIPTS is enabled.
    // This bind mount is not needed when host scripts are disabled and causes
    // Docker failures on non-Linux platforms (e.g., macOS) because Docker cannot
    // create its internal mountpoints (/etc/hostname, /etc/hosts) inside a bind-mounted /etc
    if (installedEnvs["DISABLE_HOST_SCRIPTS"] === "true") {
      const service = serviceEditor.get();
      if (service.volumes) {
        const volumeMappings = parseVolumeMappings(service.volumes);
        const filteredVolumes = volumeMappings.filter((vol) => vol.container !== "/etc");
        if (filteredVolumes.length !== volumeMappings.length) {
          service.volumes = stringifyVolumeMappings(filteredVolumes);
        }
      }
    }

    // Update the /usr/src/dappnode/ volume host path to match DAPPNODE_CORE_DIR
    if (installedEnvs["DAPPNODE_CORE_DIR"]) {
      const dappnodeHostDir = installedEnvs["DAPPNODE_CORE_DIR"];
      const service = serviceEditor.get();
      if (service.volumes) {
        const volumeMappings = parseVolumeMappings(service.volumes);
        const updatedVolumes = volumeMappings.map((vol) => {
          // Match the volume whose container side is /usr/src/dappnode/
          if (vol.container === DAPPNODE_CONTAINER_PATH) {
            return { ...vol, host: dappnodeHostDir, name: undefined };
          }
          return vol;
        });
        service.volumes = stringifyVolumeMappings(updatedVolumes);
      }
    }
  }
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
