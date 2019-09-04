const semver = require("semver");

/**
 * Compute the release type: major, minor, patch
 * @param {string} from 0.1.21
 * @param {string} to 0.2.0
 * @returns {string} release type: major, minor, patch
 */
function computeSemverUpdateType(from, to) {
  if (!semver.valid(from) || !semver.valid(to)) return;

  // Make sure there are no downgrades
  if (semver.lt(to, from)) return;

  // Remove wierd stuff: 10000000000000000.4.7.4 becomes 4.7.4
  // If not valid, abort
  from = semver.valid(semver.coerce(from));
  to = semver.valid(semver.coerce(to));

  for (const type of ["major", "minor", "patch"]) {
    if (semver[type](from) !== semver[type](to)) return type;
  }
}

module.exports = computeSemverUpdateType;
