import {
  InstalledPackageDataApiReturn,
  InstalledPackageData
} from "@dappnode/common";
import { logs } from "../../../logs.js";
import { dockerContainerStop } from "../../docker/index.js";

/**
 * Stop all the containers from a given package dnpName
 */
export async function stopAllPkgContainers(
  pkg: InstalledPackageDataApiReturn | InstalledPackageData
): Promise<void> {
  await Promise.all(
    pkg.containers
      .filter(c => c.running)
      .map(async c =>
        dockerContainerStop(c.containerName, { timeout: c.dockerTimeout })
      )
  ).catch(e => logs.error(e.message));
}
