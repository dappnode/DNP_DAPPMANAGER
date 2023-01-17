import { lt, valid, major, minor, patch, coerce } from "semver";
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
  if (!valid(from) || !valid(to)) return null;

  // Make sure there are no downgrades
  if (lt(to, from)) return null;

  // Remove wierd stuff: 10000000000000000.4.7.4 becomes 4.7.4
  // If not valid, abort
  const fromValid = valid(coerce(from) || "");
  const toValid = valid(coerce(to) || "");
  if (!toValid || !fromValid) return null;

  if (major(fromValid) !== major(toValid)) return "major";
  if (minor(fromValid) !== minor(toValid)) return "minor";
  if (patch(fromValid) !== patch(toValid)) return "patch";
  return null;
}
