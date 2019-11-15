import * as ipfs from "../../ipfs";
import * as db from "../../../db";
import { Manifest } from "../../../types";
import { validateManifestBasic } from "../parsers/validate";
import { isIpfsHash } from "../../../utils/validate";

const maxLength = 100e3; // Limit manifest size to ~100KB

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
  if (!isIpfsHash(hash)) throw Error(`Release must be an IPFS hash ${hash}`);

  /**
   * 1. Check if cache exist and validate it
   * The manifest is stored un-parsed. The validate function will
   * parse it and return a valid object if the validation succeeeds
   */
  const manifestCache = db.manifestCache.get(hash);
  if (manifestCache && validateManifestBasic(manifestCache).success)
    return manifestCache;

  /**
   * 2. Cat stream to file system
   * - Make sure the path is correct and the parent folder exist or is created
   */
  const manifestString = await ipfs.catString({ hash, maxLength });
  let manifest: Manifest;
  try {
    manifest = JSON.parse(manifestString);
  } catch (e) {
    throw Error(`Error parsing manifest string: ${e.message}`);
  }

  /**
   * 3. Validate downloaded manifest
   * Store the un-parsed manifest in the cache
   */
  const validation = validateManifestBasic(manifest);
  if (!validation.success)
    throw Error(`Invalid manifest from ${hash}: ${validation.message}`);

  db.manifestCache.set(hash, manifest);
  return manifest;
}
