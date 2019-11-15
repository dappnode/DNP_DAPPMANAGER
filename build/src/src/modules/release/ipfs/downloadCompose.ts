import * as ipfs from "../../ipfs";
import * as db from "../../../db";
import { ComposeUnsafe } from "../../../types";
import { validateComposeOrUnsafe } from "../parsers/validate";
import { parseComposeObj } from "../../../utils/dockerComposeFile";
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
export default async function downloadCompose(
  hash: string
): Promise<ComposeUnsafe> {
  if (!isIpfsHash(hash)) throw Error(`Release must be an IPFS hash ${hash}`);

  /**
   * 1. Check if cache exist and validate it
   * The manifest is stored un-parsed. The validate function will
   * parse it and return a valid object if the validation succeeeds
   */
  const composeCache = db.composeCache.get(hash);
  if (composeCache && validateComposeOrUnsafe(composeCache).success)
    return composeCache;

  /**
   * 2. Cat stream to file system
   * - Make sure the path is correct and the parent folder exist or is created
   */
  const composeString = await ipfs.catString({ hash, maxLength });
  let composeUnsafe: ComposeUnsafe;
  try {
    composeUnsafe = parseComposeObj(composeString);
  } catch (e) {
    throw Error(`Error parsing compose string: ${e.message}`);
  }

  /**
   * 3. Validate downloaded compose
   * Store the un-parsed manifest in the cache
   */
  const validation = validateComposeOrUnsafe(composeUnsafe);
  if (!validation.success)
    throw Error(
      `Downloaded compose from ${hash} failed validation: ${validation.message}`
    );

  db.composeCache.set(hash, composeUnsafe);
  return composeUnsafe;
}
