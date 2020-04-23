import { ReturnData } from "../route-types/listPackages";
import * as eventBus from "../eventBus";
import * as db from "../db";
// Modules
import { listContainers } from "../modules/docker/listContainers";
import { dockerDf } from "../modules/docker/dockerApi";
// Utils
import { omit } from "lodash";
import parseDockerSystemDf from "../utils/parseDockerSystemDf";
import Logs from "../logs";
import { readConfigFiles } from "../utils/configFiles";
const logs = Logs(module);

/**
 * Returns the list of current containers associated to packages
 */
export default async function listPackages(): Promise<ReturnData> {
  let dnpList = await listContainers();

  // Append envFile and manifest
  dnpList.map(dnp => {
    try {
      const { manifest, environment } = readConfigFiles(dnp);
      if (manifest) {
        dnp.manifest = omit(manifest, ["gettingStarted"]);
        dnp.gettingStarted = manifest.gettingStarted;
      }
      dnp.envs = environment;
      dnp.gettingStartedShow = Boolean(
        db.packageGettingStartedShow.get(dnp.name)
      );
    } catch (e) {
      logs.warn(`Error appending ${dnp.name} files: ${e.stack || e.message}`);
    }
  });

  // ##### EMIT data before appending system data
  eventBus.packages.emit(dnpList);

  // Append volume info
  // This call can fail because of:
  //   Error response from daemon: a disk usage operation is already running
  try {
    const dockerSystemDfData = await dockerDf();
    dnpList = parseDockerSystemDf({ dockerSystemDfData, dnpList });
  } catch (e) {
    logs.error(`Error on listPackages, appending volume info: ${e.stack}`);
  }

  return dnpList;
}
