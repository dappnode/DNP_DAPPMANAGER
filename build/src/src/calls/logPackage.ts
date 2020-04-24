import { listContainer } from "../modules/docker/listContainers";
import { logContainer } from "../modules/docker/dockerApi";

/**
 * Returns the logs of the docker container of a package
 *
 * @param {string} id DNP .eth name
 * @param {object} options log options
 * - timestamp {bool}: Show timestamps
 * - tail {number}: Number of lines to return from bottom
 * options = { timestamp: true, tail: 200 }
 * @returns {string} logs: <string with escape codes>
 */
export async function logPackage({
  id,
  options
}: {
  id: string;
  options?: { timestamp: boolean; tail: number };
}): Promise<string> {
  if (!id) throw Error("kwarg id must be defined");

  const dnp = await listContainer(id);
  const containerName = dnp.packageName;

  return await logContainer(containerName, options);
}
