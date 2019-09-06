import wrapMethodsWithQueue from "../utils/wrapMethodsWithQueue";
// Modules
import listContainers from "../modules/listContainers";
import docker from "../modules/docker";
import { RpcHandlerReturn } from "../types";

// Retry logs call 3 times, in case it happen during a container reboot
const dockerWithRetry = wrapMethodsWithQueue(
  { log: docker.log },
  { times: 3 },
  { disableChecks: true }
);

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
export default async function logPackage({
  id,
  options
}: {
  id: string;
  options?: { OPTION1: boolean };
}): Promise<RpcHandlerReturn> {
  if (!id) throw Error("kwarg id must be defined");

  const dnpList = await listContainers();
  const dnp = dnpList.find(p => p.name === id);
  if (!dnp) throw Error(`No DNP found for id ${id}`);
  const containerName = dnp.packageName;

  const logs = await dockerWithRetry.log(containerName, options || {});

  return {
    message: `Got logs of ${id}`,
    result: logs
  };
}
