import { InstallPackageData } from "../../types";
import { Log } from "../../utils/logUi";
import { loadImage } from "../docker/api";
import { dockerImageManifest } from "../docker/cli";

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
      await loadImageWithProgress(imagePath, message => log(dnpName, message));
      log(dnpName, "Package Loaded");
    })
  );
}

/**
 * Logs image load progress without knowing the total uncompress image size
 * Assumes all image layers have the same size
 */
async function loadImageWithProgress(
  imagePath: string,
  log: (message: string) => void
): Promise<void> {
  const imageManifests = await dockerImageManifest(imagePath);
  const imageLayers = (imageManifests[0] || {}).Layers || [];
  const layerCount = imageLayers.length;
  const seenLayers = new Set<string>();
  let lastPercent = -1;

  await loadImage(imagePath, event => {
    const { id: layerId, progressDetail } = event || {};
    const { current, total } = progressDetail || {};

    seenLayers.add(layerId);

    if (
      Number.isInteger(current) &&
      Number.isInteger(total) &&
      layerCount > 0
    ) {
      const layerProgress = current / total;
      const totalProgress =
        (seenLayers.size - 1) / layerCount + layerProgress / layerCount;
      const roundedPercent = Math.round(100 * totalProgress);
      if (lastPercent !== roundedPercent) {
        log(`Loading image ${roundedPercent}%`);
        lastPercent = roundedPercent;
      }
    }
  });
}
