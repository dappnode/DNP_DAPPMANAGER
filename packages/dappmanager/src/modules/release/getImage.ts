import fs from "fs";
import { isAbsolute } from "path";
import * as validate from "../../utils/validate";
import verifyXz from "../../utils/verifyXz";
import downloadImage from "./ipfs/downloadImage";
import { DistributedFile } from "../../types";
import { dockerImageManifest } from "../docker/dockerCommands";

export default async function getImage(
  imageFile: DistributedFile,
  path: string,
  progress: (n: number) => void
): Promise<void> {
  // Validate parameters
  if (!path || path.startsWith("/ipfs/") || !isAbsolute("/"))
    throw Error(`Invalid path: "${path}"`);
  validate.path(path);

  // Check if cache exist and validate it
  try {
    await validateTarImage(path);
    return; // Image OK
  } catch (e) {
    // Continue, bad image
  }

  switch (imageFile.source) {
    case "ipfs":
      const { hash, size } = imageFile;
      await downloadImage(hash, path, size, progress);
      break;
    default:
      throw Error(`Unsupported source ${imageFile.source}`);
  }

  // Validate downloaded image
  await validateTarImage(path).catch(e => {
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
  name,
  version
}: {
  imagePath: string;
  name: string;
  version: string;
}): Promise<void> {
  const images = await dockerImageManifest(imagePath);
  if (images.length !== 1)
    throw Error("image tarball must contain strictly one image");
  const imageTag = images[0].RepoTags[0];
  const expectedTag = `${name}:${version}`;
  if (imageTag !== expectedTag) {
    throw Error(`Wrong image tag ${imageTag}`);
  }
}
