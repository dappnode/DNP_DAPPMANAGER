import * as ipfs from "../../ipfs";
import * as db from "../../../db";
import formatAndCompressAvatar from "../../../utils/formatAndCompressAvatar";
import { validateAvatar } from "../validate";
import { isIpfsHash } from "../../../utils/validate";

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

export default async function downloadAvatar(hash: string): Promise<string> {
  if (!isIpfsHash(hash)) throw Error(`Release must be an IPFS hash ${hash}`);

  /**
   * 1. Check if cache exist and validate it
   */
  const avatarCache = db.ipfsCache.get(hash);
  if (avatarCache && validateAvatar(avatarCache).success) return avatarCache;

  /**
   * 2. Cat stream to file system
   * Data from IPFS is the image buffer. It must be stringified as base64
   * and prepend the mime type
   */
  let avatarBuffer;
  try {
    avatarBuffer = await ipfs.cat({ hash });
  } catch (e) {
    e.message = `Can't download avatar: ${e.message}`;
    throw e;
  }

  const avatar = await formatAndCompressAvatar(avatarBuffer);

  /**
   * 3. Validate downloaded image
   * Store the compressed avatar in cache
   */
  const validation = validateAvatar(avatar);
  if (!validation.success)
    throw Error(
      `Downloaded image from ${hash} failed validation: ${validation.message}`
    );

  db.ipfsCache.set(hash, avatar);
  return avatar;
}
