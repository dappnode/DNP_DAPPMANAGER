import semver from "semver";

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
  if (!from || !to || !semver.valid(from) || !semver.valid(to)) return null;

  // Make sure there are no downgrades
  if (semver.lt(to, from)) return "downgrade";

  // Remove wierd stuff: 10000000000000000.4.7.4 becomes 4.7.4
  // If not valid, abort
  from = semver.valid(semver.coerce(from));
  to = semver.valid(semver.coerce(to));
  // For safety, check again
  if (!from || !to || !semver.valid(from) || !semver.valid(to)) return null;

  if (!dontUpSmallVersions) {
    // Semver considers 0.1.21 -> 0.2.0 a minor update
    // Turn it into 1.21.0 -> 2.0.0, to consider it a major
    const fromMajor = semver.major(from);
    const fromMinor = semver.minor(from);
    const fromPatch = semver.patch(from);
    const toMajor = semver.major(to);
    const toMinor = semver.minor(to);
    const toPatch = semver.patch(to);
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
  if (!from || !to || !semver.valid(from) || !semver.valid(to)) return null;

  if (semver.major(from) !== semver.major(to)) return "major";
  if (semver.minor(from) !== semver.minor(to)) return "minor";
  if (semver.patch(from) !== semver.patch(to)) return "patch";
  return null;
}

export default computeSemverUpdateType;
