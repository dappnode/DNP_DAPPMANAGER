const semver = require("semver");
const apm = require("modules/apm");

/**
 * Fetches the available versions given a request.
 * Will fetch the versions from different places according the type of version range:
 * - valid semver range: Fetch the valid versions from APM
 * - valid semver version (not range): Return that version
 * - unvalid semver version ("/ipfs/Qmre4..."): Asume it's the only version
 *
 * @param {object} kwargs: {
 *   name: Name of package i.e. "kovan.dnp.dappnode.eth"
 *   versionRange: version range requested i.e. "^0.1.0" or "0.1.0" or "/ipfs/Qmre4..."
 * }
 * @returns {Set} set of versions
 */
async function fetchVersions({ name, versionRange }) {
  if (semver.validRange(versionRange)) {
    if (versionRange === "*") {
      // ##### TODO: Case 0. Force "*" to strictly fetch the last version only
      // If "*" is interpreted as any version, many old manifests are not well
      // hosted and delay the resolution too much because all old versions have
      // to timeout in order to proceed
      const versionObj = await apm.getLatestWithVersion({ name });
      return Object.keys(versionObj);
    } else if (semver.valid(versionRange)) {
      // Case 1. Valid semver version (not range): Return that version
      return [versionRange];
    } else {
      // Case 1. Valid semver range: Fetch the valid versions from APM
      const versionsObj = await apm.getRepoVersions({ name }, versionRange);
      return Object.keys(versionsObj);
    }
  }

  // Case 3. unvalid semver version ("/ipfs/Qmre4..."): Asume it's the only version
  return [versionRange];
}

module.exports = fetchVersions;
