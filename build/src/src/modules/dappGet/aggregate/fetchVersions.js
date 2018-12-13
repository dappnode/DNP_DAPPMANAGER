const semver = require('semver');
const apm = require('modules/apm');

/**
 * Fetches the available versions given a request.
 * Will fetch the versions from different places according the type of version range:
 * - valid semver range: Fetch the valid versions from APM
 * - valid semver version (not range): Return that version
 * - unvalid semver version ("/ipfs/Qmre4..."): Asume it's the only version
 *
 * @param {Object} kwargs: {
 *   name: Name of package i.e. "kovan.dnp.dappnode.eth"
 *   versionRange: version range requested i.e. "^0.1.0" or "0.1.0" or "/ipfs/Qmre4..."
 * }
 * @return {Set} set of versions
 */
async function fetchVersions({name, versionRange}) {
    // Case 1. Valid semver range: Fetch the valid versions from APM
    if (semver.validRange(versionRange) && !semver.valid(versionRange)) {
        const versionsObj = await apm.getRepoVersions({name}, versionRange);
        return Object.keys(versionsObj);
    }
    // Case 2. Valid semver version (not range): Return that version
    if (semver.validRange(versionRange) && semver.valid(versionRange)) {
        return [versionRange];
    }
    // Case 3. unvalid semver version ("/ipfs/Qmre4..."): Asume it's the only version
    return [versionRange];
}

module.exports = fetchVersions;
