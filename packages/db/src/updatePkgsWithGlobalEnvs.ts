import { eventBus } from "@dappnode/eventbus";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import { getContainersStatus, dockerComposeUpPackage, listPackage, listPackageContainers } from "@dappnode/dockerapi";
import { packageInstalledHasPid } from "@dappnode/utils";
import { PackageEnvs } from "@dappnode/types";
import { params } from "@dappnode/params";
import { logs } from "@dappnode/logger";

/**
 * Find, update and restart all the dappnode packages that contains the given global env.
 *
 * globalEnvs can be used with:
 * 1. Global env file (https://docs.docker.com/compose/environment-variables/#the-env_file-configuration-option): in this case the pkgs only needs to be restarted to make the changes take effect
 * 2. Global envs in environment (https://docs.docker.com/compose/environment-variables/#pass-environment-variables-to-containers): in this case the pkgs needs to be updated and restarted to make the changes take effect
 *
 * TODO: find a proper way to restart pkgs with global envs defined in the env_file (through manifest > globalEnvs = {all: true})
 */
export async function updatePkgsWithGlobalEnvs(globalEnvKey: string, globEnvValue: string): Promise<void> {
  const packages = await listPackageContainers();

  const pkgsWithGlobalEnv = packages.filter(
    (pkg) => pkg.defaultEnvironment && Object.keys(pkg.defaultEnvironment).some((key) => key === globalEnvKey)
  );

  if (pkgsWithGlobalEnv.length === 0) return;

  for (const pkg of pkgsWithGlobalEnv) {
    if (pkg.dnpName === params.dappmanagerDnpName) continue;
    if (!pkg.defaultEnvironment) continue;
    const compose = new ComposeFileEditor(pkg.dnpName, pkg.isCore);
    const services = Object.values(compose.services());
    const environmentsByService: { [serviceName: string]: PackageEnvs }[] = [];
    for (const service of services) {
      const serviceEnvs = service.getEnvs();
      if (globalEnvKey in serviceEnvs) {
        environmentsByService.push({
          [pkg.serviceName]: { [globalEnvKey]: globEnvValue }
        });
      }
    }
    if (environmentsByService.length === 0) continue;
    const environmentByService: {
      [serviceName: string]: PackageEnvs;
    } = environmentsByService.reduce((acc, curr) => ({ ...acc, ...curr }), {});

    await packageSetEnvironment({
      dnpName: pkg.dnpName,
      environmentByService
    }).catch((err) => {
      logs.error(`Error updating ${pkg.dnpName} with global env ${globalEnvKey}=${globEnvValue}`);
      logs.error(err);
    });
  }
}

/**
 * This is a copy of packages/dappmanager/src/calls/packageSetEnvironment.ts
 * but without the restartDappmanagerPatch call
 * Updates the .env file of a package. If requested, also re-ups it
 */
async function packageSetEnvironment({
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

  for (const [serviceName, environment] of Object.entries(environmentByService)) {
    const service = services[serviceName];
    if (!service) throw Error(`No service ${serviceName} in dnp ${dnpName}`);
    service.mergeEnvs(environment);
  }

  compose.write();

  const containersStatus = await getContainersStatus({ dnpName });
  // Packages sharing PID or must be recreated:
  // - Packages sharing PID must be recreated to ensure startup order
  await dockerComposeUpPackage({
    composeArgs: { dnpName },
    upAll: false,
    containersStatus,
    dockerComposeUpOptions: {
      forceRecreate: packageInstalledHasPid(compose.compose)
    }
  });
  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: [dnpName] });
}
