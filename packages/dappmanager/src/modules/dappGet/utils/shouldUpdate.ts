import semver from "semver";

/**
 * @param prev currentVersion
 * @param next newVersion
 */
export default function shouldUpdate(prev: string, next: string): boolean {
  // Deal with a double IPFS hash case
  if (prev && next && prev === next) return false;
  prev = semver.valid(prev) || "999.9.9";
  next = semver.valid(next) || "9999.9.9";
  return semver.lt(prev, next);
}
