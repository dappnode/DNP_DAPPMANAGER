import { mapValues, omit } from "lodash";
import semver from "semver";
import { listContainers } from "../modules/docker/listContainers";
import params from "../params";
import shouldUpdate from "../modules/dappGet/utils/shouldUpdate";
import deepmerge from "deepmerge";
import { fileToGatewayUrl } from "../utils/distributedFile";
import { ReleaseFetcher } from "../modules/release";
import { dockerInfoArchive } from "../modules/docker/dockerApi";
import { ComposeEditor, ComposeFileEditor } from "../modules/compose/editor";
import { parseSpecialPermissions } from "../modules/compose/specialPermissions";
import {
  RequestedDnp,
  UserSettingsAllDnps,
  CompatibleDnps,
  PackageRelease,
  PackageReleaseMetadata,
  PackageContainer,
  SetupWizardAllDnps,
  SetupWizardField,
  SpecialPermissionAllDnps
} from "../types";

export async function fetchDnpRequest({
  id
}: {
  id: string;
}): Promise<RequestedDnp> {
  const releaseFetcher = new ReleaseFetcher();

  const mainRelease = await releaseFetcher.getRelease(id);

  const settings: UserSettingsAllDnps = {};
  const specialPermissions: SpecialPermissionAllDnps = {};
  const setupWizard: SetupWizardAllDnps = {};

  const dnpList = await listContainers();

  async function addReleaseToSettings(release: PackageRelease): Promise<void> {
    const { name, metadata, compose, isCore } = release;

    const container = dnpList.find(_dnp => _dnp.name === name);
    const isInstalled = Boolean(container);

    const defaultUserSet = new ComposeEditor(compose).getUserSettings();
    const prevUserSet = ComposeFileEditor.getUserSettingsIfExist(name, isCore);
    const userSettings = deepmerge(defaultUserSet, prevUserSet);
    settings[name] = userSettings[name];

    specialPermissions[name] = parseSpecialPermissions(compose, isCore);

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
                // If the container nad path of file upload exists, ignore fileUpload
                if (container)
                  try {
                    const fileInfo = await dockerInfoArchive(
                      container.id,
                      field.target.path
                    );
                    return !fileInfo.size;
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
  }

  await addReleaseToSettings(mainRelease);

  // Fetch dependencies
  let compatibleError = "";
  let compatibleDnps: CompatibleDnps = {};
  try {
    const { name, reqVersion } = mainRelease;
    const {
      state,
      currentVersion,
      releases
    } = await releaseFetcher.getReleasesResolved({
      name,
      ver: reqVersion
    });
    compatibleDnps = mapValues(state, (nextVersion, dnpName) => ({
      from: currentVersion[dnpName],
      to: nextVersion
    }));

    // Add dependencies' metadata
    for (const release of releases)
      if (release.name !== name) await addReleaseToSettings(release);
  } catch (e) {
    compatibleError = e.message;
  }

  return {
    name: mainRelease.name, // "bitcoin.dnp.dappnode.eth"
    semVersion: mainRelease.semVersion,
    reqVersion: mainRelease.reqVersion,
    origin: mainRelease.origin, // "/ipfs/Qm"
    avatarUrl: fileToGatewayUrl(mainRelease.avatarFile),
    // Setup
    setupWizard,
    // Additional data
    imageSize: mainRelease.imageFile.size,
    isUpdated: getIsUpdated(mainRelease, dnpList),
    isInstalled: getIsInstalled(mainRelease, dnpList),
    // Prevent sending duplicated data
    metadata: omit(mainRelease.metadata, ["setupWizard"]),
    specialPermissions, // Decoupled metadata
    // Settings must include the previous user settings
    settings,
    request: {
      compatible: {
        // Compute version metadata
        requiresCoreUpdate: getRequiresCoreUpdate(mainRelease, dnpList),
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
