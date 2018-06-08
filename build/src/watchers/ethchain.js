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
      .then((syncingInfo) => {
        if (syncingInfo && shouldReset(syncingInfo)) {

          console.log('RESETING PARITY')
          const id = 'ethchain.dnp.dappnode.eth'
          const isCORE = true
          eventBus.emit('call', 'restartPackage.dappmanager.dnp.dappnode.eth', [id, isCORE])
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


const track = { blocks: [], chunks: [] }
function shouldReset(syncingInfo) {

  if (!syncingInfo) return false

  // Parse syncing object
  const ts = Date.now()
  const cB = syncingInfo.currentBlock.c[0]
  const hB = syncingInfo.highestBlock.c[0]
  const cC = syncingInfo.warpChunksProcessed.c[0]
  const hC = syncingInfo.warpChunksAmount.c[0]

  // Store the syncing object
  const SYNCLOG_PATH = 'DNCORE/syncLog.txt'
  if (fs.existsSync('DNCORE')) {
    if (!fs.existsSync(SYNCLOG_PATH)) fs.writeFileSync(SYNCLOG_PATH, 'ts cB hB cC hC')

    fs.appendFile(SYNCLOG_PATH, (ts+', '+cB+', '+hB+', '+cC+', '+hC), (err) => {
      if (err) console.log('ERROR writing sync logs: '+err)
    });
  }

  // Store progress
  const time = (ts-startTime)/1000 // convert to seconds
  track.blocks.push([time, cB])
  track.chunks.push([time, cC])
  // Clean array limiting it to 60 values
  if (track.blocks.length > TRACKER_MAX_LENGTH) track.blocks.shift()
  if (track.chunks.length > TRACKER_MAX_LENGTH) track.chunks.shift()

  // Compute slopes
  const chunksPerSecond = linearRegression(track.chunks).m
  const blocksPerSecond = linearRegression(track.blocks).m
  // console.log('blocksPerSecond',blocksPerSecond,'chunksPerSecond',chunksPerSecond)

  // Compare slopes
  // chunksPerSecond = 0.1 ~ 1, blocksPerSecond = 100 ~ 1000
  // OPTIONAL CONDITION syncingInfo.warpChunksAmount.c[0] == 0
  const isSnapshot = (chunksPerSecond > blocksPerSecond/1000)

  // Output for the user
  return (isSnapshot && hB-cB > MIN_BLOCK_DIFF)
}


module.exports = {
  isSyncing
}
