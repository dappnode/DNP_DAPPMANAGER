import downloadManifest from "../modules/downloadManifest";
import listContainers from "../modules/listContainers";
// Utils
import * as parse from "../utils/parse";
import * as envsHelper from "../utils/envsHelper";
// External call
import restartPackage from "./restartPackage";
import { PackageEnvs, RpcHandlerReturn } from "../types";

/**
 * Updates the .env file of a package. If requested, also re-ups it
 *
 * @param {string} id DNP .eth name
 * @param {object} envs environment variables
 * envs = {
 *   ENV_NAME: ENV_VALUE
 * }
 * @param {bool} restart flag to restart the DNP
 */
export default async function updatePackageEnv({
  id,
  envs,
  restart
}: {
  id: string;
  envs: PackageEnvs;
  restart: boolean;
}): Promise<RpcHandlerReturn> {
  if (!id) throw Error("kwarg id must be defined");
  if (!envs) throw Error("kwarg envs must be defined");

  id = parse.packageReq(id).name; // parsing anyway for safety
  if ((id || "").startsWith("/ipfs/")) {
    try {
      const manifest = await downloadManifest(id); // ##### TODO: WTF is this?
      id = manifest.name;
    } catch (e) {
      throw Error(
        `Could not retrieve package name from manifest of ${id}: ${e.stack}`
      );
    }
  }

  const dnpList = await listContainers({ byName: id });
  const dnp = dnpList[0];
  if (!dnp) throw Error(`No DNP was found for name ${id}`);

  // Write envs
  const previousEnvs = envsHelper.load(id, dnp.isCore);
  envsHelper.write(id, dnp.isCore, { ...previousEnvs, ...envs });

  // External call to calls/restartPackage to prevent code duplication
  if (restart) await restartPackage({ id });

  return {
    message: `Updated envs of ${id} ${restart ? "and restarted" : ""} `,
    logMessage: true,
    userAction: true
  };
}
