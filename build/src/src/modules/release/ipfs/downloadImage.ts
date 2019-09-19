import * as ipfs from "../../ipfs";
import * as validate from "../../../utils/validate";
import { isAbsolute } from "path";
import { validateImage } from "../validate";

/**
 * Handles the download of a DNP .xz image.
 * This function handles cache and type validation, while the IPFS
 * stream and download is abstracted away.
 *
 * 1. Check if cache exist and validate it
 * 2. Cat stream to file system
 * 3. Validate downloaded image. Cache is automatically created at ${path}
 *
 * @param {string} hash "QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ"
 * @param {string} path "/usr/src/path-to-file/file.ext"
 * @param {string} options see "modules/ipfs/methods/catStreamToFs"
 */

export default async function downloadImage(
  hash: string,
  path: string,
  fileSize: number,
  progress: (n: number) => void
): Promise<void> {
  if (!hash || typeof hash !== "string")
    throw Error(`arg hash must be a string: ${hash}`);

  /**
   * 0. Validate parameters
   */
  if (!path || path.startsWith("/ipfs/") || !isAbsolute("/"))
    throw Error(`Invalid path: "${path}"`);
  validate.path(path);

  /**
   * 1. Check if cache exist and validate it
   */
  const cacheValidation = await validateImage(path);
  if (cacheValidation.success) return;

  /**
   * 2. Cat stream to file system
   * - Make sure the path is correct and the parent folder exist or is created
   */
  await ipfs.catStreamToFs({ hash, path, fileSize, progress });

  /**
   * 3. Validate downloaded image
   */
  const validation = await validateImage(path);
  if (!validation.success)
    throw Error(
      `Downloaded image from ${hash} to ${path} failed validation: ${
        validation.message
      }`
    );
}
