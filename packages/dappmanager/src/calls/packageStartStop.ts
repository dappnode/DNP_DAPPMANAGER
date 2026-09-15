import { listPackage } from "@dappnode/dockerapi";
import { dockerContainerStop, dockerContainerStart } from "@dappnode/dockerapi";
import { eventBus } from "@dappnode/eventbus";
import { params } from "@dappnode/params";
import { getServicesSharingPid } from "@dappnode/utils";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import { InstalledPackageData, PackageContainer } from "@dappnode/types";

const dnpsAllowedToStop = [params.ipfsDnpName, params.wifiDnpName, params.HTTPS_PORTAL_DNPNAME, params.notificationsDnpName];

/**
 * Only stopping is restricted: core packages and the dappmanager can be
 * stopped when whitelisted, but a stopped one can always be started again.
 * Checking before knowing the action also refused starts, so a core package
 * that went down (docker stop, crash) could not be brought back from the UI.
 */
export function assertStartStopAllowed(
  dnp: Pick<InstalledPackageData, "dnpName" | "isCore">,
  action: "start" | "stop"
): void {
  if (action === "start") return;
  const isProtected = dnp.isCore || dnp.dnpName === params.dappmanagerDnpName;
  if (isProtected && !dnpsAllowedToStop.includes(dnp.dnpName)) throw Error("Core packages cannot be stopped");
}

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

  const targetContainers = dnp.containers.filter((c) => !serviceNames || serviceNames.includes(c.serviceName));

  if (targetContainers.length === 0) {
    const queryId = [dnpName, ...(serviceNames || [])].join(", ");
    throw Error(`No targetContainers found for ${queryId}`);
  }

  const action = targetContainers.every((container) => container.running) ? "stop" : "start";
  assertStartStopAllowed(dnp, action);

  const servicesSharingPid = getServicesSharingPid(compose, targetContainers);

  if (servicesSharingPid) {
    const targetContainersPid = dnp.containers.filter((c) =>
      servicesSharingPid.targetPidServices.includes(c.serviceName)
    );
    const dependantContainersPid = dnp.containers.filter((c) =>
      servicesSharingPid.dependantPidServices.includes(c.serviceName)
    );

    if (action === "stop") {
      // STOP: first stop dependatPid containers (pid must exist), second stop targetPid containers
      await containersStop(dependantContainersPid);
      await containersStop(targetContainersPid);
    } else {
      // START: first start targetPid containers, second start dependantPid containers (pid must exist)
      await containersStart(targetContainersPid);
      await containersStart(dependantContainersPid);
    }
  } else {
    if (action === "stop") {
      await containersStop(targetContainers);
    } else {
      await containersStart(targetContainers);
    }
  }

  // Emit packages update
  eventBus.requestPackages.emit();
}

// Utils

async function containersStop(targetContainers: PackageContainer[]): Promise<void> {
  await Promise.all(
    targetContainers.map(async (c) => dockerContainerStop(c.containerName, { timeout: c.dockerTimeout }))
  );
}

async function containersStart(targetContainers: PackageContainer[]): Promise<void> {
  await Promise.all(targetContainers.map(async (container) => dockerContainerStart(container.containerName)));
}
