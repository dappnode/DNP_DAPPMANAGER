import { eventBus } from "../eventBus";
import { listPackage } from "../modules/docker/list";
import { ComposeFileEditor } from "../modules/compose/editor";
import {
  getContainersStatus,
  dockerComposeUpPackage,
  dockerComposeDown
} from "../modules/docker";
import { packageInstalledHasPid } from "../utils/pid";
import { PackageEnvs } from "@dappnode/dappnodesdk";
import { logs } from "../logs";
import * as getPath from "../utils/getPath";
import fs from "fs";

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

  const containersStatus = await getContainersStatus({ dnpName });
  // Packages sharing PID or must be recreated:
  // - Packages sharing PID must be recreated to ensure startup order
  await dockerComposeUpPackage({ dnpName }, containersStatus, {
    forceRecreate: packageInstalledHasPid(compose.compose)
  }).catch(async e => {
    if (
      e.message.includes(
        "Renaming a container with the same name as its current name"
      )
    ) {
      // Catch error: Error response from daemon: Renaming a container with the same name as its current name
      // Ref: https://github.com/docker/compose/issues/6704
      logs.info("Catch error renaming container with the same name");

      // Retry with forceRecreate
      await dockerComposeUpPackage({ dnpName }, containersStatus, {
        forceRecreate: true
      }).catch(async () => {
        // Do compose down and compose up
        const composePath = getPath.dockerCompose(dnp.dnpName, false);
        if (fs.existsSync(composePath)) {
          await dockerComposeDown(composePath);
          await dockerComposeUpPackage({ dnpName }, containersStatus);
        }
      });
    } else {
      throw e;
    }
  });

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: [dnpName] });
}
