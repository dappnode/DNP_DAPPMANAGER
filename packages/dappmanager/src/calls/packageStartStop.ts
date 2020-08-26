import { listContainer } from "../modules/docker/listContainers";
import { dockerStart, dockerStop } from "../modules/docker/dockerCommands";
import * as eventBus from "../eventBus";

/**
 * Stops or starts after fetching its status
 *
 * @param containerName Name of a docker container
 * @param timeout seconds to stop the package
 */
export async function packageStartStop({
  containerName,
  timeout = 10
}: {
  containerName: string;
  timeout?: number;
}): Promise<void> {
  if (!containerName) throw Error("kwarg containerName must be defined");

  const container = await listContainer(containerName);
  if (container.running) await dockerStop(containerName, { t: timeout });
  else await dockerStart(containerName);

  // Emit packages update
  eventBus.requestPackages.emit();
}
