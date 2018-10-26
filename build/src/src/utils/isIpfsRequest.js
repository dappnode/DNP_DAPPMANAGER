const isIpfsHash = require('./isIpfsHash');

const isIpfsRequest = (req) => {
    if (req && typeof req === 'object') {
        return req.name && isIpfsHash(req.name)
            || req.ver && isIpfsHash(req.ver);
    } else if (req && typeof req === 'string') {
        return isIpfsHash(req);
    } else {
        return false;
    }
};

module.exports = isIpfsRequest;
