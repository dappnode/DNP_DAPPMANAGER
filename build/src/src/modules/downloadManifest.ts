import * as ipfs from "./ipfs";
import * as db from "../db";
import { Manifest } from "../types";

const maxLenght = 100e3; // Limit manifest size to ~100KB

/**
 * Handles the download of a JSON DNP manifest.
 * This function handles cache and type validation, while the IPFS
 * stream and download is abstracted away.
 *
 * 1. Check if cache exist and validate it
 * 2. Cat stream to file system
 * 3. Validate downloaded image. Store result in cache
 *
 * @param {string} hash "QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ"
 */
export default async function downloadManifest(
  hash: string
): Promise<Manifest> {
  if (!hash || typeof hash !== "string")
    throw Error(`arg hash must be a string: ${hash}`);

  /**
   * 1. Check if cache exist and validate it
   * The manifest is stored un-parsed. The validate function will
   * parse it and return a valid object if the validation succeeeds
   */
  const manifestStringCache: string = db.get(hash);
  const cacheValidation = validateManifest(manifestStringCache);
  if (cacheValidation.success) return JSON.parse(manifestStringCache);

  /**
   * 2. Cat stream to file system
   * - Make sure the path is correct and the parent folder exist or is created
   */
  const manifestString = await ipfs.cat(hash, { maxLenght });

  /**
   * 3. Validate downloaded image
   * Store the un-parsed manifest in the cache
   */
  const validation = validateManifest(manifestString);
  if (!validation.success)
    throw Error(
      `Downloaded image from ${hash} failed validation: ${validation.message}`
    );
  db.set(hash, manifestString);
  return JSON.parse(manifestString);
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
function validateManifest(
  manifestString: string
): { success: boolean; message: string } {
  if (!manifestString)
    return {
      success: false,
      message: "Empty string"
    };

  try {
    JSON.parse(manifestString);
    return {
      success: true,
      message: ""
    };
  } catch (e) {
    return { success: false, message: "Invalid JSON" };
  }
}
