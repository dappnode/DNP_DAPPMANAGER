import { listPackage } from "../modules/docker/listContainers";
import { dockerStart, dockerStop } from "../modules/docker/dockerCommands";
import * as eventBus from "../eventBus";
import { getDockerTimeoutMax } from "../modules/docker/utils";

/**
 * Stops or starts a package containers
 * @param timeout seconds to stop the package
 */
export async function packageStartStop({
  dnpName,
  serviceNames
}: {
  dnpName: string;
  serviceNames?: string[];
}): Promise<void> {
  if (!dnpName) throw Error("kwarg containerName must be defined");

  const dnp = await listPackage({ dnpName });
  const timeout = getDockerTimeoutMax(dnp.containers);

  const targetContainers = dnp.containers.filter(
    c => !serviceNames || serviceNames.includes(c.serviceName)
  );

  if (targetContainers.length === 0) {
    const queryId = [dnpName, ...(serviceNames || [])].join(", ");
    throw Error(`No targetContainers found for ${queryId}`);
  }

  const containerNames = targetContainers.map(c => c.containerName);
  if (targetContainers.every(container => container.running))
    await dockerStop(containerNames, { time: timeout });
  else await dockerStart(containerNames);

  // Emit packages update
  eventBus.requestPackages.emit();
}
