const semver = require("semver");

/**
 * Must accept regular semvers and "*"
 * @param {string} version
 */
function isSemver(version) {
  return Boolean(semver.validRange(version));
}

module.exports = isSemver;
