const async = require('async');
const {promisify} = require('util');
const HttpProvider = require('ethjs-provider-http');
const EthRPC = require('ethjs-rpc');
const params = require('../params');


const blockDiff = 50;
const cacheTime = 30 * 1000; // ms
const eth = new EthRPC(new HttpProvider(params.WEB3HOSTHTTP));


/**
 * RPC CALL
 * ========
 * Calls the RPC method eth_syncing
 * Each call takes ~600ms (500ms minimum, 1500ms maximum observed)
 * Using this raw methodology to avoid expensive libraries (web3)
 *
 * @return {Bool} Returns true if it's syncing and the blockDiff
 * is big enough. Returns false otherwise
 */
const isSyncingRpcCall = () => new Promise((resolve, reject) => {
    eth.sendAsync({method: 'eth_syncing'}, (err, res) => {
        if (err) {
            if (err.message && err.message.includes('Invalid JSON RPC response from provider')) {
                return reject(Error(`Can't connect to ${params.WEB3HOSTHTTP}`));
            } else {
                return reject(err);
            }
        }
        if (!res) return resolve(false);
        const currentBlock = parseInt(res.currentBlock, 16);
        const highestBlock = parseInt(res.highestBlock, 16);
        resolve(Math.abs(currentBlock - highestBlock) > blockDiff);
    });
});


/**
 * CACHE RESPONSE WRAP
 * ===================
 * To prevent multiple calls to the dappmanager to wait for isSyncing,
 * the result will be cached for a short period of time (30s)
 */
const isSyncingCache = {
    lastCheck: 0,
    res: false,
};

/**
 * If the time threshold is exceeded, recompute value
 * lastCheck time is updated immediately. During the time the fetch
 * is happening, future calls will still get the old value, but this
 * ensures the minimum number of calls
 *
 * @return {Bool} isSyncing: true / false
 */
async function isSyncingWrap() {
    if (Date.now() - isSyncingCache.lastCheck > cacheTime) {
        isSyncingCache.lastCheck = Date.now();
        isSyncingCache.res = await isSyncingRpcCall();
    }
    return isSyncingCache.res;
}


/**
 * IS SYNCING QUEUE
 * ================
 * Create a queue of concurrency = 1 to block other requests
 * while an RPC CALL to eth_syncing is happening
 */
const q = async.queue((task, callback) => {
    // async.retry has fancy async addapt utils to make this work easily
    async.retry({times: 1}, task, callback);
});
const pushTaskAsync = promisify(q.push);


/**
 * Export
 * @return {Bool}
 */
const isSyncing = () => pushTaskAsync(async () => await isSyncingWrap());
module.exports = isSyncing;


