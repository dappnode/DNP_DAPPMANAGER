const {eventBus, eventBusTag} = require('eventBus');
const logs = require('logs')(module);
const dockerList = require('modules/dockerList');
const Web3 = require('web3');
const params = require('params');

/* eslint-disable max-len */

const MIN_BLOCK_DIFF_SYNC = 10;

// This module contains watchers to the different active chains
// It will only emit chain information when at least one ADMIN UI is active
// Every time there is a package install / remove, the watchers will be reseted

const supportedProviders = {
    'ethchain.dnp.dappnode.eth': {
      'name': 'Mainnet',
      'http': 'http://my.ethchain.dnp.dappnode.eth:8545',
      'ws': 'ws://my.ethchain.dnp.dappnode.eth:8546',
    },
    'ropsten.dnp.dappnode.eth': {
      'name': 'Ropsten',
      'http': 'http://my.ropsten.dnp.dappnode.eth:8545',
      'ws': 'ws://my.ropsten.dnp.dappnode.eth:8546',
    },
    'rinkeby.dnp.dappnode.eth': {
      'name': 'Rinkeby',
      'http': 'http://my.rinkeby.dnp.dappnode.eth:8545',
      'ws': 'ws://my.rinkeby.dnp.dappnode.eth:8546',
    },
    'kovan.dnp.dappnode.eth': {
      'name': 'Kovan',
      'http': 'http://my.kovan.dnp.dappnode.eth:8545',
      'ws': 'ws://my.kovan.dnp.dappnode.eth:8546',
    },
};

const activeChains = {};

/**
 * CHAIN MANAGMENT
 * ===============
 * Adds and removes chains from the 'active' list
 * When the chainData fetcher is triggered it will
 * fetch data from those only
*/

async function addChain(dnpName) {
    activeChains[dnpName] = supportedProviders[dnpName];
}

async function removeChain(dnpName) {
    delete activeChains[dnpName];
}

async function checkChainWatchers() {
    try {
        const dnpList = await dockerList.listContainers();
        // Remove chains
        for (const dnpName of Object.keys(activeChains)) {
            // If a chain is being watched but is not in the current dnpList
            if (!dnpList.find((dnp) => dnp.name === dnpName)) {
                removeChain(dnpName);
            }
        }
        // Add new chains
        for (const dnp of dnpList) {
            // If this dnp is a supported chain, and not currently watched
            if (supportedProviders[dnp.name] && !activeChains[dnp.name]) {
                addChain(dnp.name);
            }
        }
    } catch (e) {
        logs.error(`Error checking chain watchers: ${e.stack}`);
    }
}

checkChainWatchers();
// Call checkChainWatchers() again in case there was a race condition
// during the DAppNode installation
setTimeout(() => {
    checkChainWatchers();
}, 60 * 1000);

eventBus.on(eventBusTag.packageModified, () => {
    checkChainWatchers();
});

/**
 * GET CHAIN DATA
 * ==============
 * Calls every active chain if requested,
 * and emits the data to the UI
 */

/**
 * chain data specs
 *
 *
 */

// When an ADMIN UI is connected it will set params.CHAIN_DATA_UNTIL
// to the current time + 5 minutes. During that time, emitChain data every 5 seconds
setInterval(async () => {
    if (params.CHAIN_DATA_UNTIL > Date.now()) getAndEmitChainData();
}, 5000);

// Also get and emit chain data immediately after the UI has requested it
eventBus.on(eventBusTag.requestedChainData, getAndEmitChainData);

async function getAndEmitChainData() {
    const chainData = await getChainData(Object.values(activeChains));
    eventBus.emit(eventBusTag.emitChainData, {chainData});
}

/**
 * Fetches multiple ethereum chain states at once via HTTP
 *
 * @param {Array} chains =
 *  [
 *    { name: 'Mainnet',
 *      http: 'http://my.ethchain.dnp.dappnode.eth:8545',
 *      ws: 'ws://my.ethchain.dnp.dappnode.eth:8546', },
 *    ...
 *  ]
 * @return {Array} chainData =
 *  [
 *     { name: 'Mainnet',
 *       syncing: true,
 *       msg: 'Syncing snapshot: 235/1432' },
 *     { name: 'Kovan',
 *       syncing: false,
 *       msg: 'Synced #8946123' },
 *     { name: 'Ropstep',
 *       error: 'Could not connect' },
 *  ];
 */
function getChainData(chains) {
    return Promise.all(chains.map(async (chain) => {
        const res = {name: chain.name};
        try {
            const web3 = new Web3(chain.http);
            const [syncing, blockNumber] = await Promise.all([web3.eth.isSyncing(), web3.eth.getBlockNumber()]);
            if (syncing && syncing.highestBlock - syncing.currentBlock > MIN_BLOCK_DIFF_SYNC) {
                res.syncing = true;
                res.msg = (syncing.warpChunksAmount > 0 && syncing.warpChunksProcessed > 0)
                    ? `Syncing snapshot: ${parseSyncing(syncing.warpChunksProcessed, syncing.warpChunksAmount)}`
                    : `Blocks synced: ${parseSyncing(syncing.currentBlock, syncing.highestBlock)}`;
            } else {
                res.syncing = false;
                res.msg = 'Synced #' + blockNumber;
            }
        } catch (e) {
            res.error = e.message;
        }
        return res;
    }));
}

function parseSyncing(current, total) {
    return `${parseHexOrDecimal(current)} / ${parseHexOrDecimal(total)}`;
}

// Current versions of parseInt are able to recognize hex numbers
// and automatically use a radix parameter of 16.
function parseHexOrDecimal(hexOrDecimal) {
    return parseInt(hexOrDecimal);
}
