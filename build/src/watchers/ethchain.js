const eventBus = require('../eventBus')
// import the actual Api class
const Api = require('@parity/api')

// do the setup
const provider = new Api.Provider.Http('http://my.ethchain.dnp.dappnode.eth:8545');

const INTERVAL_TIME = 5 * 60 * 1000 // 5 minutes
const MIN_BLOCK_DIFF = 10000
const MIN_BLOCK_DIFF_SYNC = 100


console.log('WATCHING ETHCHAIN - (line 12 ethchain.js)')

let intervalID = setInterval(function() {

  try {
    // Reconnect every time
    const api = new Api(provider)

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

        }
      });

  } catch(e) {
    console.log('(ethchain.js) - ERROR in ethchain watcher: '+e.message)
  }

}, INTERVAL_TIME);


async function isSyncing() {
  const api = new Api(provider)
  const syncing = await api.eth.syncing()
  if (
    syncing
    // Condition 1, big enough difference between current and highest block
    && syncing.highestBlock.c[0] - syncing.currentBlock.c[0] > MIN_BLOCK_DIFF_SYNC
  ) {
    return true
  } else {
    return false
  }
}


module.exports = {
  isSyncing
}
