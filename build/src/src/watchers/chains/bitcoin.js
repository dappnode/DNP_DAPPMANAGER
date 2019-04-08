const Client = require("bitcoin-core");
const shell = require("utils/shell");

const MIN_BLOCK_DIFF_SYNC = 3;

// After revising 'bitcoin-core' source code,
// there is no problem in creating a new instance of Client on each request

// Cache the blockIndex to prevent unnecessary calls
const cache = {};

async function bitcoin({ name, api }) {
  const res = { name };
  try {
    // To initialize the bitcoin client, the RPC user and password are necessary
    // They are stored in the package envs
    const cmd = `docker inspect --format='{{.Config.Env}}' DAppNodePackage-bitcoin.dnp.dappnode.eth`;
    let envsString = await shell(cmd);
    // envsString = '[BTC_RPCUSER=dappnode BTC_RPCPASSWORD=dappnode BTC_TXINDEX=1 PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin]';
    if (envsString.startsWith("[")) envsString = envsString.substring(1);
    if (envsString.endsWith("]"))
      envsString = envsString.substring(0, envsString.length - 1);
    let rpcUser;
    let rpcPassword;
    envsString.split(" ").forEach(envPair => {
      if (envPair.startsWith("BTC_RPCUSER")) rpcUser = envPair.split("=")[1];
      if (envPair.startsWith("BTC_RPCPASSWORD"))
        rpcPassword = envPair.split("=")[1];
    });

    const client = new Client({
      host: api,
      password: rpcUser,
      username: rpcPassword
    });
    const blockIndex = await client.getBlockCount();
    // If the cached blockIndex is the same, return cached block
    const block =
      (cache[api] || {}).blockIndex === blockIndex
        ? cache[api].block
        : await client.getBlockHash(blockIndex).then(client.getBlock);
    // Update cached values
    cache[api] = { blockIndex, block };
    const secondsDiff = Math.floor(Date.now() / 1000) - block.time;
    const blockDiffAprox = Math.floor(secondsDiff / (60 * 10));

    if (blockDiffAprox > MIN_BLOCK_DIFF_SYNC) {
      res.syncing = true;
      res.message = `Blocks synced: ${blockIndex} / ${blockDiffAprox +
        blockIndex}`;
      res.progress = blockIndex / (blockDiffAprox + blockIndex);
    } else {
      res.syncing = false;
      res.message = "Synced #" + blockIndex;
    }
  } catch (e) {
    res.message = e.message;
    res.error = true;
  }
  return res;
}

module.exports = bitcoin;
