import * as ipfs from "../../ipfs";
import * as db from "../../../db";
import { ComposeUnsafe } from "../../../types";
import { validateCompose } from "../validate";
import yaml from "yamljs";

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
export default async function downloadCompose(
  hash: string
): Promise<ComposeUnsafe> {
  if (!hash || typeof hash !== "string")
    throw Error(`arg hash must be a string: ${hash}`);

  /**
   * 1. Check if cache exist and validate it
   * The manifest is stored un-parsed. The validate function will
   * parse it and return a valid object if the validation succeeeds
   */
  const composeCache = db.getComposeCache(hash);
  if (composeCache && validateCompose(composeCache).success)
    return composeCache;

  /**
   * 2. Cat stream to file system
   * - Make sure the path is correct and the parent folder exist or is created
   */
  const composeString = await ipfs.catString({ hash, maxLength });
  let composeUnsafe: ComposeUnsafe;
  try {
    composeUnsafe = yaml.parse(composeString);
  } catch (e) {
    throw Error(`Error parsing compose string: ${e.message}`);
  }

  /**
   * 3. Validate downloaded compose
   * Store the un-parsed manifest in the cache
   */
  const validation = validateCompose(composeUnsafe);
  if (!validation.success)
    throw Error(
      `Downloaded compose from ${hash} failed validation: ${validation.message}`
    );

  db.setComposeCache(hash, composeUnsafe);
  return composeUnsafe;
}
