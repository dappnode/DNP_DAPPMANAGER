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
 */
export default async function updatePackageEnv({
  id,
  envs
}: {
  id: string;
  envs: PackageEnvs;
}): RpcHandlerReturn {
  if (!id) throw Error("kwarg id must be defined");
  if (!envs) throw Error("kwarg envs must be defined");

  mergeEnvs(id, envs);

  await restartPackage({ id });

  return {
    message: `Updated ENVs of ${id}`,
    logMessage: true,
    userAction: true
  };
}
