import { RequestData, ReturnData } from "../route-types/fetchDnpRequest";
import {
  SetupSchemaAllDnps,
  SetupUiJsonAllDnps,
  SetupTargetAllDnps,
  UserSettingsAllDnps,
  CompatibleDnps,
  PackageRelease,
  RpcHandlerReturnWithResult,
  PackageReleaseMetadata,
  PackageContainer
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
import { parseUserSetFromCompose } from "../utils/dockerComposeParsers";
import { fileToGatewayUrl } from "../utils/distributedFile";
import { getReleaseSpecialPermissions } from "../modules/release/parsers/getReleaseSpecialPermissions";

export default async function fetchDnpRequest({
  id
}: RequestData): RpcHandlerReturnWithResult<ReturnData> {
  const mainRelease = await getRelease(id);

  const setupSchema: SetupSchemaAllDnps = {};
  const setupTarget: SetupTargetAllDnps = {};
  const setupUiJson: SetupUiJsonAllDnps = {};
  const settings: UserSettingsAllDnps = {};

  function addReleaseToSettings(_release: PackageRelease): void {
    const { name, metadata, compose, isCore } = _release;
    if (metadata.setupSchema) setupSchema[name] = metadata.setupSchema;
    if (metadata.setupTarget) setupTarget[name] = metadata.setupTarget;
    if (metadata.setupUiJson) setupUiJson[name] = metadata.setupUiJson;
    settings[name] = deepmerge(
      parseUserSetFromCompose(compose), // current user settings overwritte compose
      // If composePath does not exist, or is invalid: returns {}
      getUserSettingsSafe(name, isCore)
    );
  }

  addReleaseToSettings(mainRelease);

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
        addReleaseToSettings(await getRelease(depName, depVersion));
  } catch (e) {
    compatibleError = e.message;
  }

  // Compute version metadata
  const dnpList = await listContainers();
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
      setupSchema,
      setupTarget,
      setupUiJson,
      // Additional data
      imageSize: mainRelease.imageFile.size,
      isUpdated,
      isInstalled,
      // Prevent sending duplicated data
      metadata: omit(mainRelease.metadata, [
        "setupSchema",
        "setupTarget",
        "setupUiJson"
      ]),
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
