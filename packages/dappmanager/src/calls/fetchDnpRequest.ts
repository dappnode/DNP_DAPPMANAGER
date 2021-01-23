import { mapValues, omit } from "lodash";
import semver from "semver";
import { listPackages } from "../modules/docker/list";
import params from "../params";
import shouldUpdate from "../modules/dappGet/utils/shouldUpdate";
import deepmerge from "deepmerge";
import { fileToGatewayUrl } from "../utils/distributedFile";
import { ReleaseFetcher } from "../modules/release";
import { dockerInfoArchive } from "../modules/docker/api";
import { ComposeEditor, ComposeFileEditor } from "../modules/compose/editor";
import { parseSpecialPermissions } from "../modules/compose/specialPermissions";
import {
  RequestedDnp,
  UserSettingsAllDnps,
  CompatibleDnps,
  PackageRelease,
  PackageReleaseMetadata,
  SetupWizardAllDnps,
  SetupWizardField,
  SpecialPermissionAllDnps,
  InstalledPackageData
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

  const dnpList = await listPackages();

  async function addReleaseToSettings(release: PackageRelease): Promise<void> {
    const { dnpName, metadata, compose, isCore } = release;

    const dnp = dnpList.find(d => d.dnpName === dnpName);
    const isInstalled = Boolean(dnp);

    const defaultUserSet = new ComposeEditor(compose).getUserSettings();
    const prevUserSet = ComposeFileEditor.getUserSettingsIfExist(
      dnpName,
      isCore
    );
    settings[dnpName] = deepmerge(defaultUserSet, prevUserSet);

    specialPermissions[dnpName] = parseSpecialPermissions(compose, isCore);

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
                // If the container and path of file upload exists, ignore fileUpload
                if (dnp) {
                  const serviceName = field.target.service;
                  // Find the container referenced by the target or the first one if unspecified
                  const container = dnp.containers.find(
                    c => !serviceName || c.serviceName === serviceName
                  );
                  if (container)
                    try {
                      const fileInfo = await dockerInfoArchive(
                        container.containerId,
                        field.target.path
                      );
                      return !fileInfo.size;
                    } catch (e) {
                      // Ignore all errors: 404 Container not found,
                      // 404 path not found, Base64 parsing, JSON parsing, etc.
                    }
                }
            }
          }
          return true;
        }
        // Declare and call this function to use a switch / return patten
        if (await shouldAddSetupWizardField())
          activeSetupWizardFields.push(field);
      }
      setupWizard[dnpName] = {
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
    const { dnpName, reqVersion } = mainRelease;
    const {
      state,
      currentVersions,
      releases
    } = await releaseFetcher.getReleasesResolved({
      name: dnpName,
      ver: reqVersion
    });
    compatibleDnps = mapValues(state, (nextVersion, dnpName) => ({
      from: currentVersions[dnpName],
      to: nextVersion
    }));

    // Add dependencies' metadata
    for (const release of releases)
      if (release.dnpName !== dnpName) await addReleaseToSettings(release);
  } catch (e) {
    compatibleError = e.message;
  }

  return {
    dnpName: mainRelease.dnpName, // "bitcoin.dnp.dappnode.eth"
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
  { dnpName }: { dnpName: string },
  dnpList: InstalledPackageData[]
): boolean {
  return !!dnpList.find(dnp => dnp.dnpName === dnpName);
}

/**
 * Helper to check if a package is update to the latest version
 */
export function getIsUpdated(
  { dnpName, reqVersion }: { dnpName: string; reqVersion: string },
  dnpList: InstalledPackageData[]
): boolean {
  const dnp = dnpList.find(dnp => dnp.dnpName === dnpName);
  if (!dnp) return false;
  return !shouldUpdate(dnp.version, reqVersion);
}

function getRequiresCoreUpdate(
  { metadata }: { metadata: PackageReleaseMetadata },
  dnpList: InstalledPackageData[]
): boolean {
  const coreDnp = dnpList.find(dnp => dnp.dnpName === params.coreDnpName);
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
