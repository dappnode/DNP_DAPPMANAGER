const params = require('../params');

/**
 * Requests chain data. Also instructs the DAPPMANAGER
 * to keep sending data for a period of time
 *
 * @return {Object}
 */
const requestChainData = async () => {
    params.CHAIN_DATA_UNTIL = Date.now() + 5*60*1000;

    return {
        message: `Requested chain data until ${params.CHAIN_DATA_UNTIL}`,
        logMessage: true,
        userAction: true,
    };
};


module.exports = requestChainData;

