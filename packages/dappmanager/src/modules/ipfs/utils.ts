import { isIpfsHash } from "../../utils/validate";

/**
 * Reformat the hash, some methods do not tolerate the /ipfs/ prefix
 */
export function sanitizeIpfsHash(hash: string): string {
  if (!isIpfsHash(hash)) throw Error(`Invalid IPFS hash: ${hash}`);

  return hash.split("ipfs/")[1] || hash;
}

/**
 * ky specific timeout errors https://github.com/sindresorhus/ky/blob/2f37c3f999efb36db9108893b8b3d4b3a7f5ec45/index.js#L127-L132
 */
export function handleIpfsError(e: Error, hash: string): never {
  if (e.name === "TimeoutError" || e.message.includes("timed out")) {
    throw Error(`IPFS hash not available ${hash}`);
  } else {
    throw Error(`IPFS hash not available ${hash}: ${e.message}`);
  }
}
