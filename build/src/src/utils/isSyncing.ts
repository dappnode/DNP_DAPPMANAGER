const HttpProvider = require("ethjs-provider-http");
const EthRPC = require("ethjs-rpc");
import params from "../params";
import { runOnlyOneReturnToAll } from "./asyncFlows";

const blockDiff = 50;

const WEB3_HOST_HTTP = params.WEB3_HOST_HTTP;
const eth = new EthRPC(new HttpProvider(WEB3_HOST_HTTP));

interface EthSyncingInterface {
  startingBlock: string;
  currentBlock: string;
  highestBlock: string;
}

/**
 * RPC CALL
 * ========
 * Calls the RPC method eth_syncing
 * Each call takes ~600ms (500ms minimum, 1500ms maximum observed)
 * Using this raw methodology to avoid expensive libraries (web3)
 *
 * @returns {bool} Returns true if it's syncing and the blockDiff
 * is big enough. Returns false otherwise
 */
const isSyncingThrottled = runOnlyOneReturnToAll(callback => {
  eth.sendAsync(
    { method: "eth_syncing" },
    (err: Error, res: EthSyncingInterface) => {
      if (err) {
        if (err.message.includes("Invalid JSON RPC response from provider")) {
          return callback(Error(`Can't connect to ${WEB3_HOST_HTTP}`), null);
        } else {
          return callback(err, null);
        }
      }
      if (!res) return callback(null, false);
      const currentBlock = parseInt(res.currentBlock, 16);
      const highestBlock = parseInt(res.highestBlock, 16);
      const isSyncing = Math.abs(currentBlock - highestBlock) > blockDiff;
      callback(null, isSyncing);
    }
  );
});

export default isSyncingThrottled;
