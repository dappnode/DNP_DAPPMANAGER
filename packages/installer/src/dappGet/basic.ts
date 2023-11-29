import { listPackages } from "@dappnode/dockerapi";
import { shouldUpdate } from "@dappnode/utils";
// Internal
import { PackageRequest } from "@dappnode/common";
import { logs } from "@dappnode/logger";
import { DappGetResult, DappGetState } from "./types.js";
import { DappGetFetcher } from "./fetch/index.js";
import { DappnodeInstaller } from "../dappnodeInstaller.js";

/**
 * Simple version of `dappGet`, since its resolver may cause errors.
 * Updating the core will never require dependency resolution,
 * therefore for a system update the dappGet resolver will be emitted
 *
 * If `BYPASS_RESOLVER == true`, fetch first level dependencies only
 */
export default async function dappGetBasic(
  dappnodeInstaller: DappnodeInstaller,
  req: PackageRequest
): Promise<DappGetResult> {
  const dappGetFetcher = new DappGetFetcher();
  const dependencies = await dappGetFetcher.dependencies(
    dappnodeInstaller,
    req.name,
    req.ver
  );

  // Append dependencies in the list of DNPs to install
  // Add current request to pacakages to install
  const state = {
    ...dependencies,
    [req.name]: req.ver,
  };
  const alreadyUpdated: DappGetState = {};
  const currentVersions: DappGetState = {};

  // The function below does not directly affect funcionality.
  // However it would prevent already installed DNPs from installing
  try {
    const installedDnps = await listPackages();
    for (const dnp of installedDnps) {
      const prevVersion = dnp.version;
      const nextVersion = state[dnp.dnpName];
      if (nextVersion && !shouldUpdate(prevVersion, nextVersion)) {
        // DNP is already updated.
        // Remove from the success object and add it to the alreadyUpdatedd
        alreadyUpdated[dnp.dnpName] = state[dnp.dnpName];
        delete state[dnp.dnpName];
      }
      if (nextVersion) {
        currentVersions[dnp.dnpName] = prevVersion;
      }
    }
  } catch (e) {
    logs.error("Error listing current containers", e);
  }

  return {
    message: "dappGet basic resolved first level dependencies",
    state,
    alreadyUpdated: {},
    currentVersions,
  };
}
