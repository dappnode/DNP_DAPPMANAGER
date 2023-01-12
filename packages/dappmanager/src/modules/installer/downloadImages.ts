import { InstallPackageData } from "@dappnode/common";
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
    packagesData.map(async function (pkg) {
      const { dnpName, semVersion, isCore, imageFile, imagePath } = pkg;
      log(dnpName, "Starting download...");

      function onProgress(progress: number): void {
        let message = `Downloading ${progress}%`;
        if (progress > 100) message += ` (expected ${imageFile.size} bytes)`;
        log(dnpName, message);
      }

      try {
        await getImage(imageFile, imagePath, onProgress);
      } catch (e) {
        e.message = `Can't download ${dnpName} image: ${e.message}`;
        throw e; // Use this format to keep the stack trace
      }

      // Do not throw for core packages
      log(dnpName, "Verifying download...");
      try {
        await verifyDockerImage({ imagePath, dnpName, version: semVersion });
      } catch (e) {
        const errorMessage = `Error verifying image: ${e.message}`;
        if (isCore) logs.error(errorMessage);
        else throw Error(errorMessage);
      }

      log(dnpName, "Package downloaded");
    })
  );
}
