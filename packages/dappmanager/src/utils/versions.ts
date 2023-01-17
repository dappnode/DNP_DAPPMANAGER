import { valid, gt } from "semver";
import { isIpfsHash } from "./validate";

/*
 * Wrapper for the semver library. In the DAPPMANAGER versions can be:
 * - 0.1.4 (any semver)
 * - 'latest'
 * - 'QmZv43ndN...' (an IPFS hash)
 * - undefinded
 * This wrapper guards against this extra cases.
 */

export function isHigher(v1: string, v2: string): boolean {
  const ipfs = "999.9.10";
  const latest = "999.9.9";
  // if v1 and v2 are ipfs hashes, prioritize above latest
  if (v1 && isIpfsHash(v1)) v1 = ipfs;
  if (v2 && isIpfsHash(v2)) v2 = ipfs;
  // if v1 and v2 are undefined they are latest
  if (!valid(v1)) v1 = latest;
  if (!valid(v2)) v2 = latest;
  // checking if v1 > v2
  return gt(v1, v2);
}

export function highestVersion(v1: string, v2: string): string {
  // If no version is passed return the other
  if (!v1 && v2) return v2;
  if (!v2 && v1) return v1;
  if (!v1 && !v2) throw Error("Comparing two undefined versions");

  // If any version is latest return latest
  if (v1 == "latest" || v2 == "latest") return "latest";

  // Compare semantic versions
  if (!valid(v1) || !valid(v2)) {
    throw new Error(
      `Attempting to compare invalid versions, version1: ${v1} version2: ${v2}`
    );
  }
  if (gt(v1, v2)) {
    return v1;
  } else {
    return v2;
  }
}
