import getManifest from "../../modules/getManifest";
import listContainers from "../../modules/listContainers";
// Internal
import { PackageRequest } from "../../types";
import shouldUpdate from "./utils/shouldUpdate";
import Logs from "../../logs";
import { ResultInterface } from "./types";
const logs = Logs(module);

/**
 * The dappGet resolver may cause errors.
 * Updating the core will never require dependency resolution,
 * therefore for a system update the dappGet resolver will be emitted
 *
 * If BYPASS_RESOLVER == true, just fetch the first level dependencies of the request
 */

export default async function dappGetBasic(
  req: PackageRequest
): Promise<ResultInterface> {
  const reqManifest = await getManifest(req);
  // reqManifest.dependencies = {
  //     'bind.dnp.dappnode.eth': '0.1.4',
  //     'admin.dnp.dappnode.eth': '/ipfs/Qm...',
  // }

  // Append dependencies in the list of DNPs to install
  // Add current request to pacakages to install
  const state = {
    ...((reqManifest || {}).dependencies || {}),
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
