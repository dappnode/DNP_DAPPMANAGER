import { InstallPackageData } from "../../types";
import { Log } from "../../utils/logUi";
import { dockerLoad } from "../docker/dockerCommands";

/**
 * Load the docker image .tar.xz. file of each package
 * Do this AFTER all downloads but BEFORE starting any package to prevent inconsistencies.
 * If a dependency fails, some future version of another DNP could be loaded
 * creating wierd bugs with unstable versions
 */
export async function loadImages(
  packagesData: InstallPackageData[],
  log: Log
): Promise<void> {
  await Promise.all(
    packagesData.map(async function({ dnpName, imagePath }) {
      log(dnpName, "Loading image...");
      await dockerLoad(imagePath);
      log(dnpName, "Package Loaded");
    })
  );
}
