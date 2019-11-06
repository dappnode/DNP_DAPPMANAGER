import { RequestData, ReturnData } from "../route-types/fetchDnpRequest";
import {
  SetupSchemaAllDnps,
  SetupUiSchemaAllDnps,
  UserSettingsAllDnps,
  CompatibleDnps,
  PackageRelease,
  RpcHandlerReturnWithResult
} from "../types";
import getRelease from "../modules/release/getRelease";
import dappGet from "../modules/dappGet";
import { mapValues, omit } from "lodash";

export default async function fetchDnpRequest({
  id
}: RequestData): RpcHandlerReturnWithResult<ReturnData> {
  const release = await getRelease(id);

  const setupSchema: SetupSchemaAllDnps = {};
  const setupUiSchema: SetupUiSchemaAllDnps = {};
  const settings: UserSettingsAllDnps = {};

  function addReleaseToSettings(_release: PackageRelease) {
    const { name, metadata } = _release;
    if (metadata.setupSchema) setupSchema[name] = metadata.setupSchema;
    if (metadata.setupUiSchema) setupUiSchema[name] = metadata.setupUiSchema;
  }

  addReleaseToSettings(release);

  let compatibleError = "";
  let compatibleDnps: CompatibleDnps = {};
  try {
    const { state, currentVersion } = await dappGet({
      name: release.name,
      ver: release.version
    });
    compatibleDnps = mapValues(state, (nextVersion, dnpName) => ({
      from: currentVersion[dnpName],
      to: nextVersion
    }));

    for (const [name, version] of Object.entries(state)) {
      if (name === release.name) continue;
      const dependency = await getRelease(name, version);
      addReleaseToSettings(dependency);
    }
  } catch (e) {
    compatibleError = e.message;
  }

  return {
    message: "",
    result: {
      name: release.name, // "bitcoin.dnp.dappnode.eth"
      version: release.origin || release.version, // "0.2.5", "/ipfs/Qm"
      origin: release.origin, // "/ipfs/Qm"
      avatar: "", // "http://dappmanager.dappnode/avatar/Qm7763518d4";
      metadata: release.metadata,
      // Setup wizard
      setupSchema, // SetupSchemaAllDnps;
      setupUiSchema, // SetupUiSchemaAllDnps;
      // Additional data
      imageSize: release.imageFile.size,
      isUpdated: false, // boolean;
      isInstalled: false, // boolean
      // Settings must include the previous user settings
      settings, // UserSettingsAllDnps;
      request: {
        compatible: {
          requiresCoreUpdate: false,
          resolving: false,
          isCompatible: !compatibleError,
          error: compatibleError, // "LN requires incompatible dependency";
          dnps: compatibleDnps
        },
        available: {
          isAvailable: true, // false;
          message: "" // "LN image not available";
        }
      }
    }
  };
}
