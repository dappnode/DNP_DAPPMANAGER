import { listPackage } from "../modules/docker/list";
import { dockerContainerStop, dockerContainerStart } from "../modules/docker";
import { eventBus } from "../eventBus";
import params from "../params";
import {
  packageInstalledHasPid,
  pushDependantPidContainers
} from "../utils/pid";
import { ComposeFileEditor } from "../modules/compose/editor";

const dnpsAllowedToStop = [
  params.ipfsDnpName,
  params.wifiDnpName,
  params.HTTPS_PORTAL_DNPNAME
];

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
  const { compose } = new ComposeFileEditor(dnp.dnpName, dnp.isCore);

  if (dnp.isCore || dnp.dnpName === params.dappmanagerDnpName) {
    if (dnpsAllowedToStop.includes(dnp.dnpName)) {
      // whitelisted, ok to stop
    } else {
      throw Error("Core packages cannot be stopped");
    }
  }

  let targetContainers = dnp.containers.filter(
    c => !serviceNames || serviceNames.includes(c.serviceName)
  );

  if (targetContainers.length === 0) {
    const queryId = [dnpName, ...(serviceNames || [])].join(", ");
    throw Error(`No targetContainers found for ${queryId}`);
  }

  // Push dependandt PID containers if needed
  if (packageInstalledHasPid(compose)) {
    targetContainers = pushDependantPidContainers(
      compose,
      dnp,
      targetContainers
    );
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
