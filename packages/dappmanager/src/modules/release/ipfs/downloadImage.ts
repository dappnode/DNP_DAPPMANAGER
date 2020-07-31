import * as ipfs from "../../ipfs";
import { isIpfsHash } from "../../../utils/validate";

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
  if (!isIpfsHash(hash)) throw Error(`Release must be an IPFS hash ${hash}`);

  // Cat stream to file system
  // Make sure the path is correct and the parent folder exist or is created
  await ipfs.catStreamToFs({ hash, path, fileSize, progress });
}
