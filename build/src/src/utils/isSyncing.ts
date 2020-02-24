import { ethers } from "ethers";
import params from "../params";
import { runOnlyOneReturnToAll } from "./asyncFlows";

const blockDiff = 50;
const WEB3_HOST = params.WEB3_HOST;

type EthSyncingReturn =
  | false
  | {
      currentBlock: string; // "0x0";
      highestBlock: string; // "0x8a61c8";
      knownStates: string; // "0x1266";
      pulledStates: string; // "0x115";
      startingBlock: string; // "0x0";
    };

/**
 * Returns true if an Ethereum client node is syncing
 * Each call takes ~600ms (500ms minimum, 1500ms maximum observed)
 * @param url "http://fullnode.dappnode:8545"
 * @param minBlockDiff Minimum block diff to be considered state as syncing
 */
export async function isSyncing(
  url: string,
  minBlockDiff?: number
): Promise<boolean> {
  const provider = new ethers.providers.JsonRpcProvider(url);
  try {
    const res: EthSyncingReturn = await provider.send("eth_syncing", []);
    if (!res) return false;
    if (minBlockDiff) {
      const currentBlock = parseInt(res.currentBlock, 16);
      const highestBlock = parseInt(res.highestBlock, 16);
      return highestBlock - currentBlock > minBlockDiff;
    } else {
      return true;
    }
  } catch (e) {
    if (e.message.includes("connection error"))
      throw Error(`Can't connect to ${url}`);
    if (e.message.includes("invalid response"))
      throw Error(`Can't connect to ${url}`);
    throw e;
  }
}

/**
 * Throttled call as it used by multiple functions targeting a single node
 */
const isSyncingThrottled = runOnlyOneReturnToAll(() =>
  isSyncing(WEB3_HOST, blockDiff)
);

export default isSyncingThrottled;
