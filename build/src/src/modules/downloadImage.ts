import fs from "fs";
import * as ipfs from "./ipfs";
import verifyXz from "../utils/verifyXz";
import * as validate from "../utils/validate";
import { isAbsolute } from "path";
import Logs from "../logs";
const logs = Logs(module);

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
  options?: {}
) {
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
  await ipfs.catStreamToFs(hash, path, options);

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

/**
 * Validates a .xz DNP image. It will test
 *
 * 1. The file at path exists
 * 2. The file at path has a size > 0 bytes
 * 3. Test against `xz -t` validation, ensuring it's ok
 *
 * @param {string} path
 * @returns {object} A result object, so it doesn't have to be handled with try / catch
 * {
 *   success: true, {bool}
 *   message: "File size is 0 bytes" {string}
 * }
 */
async function validateImage(path: string) {
  // Verify that the file exists
  if (!fs.existsSync(path))
    return { success: false, message: "File not found" };

  if (fs.statSync(path).size == 0)
    return { success: false, message: "File size is 0 bytes" };

  const { success, message } = await verifyXz(path);
  if (!success) {
    logs.warn(`Image at ${path} failed .xz verification: ${message}`);
    return { success: false, message: `Invalid .xz: ${message}` };
  }

  // If all okay, return success
  return { success: true };
}
