const params = require('../params');

/**
 * Returns the current disk space available of a requested path
 *
 * @return {Object} A formated success message.
 * result: status =
 *   {
 *     cpu, <String>
 *     memory, <String>
 *     disk, <String>
 *   }
 */
const getStats = async ({timeout}) => {
    params.IPFS_TIMEOUT = timeout;

    return {
        message: `IPFS timeout set to ${timeout}`,
        logMessage: true,
        userAction: true,
    };
};


module.exports = getStats;

