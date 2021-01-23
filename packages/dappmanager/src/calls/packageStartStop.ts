import { listPackage } from "../modules/docker/list";
import { dockerContainerStop, dockerContainerStart } from "../modules/docker";
import { eventBus } from "../eventBus";
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

  if (targetContainers.every(container => container.running)) {
    await Promise.all(
      targetContainers.map(async c =>
        dockerContainerStop(c.containerName, { timeout: c.dockerTimeout })
      )
    );
  } else {
    await Promise.all(
      targetContainers.map(async container =>
        dockerContainerStart(container.containerName)
      )
    );
  }

  // Emit packages update
  eventBus.requestPackages.emit();
}
