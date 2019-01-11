const {eventBus, eventBusTag} = require('eventBus');
const logs = require('logs')(module);
const dockerList = require('modules/dockerList');
const params = require('params');
const ethereum = require('./ethereum');
const bitcoin = require('./bitcoin');
const monero = require('./monero');

const modules = {
    ethereum,
    bitcoin,
    monero,
};

/* eslint-disable max-len */

// This module contains watchers to the different active chains
// It will only emit chain information when at least one ADMIN UI is active
// Every time there is a package install / remove, the watchers will be reseted

const supportedProviders = {
    'ethchain.dnp.dappnode.eth': {
        name: 'Mainnet',
        module: 'ethereum',
        api: 'http://my.ethchain.dnp.dappnode.eth:8545',
    //  api: 'ws://my.ethchain.dnp.dappnode.eth:8546',
    },
    'ropsten.dnp.dappnode.eth': {
        name: 'Ropsten',
        module: 'ethereum',
        api: 'http://my.ropsten.dnp.dappnode.eth:8545',
    //  api: 'ws://my.ropsten.dnp.dappnode.eth:8546',
    },
    'rinkeby.dnp.dappnode.eth': {
        name: 'Rinkeby',
        module: 'ethereum',
        api: 'http://my.rinkeby.dnp.dappnode.eth:8545',
    //  api: 'ws://my.rinkeby.dnp.dappnode.eth:8546',
    },
    'kovan.dnp.dappnode.eth': {
        name: 'Kovan',
        module: 'ethereum',
        api: 'http://my.kovan.dnp.dappnode.eth:8545',
    //  api: 'ws://my.kovan.dnp.dappnode.eth:8546',
    },
    'goerli-geth.dnp.dappnode.eth': {
        name: 'Goerli-geth',
        module: 'ethereum',
        api: 'http://my.goerli-geth.dnp.dappnode.eth:8545',
    },
    'goerli-pantheon.dnp.dappnode.eth': {
        name: 'Goerli-pantheon',
        module: 'ethereum',
        api: 'http://my.goerli-pantheon.dnp.dappnode.eth:8545',
    },
    'bitcoin.dnp.dappnode.eth': {
        name: 'Bitcoin',
        module: 'bitcoin',
        api: 'my.bitcoin.dnp.dappnode.eth',
    },
    'monero.dnp.dappnode.eth': {
        name: 'Monero',
        module: 'monero',
        api: 'http://my.monero.dnp.dappnode.eth:18081',
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

// Don't start new requests if the previous one is still active.
// If it is still active return the last result.
// The current ADMIN UI requires a full array of chain data
const cache = {};
async function getAndEmitChainData() {
    const dnpList = await dockerList.listContainers();
    const chainData = await Promise.all(Object.keys(activeChains).filter((dnpName) => {
        const dnp = dnpList.find((_dnp) => _dnp.name === dnpName);
        return dnp && dnp.running;
    }).map(async (dnpName) => {
        const chain = activeChains[dnpName];
        const id = chain.api;
        if (!cache[id]) cache[id] = {};
        // Return last result if previous call is still active
        if (cache[id].active) return cache[id].lastResult;
        // Otherwise raise active flag and perform the request
        cache[id].active = true;
        const result = await modules[chain.module](chain);
        cache[id].active = false;
        cache[id].lastResult = result;
        return result;
    }));
    eventBus.emit(eventBusTag.emitChainData, {chainData});
}
