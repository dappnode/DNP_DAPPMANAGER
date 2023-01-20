import { valid, patch, minor, coerce, major, lt } from "semver";

/**
 * Compute the release type: major, minor, patch
 * @param from 0.1.21
 * @param to 0.2.0
 * @param dontUpSmallVersions, prevent 0.2.0 from becoming 2.0.0
 * @returns release type: major, minor, patch
 */
function computeSemverUpdateType(
  from: string | null,
  to: string | null,
  dontUpSmallVersions?: boolean
): "major" | "minor" | "patch" | "downgrade" | null {
  if (!from || !to || !valid(from) || !valid(to)) return null;

  // Make sure there are no downgrades
  if (lt(to, from)) return "downgrade";

  // Remove wierd stuff: 10000000000000000.4.7.4 becomes 4.7.4
  // If not valid, abort
  from = valid(coerce(from));
  to = valid(coerce(to));
  // For safety, check again
  if (!from || !to || !valid(from) || !valid(to)) return null;

  if (!dontUpSmallVersions) {
    // Semver considers 0.1.21 -> 0.2.0 a minor update
    // Turn it into 1.21.0 -> 2.0.0, to consider it a major
    const fromMajor = major(from);
    const fromMinor = minor(from);
    const fromPatch = patch(from);
    const toMajor = major(to);
    const toMinor = minor(to);
    const toPatch = patch(to);
    if (fromMajor === 0 && toMajor === 0) {
      if (fromMinor === 0 && toMinor === 0) {
        from = [fromPatch, 0, 0].join(".");
        to = [toPatch, 0, 0].join(".");
      } else {
        from = [fromMinor, fromPatch, 0].join(".");
        to = [toMinor, toPatch, 0].join(".");
      }
    }
  }

  // For safety, check again
  if (!from || !to || !valid(from) || !valid(to)) return null;

  if (major(from) !== major(to)) return "major";
  if (minor(from) !== minor(to)) return "minor";
  if (patch(from) !== patch(to)) return "patch";
  return null;
}

export default computeSemverUpdateType;
