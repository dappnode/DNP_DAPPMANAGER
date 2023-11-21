import fs from "fs";
import { isAbsolute } from "path";
import { shell, validatePath, getImageTag } from "@dappnode/utils";
import downloadImage from "./ipfs/downloadImage.js";
import { DistributedFile } from "@dappnode/common";
import { dockerImageManifest } from "@dappnode/dockerapi";

export default async function getImage(
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
      await downloadImage(hash, path, size, progress);
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
 * Verify that the docker image tar.xz:
 * - Contains only one image
 * - Has the expected name
 */
export async function verifyDockerImage({
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
  const images = await dockerImageManifest(imagePath);
  for (const image of images) {
    for (const repoTag of image.RepoTags) {
      if (!repoTag.endsWith(expectedTagSuffix))
        throw Error(`Invalid image tag '${repoTag}' for ${dnpName} ${version}`);
    }
  }
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
function verifyXz(
  xzFilePath: string
): Promise<{
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
