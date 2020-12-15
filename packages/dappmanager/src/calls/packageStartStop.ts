import { listPackage } from "../modules/docker/list";
import { dockerStart, dockerStop } from "../modules/docker/cli";
import * as eventBus from "../eventBus";
import { getDockerTimeoutMax } from "../modules/docker/utils";
import params from "../params";

const dnpsAllowedToStop = [params.ipfsDnpName, params.wifiDnpName];

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

  if (dnp.isCore || dnp.dnpName === params.dappmanagerDnpName) {
    if (dnpsAllowedToStop.includes(dnp.dnpName)) {
      // whitelisted, ok to stop
    } else {
      throw Error("Core packages cannot be stopped");
    }
  }

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
