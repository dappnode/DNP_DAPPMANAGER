import { valid, lt } from "semver";

/**
 * @param prev currentVersion
 * @param next newVersion
 */
export default function shouldUpdate(prev: string, next: string): boolean {
  // Deal with a double IPFS hash case
  if (prev && next && prev === next) return false;
  prev = valid(prev) || "999.9.9";
  next = valid(next) || "9999.9.9";
  return lt(prev, next);
}
