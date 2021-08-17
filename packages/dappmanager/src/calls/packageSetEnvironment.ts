import { PackageEnvs } from "../types";
import { eventBus } from "../eventBus";
import { listPackage } from "../modules/docker/list";
import { ComposeFileEditor } from "../modules/compose/editor";
import {
  getContainersStatus,
  dockerComposeUpPackage,
  dockerComposeUp,
  dockerComposeRm
} from "../modules/docker";
import { packageInstalledHasPid } from "../modules/compose/pid";

/**
 * Updates the .env file of a package. If requested, also re-ups it
 */
export async function packageSetEnvironment({
  dnpName,
  environmentByService
}: {
  dnpName: string;
  environmentByService: { [serviceName: string]: PackageEnvs };
}): Promise<void> {
  if (!dnpName) throw Error("kwarg dnpName must be defined");
  if (!environmentByService) throw Error("kwarg environment must be defined");

  const dnp = await listPackage({ dnpName });
  const compose = new ComposeFileEditor(dnp.dnpName, dnp.isCore);
  const services = compose.services();

  for (const [serviceName, environment] of Object.entries(
    environmentByService
  )) {
    const service = services[serviceName];
    if (!service) throw Error(`No service ${serviceName} in dnp ${dnpName}`);
    service.mergeEnvs(environment);
  }

  compose.write();

  // Packages sharing namespace (pid) MUST be treated as one container
  if (packageInstalledHasPid(dnp)) {
    const { composePath } = new ComposeFileEditor(dnpName, dnp.isCore);
    if (!composePath)
      throw Error(`Not able to find compose path for dnp: ${dnpName}`);
    // Editing envs for the service sharing the PID will result into critical errors
    // First remove the existing containers and then recreate them
    await dockerComposeRm(composePath);
    await dockerComposeUp(composePath, { forceRecreate: true });
  } else {
    const containersStatus = await getContainersStatus({ dnpName });
    await dockerComposeUpPackage({ dnpName }, containersStatus);
  }

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: [dnpName] });
}
