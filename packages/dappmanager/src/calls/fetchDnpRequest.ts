import { mapValues, omit } from "lodash-es";
import semver from "semver";
import { Manifest, SetupWizardField } from "@dappnode/dappnodesdk";
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
  SpecialPermissionAllDnps,
  SetupWizardAllDnps,
  PackageRelease,
  CompatibleDnps,
  InstalledPackageData,
  ReleaseSignatureStatusCode
} from "@dappnode/common";

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
  const signedSafe: RequestedDnp["signedSafe"] = {};

  const dnpList = await listPackages();

  async function addReleaseToSettings(release: PackageRelease): Promise<void> {
    const { dnpName, metadata, compose, isCore } = release;

    const dnp = dnpList.find(d => d.dnpName === dnpName);

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
        if (await shouldAddSetupWizardField(field, dnp))
          activeSetupWizardFields.push(field);
      }
      setupWizard[dnpName] = {
        ...metadata.setupWizard,
        fields: activeSetupWizardFields
      };
    }

    // if origin is falsy, the hash is fetched from the blockchain, otherwise from IPFS directly
    signedSafe[dnpName] = {
      safe: release.signedSafe,
      message: getReleaseSignedSafeMessage(release)
    };
  }

  await addReleaseToSettings(mainRelease);

  // Fetch dependencies
  let compatibleError = "";
  let compatibleDnps: CompatibleDnps = {};
  try {
    const { dnpName, reqVersion } = mainRelease;
    const { state, currentVersions, releases } =
      await releaseFetcher.getReleasesResolved({
        name: dnpName,
        ver: reqVersion
      });
    compatibleDnps = mapValues(state, (nextVersion, dnpName) => ({
      from: currentVersions[dnpName],
      to: nextVersion
    }));

    // Add dependencies' metadata
    for (const release of releases)
      if (release.dnpName !== dnpName) {
        await addReleaseToSettings(release);
      }
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
    },

    signedSafe,
    signedSafeAll: Object.values(signedSafe).every(r => r.safe === true)
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
  { metadata }: { metadata: Manifest },
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

async function shouldAddSetupWizardField(
  field: SetupWizardField,
  dnp: InstalledPackageData | undefined
): Promise<boolean> {
  if (!field.target) {
    return true;
  }

  switch (field.target.type) {
    case "allNamedVolumesMountpoint":
    case "namedVolumeMountpoint":
      // If the package is installed, ignore (all)namedVolumesMountpoint
      return !dnp; // isInstalled = Boolean(dnp)

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

    default:
      return true;
  }
}

function getReleaseSignedSafeMessage(release: PackageRelease): string {
  const { signatureStatus, signedSafe } = release;
  switch (signatureStatus.status) {
    case ReleaseSignatureStatusCode.signedByKnownKey:
      return `Signed by known key ${signatureStatus.keyName}`;

    case ReleaseSignatureStatusCode.notSigned:
      if (signedSafe) {
        return "Safe origin, not signed";
      } else {
        return "Unsafe origin, not signed";
      }

    case ReleaseSignatureStatusCode.signedByUnknownKey:
      if (signedSafe) {
        return "Safe origin, bad signature";
      } else {
        return "Unsafe origin, bad signature";
      }
  }
}
