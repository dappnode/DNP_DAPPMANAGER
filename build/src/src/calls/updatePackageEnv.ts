import { mergeEnvs } from "../utils/dockerComposeFile";
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

  mergeEnvs(id, envs);

  // External call to calls/restartPackage to prevent code duplication
  if (restart) await restartPackage({ id });

  return {
    message: `Updated envs of ${id} ${restart ? "and restarted" : ""} `,
    logMessage: true,
    userAction: true
  };
}
