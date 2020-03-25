import { ethers } from "ethers";
import { fetchDependenciesSetup } from "./fetch";
import { listContainers } from "../docker/listContainers";
// Internal
import { PackageRequest } from "../../types";
import shouldUpdate from "./utils/shouldUpdate";
import Logs from "../../logs";
import { DappGetResult, DappGetState } from "./types";
const logs = Logs(module);

/**
 * Simple version of `dappGet`, since its resolver may cause errors.
 * Updating the core will never require dependency resolution,
 * therefore for a system update the dappGet resolver will be emitted
 *
 * If `BYPASS_RESOLVER == true`, fetch first level dependencies only
 */
export default async function dappGetBasic(
  req: PackageRequest,
  provider: ethers.providers.Provider
): Promise<DappGetResult> {
  const fetchDependencies = fetchDependenciesSetup(provider);
  const dependencies = await fetchDependencies(req.name, req.ver);

  // Append dependencies in the list of DNPs to install
  // Add current request to pacakages to install
  const state = {
    ...dependencies,
    [req.name]: req.ver
  };
  const alreadyUpdated: DappGetState = {};
  const currentVersion: DappGetState = {};

  // The function below does not directly affect funcionality.
  // However it would prevent already installed DNPs from installing
  try {
    const installedDnps = await listContainers();
    for (const dnp of installedDnps) {
      const prevVersion = dnp.version;
      const nextVersion = state[dnp.name];
      if (nextVersion && !shouldUpdate(prevVersion, nextVersion)) {
        // DNP is already updated.
        // Remove from the success object and add it to the alreadyUpdatedd
        alreadyUpdated[dnp.name] = state[dnp.name];
        delete state[dnp.name];
      }
      if (nextVersion && currentVersion) {
        currentVersion[dnp.name] = prevVersion;
      }
    }
  } catch (e) {
    logs.error(`Error listing current containers: ${e.stack}`);
  }

  return {
    message: "dappGet basic resolved first level dependencies",
    state,
    alreadyUpdated: {},
    currentVersion
  };
}
