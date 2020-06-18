import { packageRestart } from "./packageRestart";
import { PackageEnvs } from "../types";
import { listContainer } from "../modules/docker/listContainers";
import { ComposeFileEditor } from "../modules/compose/editor";

/**
 * Updates the .env file of a package. If requested, also re-ups it
 *
 * @param {string} id DNP .eth name
 * @param {object} envs environment variables
 * envs = {
 *   ENV_NAME: ENV_VALUE
 * }
 */
export async function packageSetEnvironment({
  id,
  envs
}: {
  id: string;
  envs: PackageEnvs;
}): Promise<void> {
  if (!id) throw Error("kwarg id must be defined");
  if (!envs) throw Error("kwarg envs must be defined");

  const dnp = await listContainer(id);
  const compose = new ComposeFileEditor(dnp.name, dnp.isCore);
  compose.service().mergeEnvs(envs);
  compose.write();

  await packageRestart({ id });
}
