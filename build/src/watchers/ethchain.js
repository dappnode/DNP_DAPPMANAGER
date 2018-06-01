const eventBus = require('../eventBus')
// import the actual Api class
const Api = require('@parity/api')

// do the setup
const provider = new Api.Provider.Http('http://my.ethchain.dnp.dappnode.eth:8545');
const api = new Api(provider);

const INTERVAL_TIME = 5 * 60 * 1000 // 5 minutes
const MIN_BLOCK_DIFF = 10000

console.log('WATCHING ETHCHAIN - (line 12 ethchain.js)')

let intervalID = setInterval(function() {
  api.eth
    .syncing()
    .then((syncing) => {
      if (
        syncing
        // Condition 1, big enough difference between current and highest block
        && syncing.highestBlock.c[0] - syncing.currentBlock.c[0] > MIN_BLOCK_DIFF
        // Condition 2, parity is not in syncing from a snapshot
        && syncing.warpChunksAmount.c[0] == 0
      ) {
        // Reset parity
        console.log('RESETING PARITY')
        const id = 'ethchain.dnp.dappnode.eth'
        const isCORE = true
        eventBus.emit('call', 'restartPackage.dappmanager.dnp.dappnode.eth', [id, isCORE])
      } else {
        console.log('PARITY IS FINE')
      }
    });
}, INTERVAL_TIME);
