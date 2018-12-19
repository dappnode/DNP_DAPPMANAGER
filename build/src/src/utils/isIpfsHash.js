const isIPFS = require('is-ipfs');

const isIpfsHash = (HASH) => {
    if (!HASH) return false;
    // Correct hash prefix
    if (HASH.includes('ipfs/')) {
        HASH = HASH.split('ipfs/')[1];
    }
    HASH.replace('/', '');
    // Make sure hash if valid
    return isIPFS.multihash(HASH);
};

module.exports = isIpfsHash;
