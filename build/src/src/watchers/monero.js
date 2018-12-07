const Daemon = require('monero-rpc').Daemon;

// Monero's average block time is 2 minutes

const MIN_BLOCK_DIFF_SYNC = 15;

async function monero(chain) {
    const res = {name: chain.name};
    try {
        const daemon = new Daemon(chain.api);
        // Promisify the callback style daemon.getInfo. One-liner ugly syntax
        const info = await new Promise((res, rej) => daemon.getInfo((e, r) => e ? rej(e) : res(r)));
        const highestBlock = info.target_height;
        const currentBlock = info.height;
        if (highestBlock - currentBlock > MIN_BLOCK_DIFF_SYNC) {
            res.syncing = true;
            res.message = `Blocks synced: ${currentBlock} / ${highestBlock}`;
        } else {
            res.syncing = false;
            res.message = `Synced #${currentBlock}`;
        }
    } catch (e) {
        res.message = e.message;
        res.error = true;
    }
    return res;
}

module.exports = monero;
