import { eventBus } from "@dappnode/eventbus";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import {
  getContainersStatus,
  dockerComposeUpPackage,
  listPackage,
} from "@dappnode/dockerapi";
import { packageInstalledHasPid, getDockerComposePath } from "@dappnode/utils";
import { PackageEnvs } from "@dappnode/common";
import { params } from "@dappnode/params";
import { restartDappmanagerPatch } from "../installer/index.js";

/**
 * Updates the .env file of a package. If requested, also re-ups it
 */
export async function packageSetEnvironment({
  dnpName,
  environmentByService,
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

  const containersStatus = await getContainersStatus({ dnpName });
  // Packages sharing PID or must be recreated:
  // - Packages sharing PID must be recreated to ensure startup order
  // DAPPMANAGER patch
  if (dnpName === params.dappmanagerDnpName) {
    // Note: About restartPatch, combining rm && up doesn't prevent the installer from crashing
    await restartDappmanagerPatch({
      composePath: getDockerComposePath(params.dappmanagerDnpName, true),
    });
    return;
  } else {
    await dockerComposeUpPackage({ dnpName }, containersStatus, {
      forceRecreate: packageInstalledHasPid(compose.compose),
    });
  }

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: [dnpName] });
}
