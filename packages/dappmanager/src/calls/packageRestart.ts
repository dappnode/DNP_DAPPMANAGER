import fs from "fs";
import params from "../params";
import { eventBus } from "../eventBus";
import * as getPath from "../utils/getPath";
import { dockerContainerRestart, dockerComposeUp } from "../modules/docker";
import { listPackage } from "../modules/docker/list";
import { restartDappmanagerPatch } from "../modules/installer/restartPatch";
import { packageInstalledHasPid } from "../modules/compose/pid";
import { ComposeFileEditor } from "../modules/compose/editor";

/**
 * Recreates a package containers
 */
export async function packageRestart({
  dnpName,
  serviceNames
}: {
  dnpName: string;
  serviceNames?: string[];
}): Promise<void> {
  if (!dnpName) throw Error("kwarg dnpName must be defined");

  const dnp = await listPackage({ dnpName });

  // DAPPMANAGER patch
  if (dnp.dnpName === params.dappmanagerDnpName) {
    const composePath = getPath.dockerComposeSmart(dnpName);
    if (!fs.existsSync(composePath))
      throw Error(`No docker-compose found for ${dnpName} at ${composePath}`);
    return await restartDappmanagerPatch({ composePath });
  }

  // `docker-compose up --force-recreate` whole package if pid
  // present in compose, otherwise it will crashed
  if (packageInstalledHasPid(dnp)) {
    const composePath = new ComposeFileEditor(dnpName, dnp.isCore);
    await dockerComposeUp(composePath.composePath, { forceRecreate: true });
  } else {
    const targetContainers = dnp.containers.filter(
      c => !serviceNames || serviceNames.includes(c.serviceName)
    );

    if (targetContainers.length === 0) {
      const queryId = [dnpName, ...(serviceNames || [])].join(", ");
      throw Error(`No targetContainers found for ${queryId}`);
    }

    await Promise.all(
      targetContainers.map(async c =>
        dockerContainerRestart(c.containerName, { timeout: c.dockerTimeout })
      )
    );
  }

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: [dnpName] });
}
