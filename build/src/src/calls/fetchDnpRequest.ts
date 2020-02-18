import { RequestData, ReturnData } from "../route-types/fetchDnpRequest";
import {
  UserSettingsAllDnps,
  CompatibleDnps,
  PackageRelease,
  RpcHandlerReturnWithResult,
  PackageReleaseMetadata,
  PackageContainer,
  SetupWizardAllDnps,
  SetupWizardField
} from "../types";
import getRelease from "../modules/release/getRelease";
import dappGet from "../modules/dappGet";
import { getUserSettingsSafe } from "../utils/dockerComposeFile";
import { mapValues, omit } from "lodash";
import semver from "semver";
import { listContainers } from "../modules/docker/listContainers";
import params from "../params";
import shouldUpdate from "../modules/dappGet/utils/shouldUpdate";
import deepmerge from "deepmerge";
import {
  parseUserSetFromCompose,
  getContainerName
} from "../utils/dockerComposeParsers";
import { fileToGatewayUrl } from "../utils/distributedFile";
import { getReleaseSpecialPermissions } from "../modules/release/parsers/getReleaseSpecialPermissions";
import { dockerInfoArchive } from "../modules/docker/dockerApi";

export default async function fetchDnpRequest({
  id
}: RequestData): RpcHandlerReturnWithResult<ReturnData> {
  const mainRelease = await getRelease(id);

  const setupWizard: SetupWizardAllDnps = {};
  const settings: UserSettingsAllDnps = {};

  const dnpList = await listContainers();

  async function addReleaseToSettings(_release: PackageRelease): Promise<void> {
    const { name, metadata, compose, isCore } = _release;

    const isInstalled = getIsInstalled(mainRelease, dnpList);

    // current user settings overwritte compose
    // If composePath does not exist, or is invalid: getUserSettingsSafe returns {}
    const userSettings = deepmerge(
      parseUserSetFromCompose(compose),
      getUserSettingsSafe(name, isCore)
    );

    if (metadata.setupWizard) {
      const activeSetupWizardFields: SetupWizardField[] = [];
      for (const field of metadata.setupWizard.fields) {
        async function shouldAddSetupWizardField(): Promise<boolean> {
          if (field.target) {
            switch (field.target.type) {
              case "allNamedVolumesMountpoint":
              case "namedVolumeMountpoint":
                // If the package is installed, ignore (all)namedVolumesMountpoint
                return !isInstalled;
              case "fileUpload":
                // If the path of file upload exists, ignore fileUpload
                try {
                  const info = await dockerInfoArchive(
                    getContainerName(name, isCore),
                    field.target.path
                  );
                  return !info.size;
                } catch (e) {
                  // Ignore all errors: 404 Container not found,
                  // 404 path not found, Base64 parsing, JSON parsing, etc.
                }
            }
          }
          return true;
        }
        // Declare and call this function to use a switch / return patten
        if (await shouldAddSetupWizardField())
          activeSetupWizardFields.push(field);
      }
      setupWizard[name] = {
        ...metadata.setupWizard,
        fields: activeSetupWizardFields
      };
    }

    settings[name] = userSettings;
  }

  await addReleaseToSettings(mainRelease);

  // Fetch dependencies
  let compatibleError = "";
  let compatibleDnps: CompatibleDnps = {};
  try {
    const { name, reqVersion } = mainRelease;
    const { state, currentVersion } = await dappGet({ name, ver: reqVersion });
    compatibleDnps = mapValues(state, (nextVersion, dnpName) => ({
      from: currentVersion[dnpName],
      to: nextVersion
    }));

    // Add dependencies' metadata
    for (const [depName, depVersion] of Object.entries(state))
      if (depName !== name)
        await addReleaseToSettings(await getRelease(depName, depVersion));
  } catch (e) {
    compatibleError = e.message;
  }

  // Compute version metadata

  const isInstalled = getIsInstalled(mainRelease, dnpList);
  const isUpdated = getIsUpdated(mainRelease, dnpList);
  const requiresCoreUpdate = getRequiresCoreUpdate(mainRelease, dnpList);
  const specialPermissions = getReleaseSpecialPermissions(mainRelease);

  // Fetch and store avatar
  const avatarUrl = fileToGatewayUrl(mainRelease.avatarFile);

  return {
    message: `Fetched request data of ${id}`,
    result: {
      name: mainRelease.name, // "bitcoin.dnp.dappnode.eth"
      semVersion: mainRelease.semVersion,
      reqVersion: mainRelease.reqVersion,
      origin: mainRelease.origin, // "/ipfs/Qm"
      avatarUrl, // "http://dappmanager.dappnode/avatar/Qm7763518d4";
      // Setup
      setupWizard,
      // Additional data
      imageSize: mainRelease.imageFile.size,
      isUpdated,
      isInstalled,
      // Prevent sending duplicated data
      metadata: omit(mainRelease.metadata, ["setupWizard"]),
      specialPermissions, // Decoupled metadata
      // Settings must include the previous user settings
      settings,
      request: {
        compatible: {
          requiresCoreUpdate,
          resolving: false,
          isCompatible: !compatibleError,
          error: compatibleError,
          dnps: compatibleDnps
        },
        available: {
          isAvailable: true,
          message: "" // "LN image not available";
        }
      }
    }
  };
}

/**
 * Helper to check if a package is installed
 */
export function getIsInstalled(
  { name }: { name: string },
  dnpList: PackageContainer[]
): boolean {
  return !!dnpList.find(dnp => dnp.name === name);
}

/**
 * Helper to check if a package is update to the latest version
 */
export function getIsUpdated(
  { name, reqVersion }: { name: string; reqVersion: string },
  dnpList: PackageContainer[]
): boolean {
  const dnp = dnpList.find(dnp => dnp.name === name);
  if (!dnp) return false;
  return !shouldUpdate(dnp.version, reqVersion);
}

function getRequiresCoreUpdate(
  { metadata }: { metadata: PackageReleaseMetadata },
  dnpList: PackageContainer[]
): boolean {
  const coreDnp = dnpList.find(dnp => dnp.name === params.coreDnpName);
  if (!coreDnp) return false;
  const coreVersion = coreDnp.version;
  const minDnVersion = metadata.requirements
    ? metadata.requirements.minimumDappnodeVersion
    : "";
  return Boolean(
    metadata.requirements &&
      semver.valid(minDnVersion) &&
      semver.valid(coreVersion) &&
      semver.gt(minDnVersion, coreVersion)
  );
}
