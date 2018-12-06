const Client = require('bitcoin-core');

const MIN_BLOCK_DIFF_SYNC = 10;

async function bitcoin(chain) {
    const res = {name: chain.name};
    try {
        const client = new Client({
            host: chain.api,
            password: 'dappnode',
            username: 'dappnode',
        });
        const blockIndex = await client.getBlockCount();
        const blockHash = await client.getBlockHash(blockIndex);
        const block = await client.getBlock(blockHash);
        const secondsDiff = Math.floor(Date.now()/1000) - block.time;
        const blockDiffAprox = Math.floor(secondsDiff/(60*10));

        if (blockDiffAprox > MIN_BLOCK_DIFF_SYNC) {
            res.syncing = true;
            res.msg = `Blocks synced: ${blockIndex} / ${blockDiffAprox + blockIndex}`;
        } else {
            res.syncing = false;
            res.msg = 'Synced #' + blockIndex;
        }
    } catch (e) {
        res.error = e.message;
    }
    return res;
}

module.exports = bitcoin;
