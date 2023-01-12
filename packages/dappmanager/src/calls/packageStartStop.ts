import { listPackage } from "../modules/docker/list";
import { dockerContainerStop, dockerContainerStart } from "../modules/docker";
import { eventBus } from "../eventBus";
import params from "../params";
import { getServicesSharingPid } from "../utils/pid";
import { ComposeFileEditor } from "../modules/compose/editor";
import { PackageContainer } from "@dappnode/common";

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

  const targetContainers = dnp.containers.filter(
    c => !serviceNames || serviceNames.includes(c.serviceName)
  );

  if (targetContainers.length === 0) {
    const queryId = [dnpName, ...(serviceNames || [])].join(", ");
    throw Error(`No targetContainers found for ${queryId}`);
  }

  const servicesSharingPid = getServicesSharingPid(compose, targetContainers);

  if (servicesSharingPid) {
    const targetContainersPid = dnp.containers.filter(c =>
      servicesSharingPid.targetPidServices.includes(c.serviceName)
    );
    const dependantContainersPid = dnp.containers.filter(c =>
      servicesSharingPid.dependantPidServices.includes(c.serviceName)
    );

    if (targetContainers.every(container => container.running)) {
      // STOP: first stop dependatPid containers (pid must exist), second stop targetPid containers
      await containersStop(dependantContainersPid);
      await containersStop(targetContainersPid);
    } else {
      // START: first start targetPid containers, second start dependantPid containers (pid must exist)
      await containersStart(targetContainersPid);
      await containersStart(dependantContainersPid);
    }
  } else {
    if (targetContainers.every(container => container.running)) {
      await containersStop(targetContainers);
    } else {
      await containersStart(targetContainers);
    }
  }

  // Emit packages update
  eventBus.requestPackages.emit();
}

// Utils

async function containersStop(
  targetContainers: PackageContainer[]
): Promise<void> {
  await Promise.all(
    targetContainers.map(async c =>
      dockerContainerStop(c.containerName, { timeout: c.dockerTimeout })
    )
  );
}

async function containersStart(
  targetContainers: PackageContainer[]
): Promise<void> {
  await Promise.all(
    targetContainers.map(async container =>
      dockerContainerStart(container.containerName)
    )
  );
}
