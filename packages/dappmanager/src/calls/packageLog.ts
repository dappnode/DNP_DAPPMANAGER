import { listContainer } from "../modules/docker/listContainers";
import { logContainer } from "../modules/docker/dockerApi";

/**
 * Returns the logs of the docker container of a package
 */
export async function packageLog({
  id,
  options
}: {
  id: string;
  options?: { timestamps?: boolean; tail?: number };
}): Promise<string> {
  if (!id) throw Error("kwarg id must be defined");

  const dnp = await listContainer(id);
  const containerName = dnp.packageName;

  return await logContainer(containerName, options);
}
