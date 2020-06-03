import { InstallPackageData } from "../../common/types";
import { Log } from "../../utils/logUi";
import getImage, { verifyDockerImage } from "../release/getImage";
import { logs } from "../../logs";

/**
 * Download the .tar.xz docker image of each package in paralel
 * After each download verify that the image is ok and contains
 * only the expected image layers
 */
export async function downloadImages(
  packagesData: InstallPackageData[],
  log: Log
): Promise<void> {
  await Promise.all(
    packagesData.map(async function(pkg) {
      const { name, semVersion, isCore, imageFile, imagePath } = pkg;
      log(name, "Starting download...");

      function onProgress(progress: number): void {
        let message = `Downloading ${progress}%`;
        if (progress > 100) message += ` (expected ${imageFile.size} bytes)`;
        log(name, message);
      }

      try {
        await getImage(imageFile, imagePath, onProgress);
      } catch (e) {
        e.message = `Can't download ${name} image: ${e.message}`;
        throw e; // Use this format to keep the stack trace
      }

      // Do not throw for core packages
      log(name, "Verifying download...");
      try {
        await verifyDockerImage({ imagePath, name, version: semVersion });
      } catch (e) {
        const errorMessage = `Error verifying image: ${e.message}`;
        if (isCore) logs.error(errorMessage);
        else throw Error(errorMessage);
      }

      log(name, "Package downloaded");
    })
  );
}
