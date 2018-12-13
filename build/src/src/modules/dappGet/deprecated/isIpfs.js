/**
 * @param {string} x hash or semver
 * @return {boolean} is IPFS?
 */
function isIpfs(x) {
    return x && x.startsWith('/ipfs/');
}

module.exports = isIpfs;
