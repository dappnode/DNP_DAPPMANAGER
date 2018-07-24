const {eventBus, eventBusTag} = require('../eventBus');
const fs = require('fs');
const linearRegression = require('simple-statistics').linearRegression;
const logs = require('logs.js')(module);
// import the actual Api class
const Api = require('@parity/api');

// do the setup
const provider = new Api.Provider.Http('http://my.ethchain.dnp.dappnode.eth:8545');

const INTERVAL_TIME = 5 * 60 * 1000; // 5 minutes
const MIN_BLOCK_DIFF = 10000;
const MIN_BLOCK_DIFF_SYNC = 100;
let shouldReset = false;


logs.info('WATCHER LAUNCHED - ETHCHAIN');

setInterval(() => {
  try {
    // Reconnect every time
    const api = new Api(provider);

    api.eth.syncing()
      .then((syncingInfo) => {
        shouldReset = computeShouldReset(syncingInfo);
      });
  } catch (e) {
    logs.error('Error in ethchain watcher: '+e.message);
  }
}, 1000);


setInterval(() => {
  try {
    if (shouldReset) {
      logs.warn('Reseting parity');
      const id = 'ethchain.dnp.dappnode.eth';
      const isCORE = true;
      eventBus.emit(eventBusTag.call, 'restartPackage.dappmanager.dnp.dappnode.eth', [id, isCORE]);
    }
  } catch (e) {
    logs.error('Could not reset parity in ethchain watcher: '+e.message);
  }
}, INTERVAL_TIME);


async function isSyncing() {
  const api = new Api(provider);
  const syncing = await api.eth.syncing();
  if (
    syncing
    // Condition 1, big enough difference between current and highest block
    && syncing.highestBlock.c[0] - syncing.currentBlock.c[0] > MIN_BLOCK_DIFF_SYNC
  ) {
    return true;
  } else {
    return false;
  }
}


function computeShouldReset(syncingInfo) {
  if (!syncingInfo) return false;

  const cB = syncingInfo.currentBlock.c[0];
  const hB = syncingInfo.highestBlock.c[0];

  const syncingFromSnapshot = isParitySyncingFromSnapshot(syncingInfo);

  return (
    // condition 1, highest and current blocks should be greater than 0
    hB > 0 && cB > 0
    // condition 2, block difference should be greater than minimum
    && hB - cB > MIN_BLOCK_DIFF
    // condition 3, should NOT be syncing from snapshot
    && !syncingFromSnapshot
  );
}


const startTime = Date.now();
const TRACKER_MAX_LENGTH = 60;
const track = {blocks: [], chunks: []};
function isParitySyncingFromSnapshot(syncingInfo) {
  // Prevent the function from crashing on missing info
  if (!syncingInfo)
    {return false;}

  // Parse syncing object
  const ts = Date.now();
  const cB = syncingInfo.currentBlock.c[0];
  const hB = syncingInfo.highestBlock.c[0];
  const cC = syncingInfo.warpChunksProcessed.c[0];
  const hC = syncingInfo.warpChunksAmount.c[0];

  // Store the syncing object
  const SYNCLOG_PATH = 'DNCORE/syncLog.txt';
  if (fs.existsSync('DNCORE')) {
    if (!fs.existsSync(SYNCLOG_PATH)) {
      fs.writeFileSync(
        SYNCLOG_PATH,
        'timestamp, currentBlock, highestBlock, currentChunk, highestChunk\n'
      );
    }

    fs.appendFile(SYNCLOG_PATH, (ts+', '+cB+', '+hB+', '+cC+', '+hC+'\n'), (err) => {
      if (err) logs.info('[ethchain.js 107] ERROR writing sync logs: '+err);
    });
  }

  // Store progress
  const time = (ts-startTime)/1000; // convert to seconds
  track.blocks.push([time, cB]);
  track.chunks.push([time, cC]);
  // Clean array limiting it to 60 values
  if (track.blocks.length > TRACKER_MAX_LENGTH) track.blocks.shift();
  if (track.chunks.length > TRACKER_MAX_LENGTH) track.chunks.shift();

  // Compute slopes
  const chunksPerSecond = linearRegression(track.chunks).m;
  const blocksPerSecond = linearRegression(track.blocks).m;
  // logs.info('blocksPerSecond',blocksPerSecond,'chunksPerSecond',chunksPerSecond)

  // Do not return positives if there is not enough info to compute reliable slopes
  if (track.blocks.length < TRACKER_MAX_LENGTH/2 || track.chunks.length < TRACKER_MAX_LENGTH/2) {
    return false;
  }

  // Compare slopes
  // chunksPerSecond = 0.1 ~ 1, blocksPerSecond = 100 ~ 1000
  const isSnapshot = (chunksPerSecond > blocksPerSecond/1000);

  // Additional condition to make sure there are no strange slopes
  return (isSnapshot && cC > 0 && hC > 0);
}


module.exports = {
  isSyncing,
};
