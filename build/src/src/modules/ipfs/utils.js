const isIPFS = require('is-ipfs');

// Declare utility methods
const parseResHash = (res) => {
    // Prevent uncontrolled errors
    if (!(res && res[0] && res[0].hash
        && typeof res[0].hash === typeof 'String')
    ) {
        throw new Error('Wrong parameters, res: '+JSON.stringify(res));
    }
    return res[0].hash;
};

const validateIpfsHash = (HASH) => {
    // Correct hash prefix
    if (HASH.includes('ipfs/')) {
        HASH = HASH.split('ipfs/')[1];
    }
    HASH.replace('/', '');
    // Make sure hash if valid
    if (!isIPFS.multihash(HASH)) {
        throw Error('Invalid IPFS hash: ' + HASH);
    }
    return HASH;
};

module.exports = {
    parseResHash,
    validateIpfsHash,
};
