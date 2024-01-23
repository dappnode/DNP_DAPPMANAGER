import { mapValues, omit } from "lodash-es";
import { valid, gt } from "semver";
import { params } from "@dappnode/params";
import deepmerge from "deepmerge";
import {
  fileToGatewayUrl,
  getIsUpdated,
  getIsInstalled
} from "@dappnode/utils";
import { dappnodeInstaller } from "../index.js";
import { dockerInfoArchive, listPackages } from "@dappnode/dockerapi";
import {
  ComposeEditor,
  ComposeFileEditor,
  parseSpecialPermissions
} from "@dappnode/dockercompose";
import {
  RequestedDnp,
  UserSettingsAllDnps,
  SpecialPermissionAllDnps,
  SetupWizardAllDnps,
  PackageRelease,
  CompatibleDnps,
  InstalledPackageData,
  ReleaseSignatureStatusCode,
  Manifest,
  SetupWizardField
} from "@dappnode/common";

export async function fetchDnpRequest({
  id
}: {
  id: string;
}): Promise<RequestedDnp> {
  const mainRelease = await dappnodeInstaller.getRelease(id);

  const settings: UserSettingsAllDnps = {};
  const specialPermissions: SpecialPermissionAllDnps = {};
  const setupWizard: SetupWizardAllDnps = {};
  const signedSafe: RequestedDnp["signedSafe"] = {};

  const dnpList = await listPackages();

  async function addReleaseToSettings(release: PackageRelease): Promise<void> {
    const { dnpName, compose, isCore } = release;

    const dnp = dnpList.find(d => d.dnpName === dnpName);

    const defaultUserSet = new ComposeEditor(compose).getUserSettings();
    const prevUserSet = ComposeFileEditor.getUserSettingsIfExist(
      dnpName,
      isCore
    );
    settings[dnpName] = deepmerge(defaultUserSet, prevUserSet);

    specialPermissions[dnpName] = parseSpecialPermissions(compose, isCore);

    if (release.setupWizard) {
      const activeSetupWizardFields: SetupWizardField[] = [];
      for (const field of release.setupWizard.fields) {
        if (await shouldAddSetupWizardField(field, dnp))
          activeSetupWizardFields.push(field);
      }
      setupWizard[dnpName] = {
        ...release.setupWizard,
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
      await dappnodeInstaller.getReleasesResolved({
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
    manifest: omit(mainRelease.manifest, ["setupWizard"]),
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

function getRequiresCoreUpdate(
  { manifest }: { manifest: Manifest },
  dnpList: InstalledPackageData[]
): boolean {
  const coreDnp = dnpList.find(dnp => dnp.dnpName === params.coreDnpName);
  if (!coreDnp) return false;
  const coreVersion = coreDnp.version;
  const minDnVersion = manifest.requirements
    ? manifest.requirements.minimumDappnodeVersion
    : "";
  return Boolean(
    manifest.requirements &&
      valid(minDnVersion) &&
      valid(coreVersion) &&
      gt(minDnVersion, coreVersion)
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
      return true;

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
