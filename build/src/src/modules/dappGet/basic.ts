import getDependencies from "../release/getDependencies";
import { listContainers } from "../docker/listContainers";
// Internal
import { PackageRequest } from "../../types";
import shouldUpdate from "./utils/shouldUpdate";
import Logs from "../../logs";
import { DappGetResult } from "./types";
const logs = Logs(module);

/**
 * Simple version of `dappGet`, since its resolver may cause errors.
 * Updating the core will never require dependency resolution,
 * therefore for a system update the dappGet resolver will be emitted
 *
 * If `BYPASS_RESOLVER == true`, fetch first level dependencies only
 */
export default async function dappGetBasic(
  req: PackageRequest
): Promise<DappGetResult> {
  const dependencies = await getDependencies(req.name, req.ver);

  // Append dependencies in the list of DNPs to install
  // Add current request to pacakages to install
  const state = {
    ...dependencies,
    [req.name]: req.ver
  };

  // The function below does not directly affect funcionality.
  // However it would prevent already installed DNPs from installing
  try {
    const installedDnps = await listContainers();
    for (const dnp of installedDnps) {
      const currentVersion = dnp.version;
      const newVersion = state[dnp.name];
      if (newVersion && !shouldUpdate(currentVersion, newVersion))
        delete state[dnp.name];
    }
  } catch (e) {
    logs.error(`Error listing current containers: ${e.stack}`);
  }

  return {
    message: "dappGet basic resolved first level dependencies",
    state,
    alreadyUpdated: {}
  };
}
