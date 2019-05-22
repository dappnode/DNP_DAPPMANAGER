const semver = require("semver");

/**
 *
 * @param {String} v1 currentVersion
 * @param {String} v2 newVersion
 * @return {Bool}
 */
function shouldUpdate(v1, v2) {
  // Deal with a double IPFS hash case
  if (v1 && v2 && v1 === v2) return false;
  v1 = semver.valid(v1) || "999.9.9";
  v2 = semver.valid(v2) || "9999.9.9";
  return semver.lt(v1, v2);
}

module.exports = shouldUpdate;
