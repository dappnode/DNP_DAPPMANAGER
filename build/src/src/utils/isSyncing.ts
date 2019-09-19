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
function isSyncing(): Promise<boolean> {
  return new Promise(
    (resolve, reject): void => {
      eth.sendAsync(
        { method: "eth_syncing" },
        (err: Error, res: EthSyncingInterface) => {
          if (err) {
            if (err.message.includes("Invalid JSON RPC response from provider"))
              reject(Error(`Can't connect to ${WEB3_HOST_HTTP}`));
            else reject(err);
          } else {
            if (!res) resolve(false);
            const currentBlock = parseInt(res.currentBlock, 16);
            const highestBlock = parseInt(res.highestBlock, 16);
            resolve(Math.abs(currentBlock - highestBlock) > blockDiff);
          }
        }
      );
    }
  );
}

const isSyncingThrottled = runOnlyOneReturnToAll(isSyncing);

export default isSyncingThrottled;
