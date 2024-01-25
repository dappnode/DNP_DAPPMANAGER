import fs from "fs";
import { isAbsolute } from "path";
import { InstallPackageData, DistributedFile } from "@dappnode/types";
import { Log, logs } from "@dappnode/logger";
import { shell, validatePath, getImageTag } from "@dappnode/utils";
import { getDockerImageManifest } from "@dappnode/dockerapi";
import { DappnodeInstaller } from "../dappnodeInstaller.js";

/**
 * Download the .tar.xz docker image of each package in paralel
 * After each download verify that the image is ok and contains
 * only the expected image layers
 */
export async function downloadImages(
  dappnodeInstaller: DappnodeInstaller,
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
        await getImage(dappnodeInstaller, imageFile, imagePath, onProgress);
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

/**
 * Handles the download of a DNP .xz image.
 * This function handles cache and type validation, while the IPFS
 * stream and download is abstracted away.
 *
 * 1. Check if cache exist and validate it
 * 2. Cat stream to file system
 * 3. Validate downloaded image. Cache is automatically created at ${path}
 *
 * @param hash "QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ"
 * @param path "/usr/src/path-to-file/file.ext"
 * @param options see "modules/ipfs/methods/catStreamToFs"
 */

export async function downloadImage(
  dappnodeInstaller: DappnodeInstaller,
  hash: string,
  path: string,
  fileSize: number,
  progress: (n: number) => void
): Promise<void> {
  // TODO: Ensure file is available

  // Cat stream to file system
  // Make sure the path is correct and the parent folder exist or is created
  await dappnodeInstaller.writeFileToFs({ hash, path, fileSize, progress });
}

export async function getImage(
  dappnodeInstaller: DappnodeInstaller,
  imageFile: DistributedFile,
  path: string,
  progress: (n: number) => void
): Promise<void> {
  // Validate parameters
  if (!path || path.startsWith("/ipfs/") || !isAbsolute("/"))
    throw Error(`Invalid path: "${path}"`);
  validatePath(path);

  // Check if cache exist and validate it
  try {
    await validateTarImage(path);
    return; // Image OK
  } catch (e) {
    // Continue, bad image
  }

  const { hash, size } = imageFile;

  switch (imageFile.source) {
    case "ipfs":
      await downloadImage(dappnodeInstaller, hash, path, size, progress);
      break;
    default:
      throw Error(`Unsupported source ${imageFile.source}`);
  }

  // Validate downloaded image
  await validateTarImage(path).catch((e) => {
    throw Error(
      `Downloaded image from ${imageFile.hash} to ${path} failed validation: ${e.message}`
    );
  });
}

/**
 * Verify that the docker image tar.xz:
 * - Contains only one image
 * - Has the expected name
 */
async function verifyDockerImage({
  imagePath,
  dnpName,
  version,
}: {
  imagePath: string;
  dnpName: string;
  version: string;
}): Promise<void> {
  const expectedTagSuffix = getImageTag({
    dnpName,
    serviceName: dnpName,
    version,
  });
  const images = await getDockerImageManifest(imagePath);
  for (const image of images) {
    for (const repoTag of image.RepoTags) {
      if (!repoTag.endsWith(expectedTagSuffix))
        throw Error(`Invalid image tag '${repoTag}' for ${dnpName} ${version}`);
    }
  }
}

/**
 * Validates a .xz DNP image by:
 *
 * 1. Checks the path exists
 * 2. Checks the file at path has a size > 0 bytes
 * 3. Runs the command `xz -t` which does a compression validation
 */
export async function validateTarImage(path: string): Promise<void> {
  // Verify that the file exists
  if (!fs.existsSync(path)) throw Error("File not found");

  if (fs.statSync(path).size == 0) throw Error("File size is 0 bytes");

  const { success, message } = await verifyXz(path);
  if (!success) throw Error(`Invalid .xz: ${message}`);
}

/**
 * Verify a compressed .xz file
 *
 * @param PATH file path: ./dir/file.tar.xz
 * @returns:
 * - If the `xz -t` succeeds, returns true
 * - If the file is missing, returns false
 * - If the file is not a .xz, returns false
 * - If the file is corrupted, returns false
 */
async function verifyXz(xzFilePath: string): Promise<{
  success: boolean;
  message: string;
}> {
  return shell(`xz -t ${xzFilePath}`)
    .then(() => ({
      success: true,
      message: "",
    }))
    .catch((e: Error) => ({
      success: false,
      message: e.message,
    }));
}
