import { mapValues } from "lodash";

type EthSyncingReturn =
  | false
  | {
      currentBlock: string; // "0x0";
      highestBlock: string; // "0x8a61c8";
      startingBlock: string; // "0x0";
      // Geth sync
      knownStates?: string | null; // "0x1266";
      pulledStates?: string | null; // "0x115";
      // Open Ethereum sync
      warpChunksAmount?: string | null; // "0x1266";
      warpChunksProcessed?: string | null; // "0x115";
    };

export type EthSyncing =
  | false
  | {
      currentBlock: number; // 0;
      highestBlock: number; // 953511;
      startingBlock?: number; // 0;
      // Geth sync
      knownStates?: number; // 3551521;
      pulledStates?: number; // 1231233;
      // Open Ethereum sync
      warpChunksAmount?: number; // 3251;
      warpChunksProcessed?: number; // 1432;
    };

/**
 * Parse an eth_syncing call to an ethers provider
 * Makes sure all keys are defined (cleans null values) and parses hex strings
 * @param syncing
 */
export function parseEthersSyncing(syncing: EthSyncingReturn): EthSyncing {
  if (!syncing) return false;

  const parsedSyncing = mapValues(syncing, hexValue => {
    switch (typeof hexValue) {
      case "string":
        return parseInt(hexValue);
      case "number":
        return parseInt(String(hexValue));
      default:
        return undefined;
    }
  });

  return {
    ...parsedSyncing,
    // To satisfy the compiler as it does not fully understand the switch above
    currentBlock: parsedSyncing.currentBlock || 0,
    highestBlock: parsedSyncing.highestBlock || 0
  };
}

/**
 * Make sure progress is a valid number, otherwise API typechecking will error since
 * a NaN value may be converted to null
 */
export function safeProgress(progress: number): number | undefined {
  if (typeof progress !== "number" || isNaN(progress) || !isFinite(progress))
    return undefined;
  else return progress;
}

/**
 * Reword expected chain errors
 */
export function parseChainErrors(error: Error): string {
  if (error.message.includes("ECONNREFUSED"))
    return `DAppNode Package stopped or unreachable (connection refused)`;

  if (error.message.includes("Invalid JSON RPC response"))
    return `DAppNode Package stopped or unreachable (invalid response)`;

  return error.message;
}
