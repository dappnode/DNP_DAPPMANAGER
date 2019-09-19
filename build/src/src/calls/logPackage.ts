import { runWithRetry } from "../utils/asyncFlows";
// Modules
import { listContainer } from "../modules/docker/listContainers";
import { dockerLogs } from "../modules/docker/dockerCommands";
import { RpcHandlerReturn } from "../types";

// Retry logs call 3 times, in case it happen during a container reboot
const dockerLogsRetry = runWithRetry(
  ({
    containerNameOrId,
    ...options
  }: {
    containerNameOrId: string;
    timestamps?: boolean;
    tail?: number;
  }) => dockerLogs(containerNameOrId, options),
  { times: 3 }
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
  options?: { timestamp: boolean; tail: number };
}): Promise<RpcHandlerReturn> {
  if (!id) throw Error("kwarg id must be defined");

  const dnp = await listContainer(id);
  const containerName = dnp.packageName;

  const logs = await dockerLogsRetry({
    containerNameOrId: containerName,
    ...(options || {})
  });

  return {
    message: `Got logs of ${id}`,
    result: logs
  };
}
