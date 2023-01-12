import semver from "semver";
import { UpdateType } from "@dappnode/common";

/**
 * Compute the release type: major, minor, patch
 * @param from 0.1.21
 * @param to 0.2.0
 * @returns release type: major, minor, patch
 */
export default function computeSemverUpdateType(
  from: string,
  to: string
): UpdateType {
  if (!semver.valid(from) || !semver.valid(to)) return null;

  // Make sure there are no downgrades
  if (semver.lt(to, from)) return null;

  // Remove wierd stuff: 10000000000000000.4.7.4 becomes 4.7.4
  // If not valid, abort
  const fromValid = semver.valid(semver.coerce(from) || "");
  const toValid = semver.valid(semver.coerce(to) || "");
  if (!toValid || !fromValid) return null;

  if (semver.major(fromValid) !== semver.major(toValid)) return "major";
  if (semver.minor(fromValid) !== semver.minor(toValid)) return "minor";
  if (semver.patch(fromValid) !== semver.patch(toValid)) return "patch";
  return null;
}
