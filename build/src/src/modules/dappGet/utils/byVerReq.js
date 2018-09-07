const semver = require('semver');

/**
 * To be used in a filter to select valid semver version
 * It has to be in a separate file because it must allow non-semver
 * cases such as IPFS hashes
 *
 * @param {string} verReq required version. Can be a:
 * - semver range,
 * - semver version,
 * - IPFS hash
 *
 * @return {function} to be used in the filter as:
 *  const vers = Object.keys(repo[name]).filter(byValidSemver(verReq));
 */
function byVerReq(verReq) {
    return (ver) => {
        // Patch to handle IPFS versions. If the verReq or ver are invalid,
        // they can not be compare and will likely be an IPFS hash.
        // Then the only correct ver is the one equal to the verReq
        if (!semver.validRange(verReq) || !semver.valid(ver)) {
            return ver === verReq;
        }
        // Regular comparator
        {return semver.satisfies(ver, verReq);}
    };
}

module.exports = byVerReq;
