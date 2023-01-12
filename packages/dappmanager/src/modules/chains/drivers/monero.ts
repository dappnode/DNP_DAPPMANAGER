// @ts-ignore
import Daemon from "monero-rpc";
import { InstalledPackageData } from "@dappnode/common";
import { getPrivateNetworkAlias } from "../../../domains";
import { ChainDataResult } from "../types";

// Monero's average block time is 2 minutes
const MIN_BLOCK_DIFF_SYNC = 15;

/**
 * Returns a chain data object for an [monero] API
 * @returns
 * - On success: {
 *   syncing: true, {bool}
 *   message: "Blocks synced: 543000 / 654000", {string}
 *   progress: 0.83027522935,
 * }
 * - On error: {
 *   message: "Could not connect to RPC", {string}
 *   error: true {bool},
 * }
 */
export async function monero(
  dnp: InstalledPackageData
): Promise<ChainDataResult> {
  const container = dnp.containers[0];
  if (!container) throw Error("no container");
  const containerDomain = getPrivateNetworkAlias(container);

  // http://monero.dappnode:18081
  const apiUrl = `http://${containerDomain}:18081`;

  const info: MoneroRpcGetInfoResult = await new Promise(
    (resolve, reject): void => {
      const daemon = new Daemon(apiUrl);
      daemon.getInfo((err: Error, res: MoneroRpcGetInfoResult) => {
        if (err) reject(err);
        else resolve(res);
      });
    }
  );

  const highestBlock = info.target_height;
  const currentBlock = info.height;
  if (highestBlock - currentBlock > MIN_BLOCK_DIFF_SYNC) {
    return {
      syncing: true,
      error: false,
      message: `Blocks synced: ${currentBlock} / ${highestBlock}`,
      progress: currentBlock / highestBlock
    };
  } else {
    return {
      syncing: false,
      error: false,
      message: `Synced #${currentBlock}`
    };
  }
}

interface MoneroRpcGetInfoResult {
  alt_blocks_count: number; // 6;
  block_size_limit: number; // 600000;
  block_size_median: number; // 129017;
  bootstrap_daemon_address: string; // "";
  cumulative_difficulty: number; // 14121125493385685;
  difficulty: number; // 60580751777;
  free_space: number; // 138758750208;
  grey_peerlist_size: number; // 4998;
  height: number; // 1562168;
  height_without_bootstrap: number; // 1562168;
  incoming_connections_count: number; // 2;
  mainnet: boolean; // true;
  offline: boolean; // false;
  outgoing_connections_count: number; // 8;
  rpc_connections_count: number; // 2;
  stagenet: boolean; // false;
  start_time: number; // 1524751757;
  status: string; // "OK";
  target: number; // 120;
  target_height: number; // 1562063;
  testnet: boolean; // false;
  top_block_hash: string; // "7a7ba647080844073fdd8e3a069e00554c773d6e6863354dba1dec45a43f5592";
  tx_count: number; // 2759894;
  tx_pool_size: number; // 755;
  untrusted: boolean; // false;
  was_bootstrap_ever_used: boolean; // false;
  white_peerlist_size: number; // 1000;
}
