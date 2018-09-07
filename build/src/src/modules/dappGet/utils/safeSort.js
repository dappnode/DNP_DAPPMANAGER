const semver = require('semver');

/**
 * semver comparision functions semver.compare and semver.rcompare
 * will throw and error if passed invalid versions. This is very dangerous
 * behaviour so this wrap will deal with invalid versions.
 * INPUT:
 *   ['0.1.0', '/ipfs/QmHc33SZmas', 'fake', '0.2.0']
 * OUTPUT:
 *   ['/ipfs/QmHc33SZmas', '0.1.0', '0.2.0', 'fake'], or
 *   ['/ipfs/QmHc33SZmas', '0.2.0', '0.1.0', 'fake']
 * @param {function} sortFunction can be semver.rcompare for example
 * @return {function} wrapped sort function
 */
function safeSort(sortFunction) {
    return (v1, v2) => {
        // Put IPFS versions the first
        if (v1.startsWith('/ipfs/')) return -1;
        if (v2.startsWith('/ipfs/')) return 1;
        // Put invalid versions the latest
        if (!semver.valid(v1)) return 1;
        if (!semver.valid(v2)) return -1;
        // Return 0 if v1 == v2, or 1 if v1 is greater, or -1 if v2 is greater.
        return sortFunction(v1, v2);
    };
}

module.exports = safeSort;
