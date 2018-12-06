const {eventBus, eventBusTag} = require('eventBus');
const Web3 = require('web3');
const dockerList = require('modules/dockerList');

/* eslint-disable max-len */

const MIN_BLOCK_DIFF_SYNC = 10;

const providers = {
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

/**
 * Requests chain data. Also instructs the DAPPMANAGER
 * to keep sending data for a period of time
 *
 * @return {Object}
 */
const emitChainData = async () => {
    // Check which chains are installed AND active
    // Report which chans are stopped
    // Request the block number and isSyncing

    const dnpList = await dockerList.listContainers();
    const chains = [];
    const chainData = {};

    Object.keys(providers).forEach((id) => {
        chains.push(providers[id]);
    });

    dnpList.forEach((dnp) => {
        if (providers[dnp.name]) {
            chains.push(providers[dnp.name]);
        }
    });

    // Syncing object:
    // syncing.currentBlock,
    // syncing.highestBlock,
    // syncing.warpChunksProcessed,
    // syncing.warpChunksAmount

    await Promise.all(chains.map(async (chain) => {
        try {
            const web3 = new Web3(chain.http);
            const [syncing, blockNumber] = await Promise.all([
                web3.eth.isSyncing(),
                web3.eth.getBlockNumber(),
            ]);
            if (syncing && syncing.highestBlock - syncing.currentBlock > MIN_BLOCK_DIFF_SYNC) {
                chainData[chain.name] = {
                    syncing: true,
                    msg: (syncing.warpChunksAmount > 0 && syncing.warpChunksProcessed > 0)
                        ? `Syncing snapshot: ${syncing.warpChunksProcessed} / ${syncing.warpChunksAmount}`
                        : `Blocks synced: ${syncing.currentBlock} / ${syncing.highestBlock}`,
                };
            } else {
                // is NOT syncing
                chainData[chain.name] = {
                    syncing: false,
                    msg: 'Synced #' + blockNumber,
                };
            }
        } catch (e) {
            chainData[chain.name] = {
                error: e.message,
            };
        }
    }));

    eventBus.emit(eventBusTag.emitChainData, {chainData});

    return {
        message: `Emitting chain data: ${JSON.stringify(chainData, null, 2)}`,
    };
};


module.exports = emitChainData;
