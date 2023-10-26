import * as isIPFS from "is-ipfs";

/**
 * Checks if the given string is a valid IPFS CID or path
 *
 * isIPFS.cid('QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o') // true (CIDv0)
 * isIPFS.cid('zdj7WWeQ43G6JJvLWQWZpyHuAMq6uYWRjkBXFad11vE2LHhQ7') // true (CIDv1)
 * isIPFS.cid('noop') // false
 *
 * @param hash
 * @returns
 */
export function isIpfsHash(hash: string): boolean {
  if (!hash || typeof hash !== "string") return false;
  // Correct hash prefix

  // Remove `ipfs/` or `/ipfs/` prefix
  hash = hash.split("ipfs/")[1] || hash;
  // Remove trailing and leading slashes
  hash = hash.replace(/\/+$/, "").replace(/^\/+/, "");
  // Ignore any subpath after the hash
  hash = hash.split("/")[0];

  // Make sure hash if valid
  return isIPFS.cid(hash);
}
