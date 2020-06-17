import * as eventBus from "../eventBus";

// Modules
import { listContainers } from "../modules/docker/listContainers";
import { dockerDf } from "../modules/docker/dockerApi";
// Utils
import parseDockerSystemDf from "../utils/parseDockerSystemDf";
import { PackageContainer } from "../types";
import { logs } from "../logs";

/**
 * Returns the list of current containers associated to packages
 */
export async function listPackages(): Promise<PackageContainer[]> {
  let dnpList = await listContainers();

  // ##### EMIT data before appending system data
  eventBus.packages.emit(dnpList);

  // Append volume info
  // This call can fail because of:
  //   Error response from daemon: a disk usage operation is already running
  try {
    const dockerSystemDfData = await dockerDf();
    dnpList = parseDockerSystemDf({ dockerSystemDfData, dnpList });
  } catch (e) {
    logs.error("Error on listPackages, appending volume info", e);
  }

  return dnpList;
}
