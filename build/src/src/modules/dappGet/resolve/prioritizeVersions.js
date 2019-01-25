const safeSemver = require('../utils/safeSemver');
const {getVersionsFromDnp} = require('../utils/dnpUtils');

/**
 * Prioritizes the versions array according to this rules
 * 1. Requested package, newest first
 * 2. State package, oldest first
 * 3. New packages, newest first.
 * + Prioritize not installing new packages, first version = null.
 *
 * @param {Object} dnp: {
 *   versions: ['0.1.0', '0.1.2', '/ipfs/Qm443d2...']
 *   isRequest: true / false
 *   isInstalled true / false
 * }
 * @return {Array} versions: ['0.1.2', '0.1.0']
 */
function prioritizeVersions(dnp) {
    const versions = Object.keys(getVersionsFromDnp(dnp));
    // Order the versions to prioritize which successful case will be picked first
    // 1. Requested package, newest first
    if (dnp.isRequest) {
        return versions.sort(safeSemver.rcompare);
    }
    // 2. State package, oldest first
    else if (dnp.isInstalled) {
        return versions.sort(safeSemver.compare);
    }
    // 3. New packages, newest first
    // + Prioritize not installing new packages, first version = null.
    else {
        return [null, ...versions.sort(safeSemver.rcompare)];
    }
}


module.exports = prioritizeVersions;
