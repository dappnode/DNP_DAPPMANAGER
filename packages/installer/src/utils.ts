import * as isIPFS from "is-ipfs";
// timestring does not have a @types package
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import timestring from "timestring";

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

/**
 * Parses a timeout string and returns a number in seconds
 * @param timeout "20min", "5", undefined
 */
export function parseTimeoutSeconds(timeout: number | string | undefined): number | undefined {
  switch (typeof timeout) {
    case "number": {
      return timeout;
    }
    case "string": {
      if (!timeout) return undefined;
      // A bare number is already in seconds. timestring >= 7 would parse it as milliseconds ("5" -> 0.005)
      if (/^\d+$/.test(timeout.trim())) return parseInt(timeout);
      // Timestring returns in seconds
      const parsedString = timestring(timeout);
      if (!parsedString) throw Error(`Error parsing timeout: ${timeout}`);
      return parsedString;
    }
    case "undefined":
      return undefined;
    default:
      return undefined;
  }
}
