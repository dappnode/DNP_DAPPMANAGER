import fetch from "node-fetch";
import { buildNetworkAlias } from "@dappnode/utils";
import { ChainDriverSpecs, InstalledPackageData } from "@dappnode/types";
import { ChainDataResult } from "../types.js";

/**
 * Returns a chain data object for a Tendermint node
 * @param apiUrl = "http://tendermint.dnp.dappnode:26657/"
 */
export async function tendermint(
  dnp: InstalledPackageData,
  chainDriver: ChainDriverSpecs
): Promise<ChainDataResult | null> {
  // 1. Get network alias from the Tendermint service (use the default service name if not specified)
  const serviceName = chainDriver.serviceName || "tendermint";
  const tendermintContainer = dnp.containers.find(
    (container) => container.serviceName === serviceName
  );
  if (!tendermintContainer) {
    throw Error(`${serviceName} service not found`);
  }
  if (!tendermintContainer.running) {
    return null; // OK to not be running, just ignore
  }

  const { dnpName } = tendermintContainer;
  const containerDomain = buildNetworkAlias({
    dnpName,
    serviceName,
    isMainOrMonoservice: false,
  });

  // 2. Get the port number from the Tendermint service (use the default port number if not specified)
  const port = chainDriver.portNumber || 26657;

  // base URL for the Tendermint node (e.g http://tendermint.dnp.dappnode:26657/)
  const apiUrl = `http://${containerDomain}:${port}`;

  try {
    const [syncData, netInfo] = await Promise.all([
      fetchTendermintSyncData(apiUrl),
      fetchTendermintNetInfo(apiUrl),
    ]);

    return parseTendermintResponse(syncData, netInfo);
  } catch (e) {
    // Return error if can't fetch
    return {
      syncing: false,
      message: `Could not connect to RPC. ${e.message}`,
      error: true,
    };
  }
}

/**
 * Fetches the sync state data for a Tendermint node
 * @param apiUrl The base URL for the Tendermint node RPC (e.g. http://tendermint.dnp.dappnode:26657/)
 */
async function fetchTendermintSyncData(apiUrl: string): Promise<TendermintSyncData> {
  const response = await fetch(`${apiUrl}/status`);
  const data = await response.json();
  return data.result.sync_info as TendermintSyncData;
}

/**
 * Fetches the network information for a Tendermint node
 * @param apiUrl The base URL for the Tendermint node RPC (e.g. http://tendermint.dnp.dappnode:26657/)
 */
async function fetchTendermintNetInfo(apiUrl: string): Promise<TendermintNetInfo> {
  const response = await fetch(`${apiUrl}/net_info`);
  const data = await response.json();
  return data.result as TendermintNetInfo;
}

/**
 * Parses the sync state and network information response from a Tendermint node
 * to describe if it's currently syncing or not, and if it is, what block it is up to,
 * as well as the number of connected peers (total, inbound, and outbound).
 * @param syncData The sync state data
 * @param netInfo The network information
 */
function parseTendermintResponse(
  syncData: TendermintSyncData,
  netInfo: TendermintNetInfo
): ChainDataResult {
  const syncing = syncData.catching_up;
  const latestBlockHeight = parseInt(syncData.latest_block_height);
  const peers = netInfo.peers.length;
  const inboundPeers = netInfo.peers.filter((peer) => !peer.is_outbound).length;
  const outboundPeers = peers - inboundPeers;

  return {
    syncing,
    error: false,
    message: syncing
      ? `Syncing blocks ${latestBlockHeight} / ${syncData.latest_block_height}`
      : `Synced #${latestBlockHeight}`,
    peers,
    inboundPeers,
    outboundPeers,
  };
}

/**
 * Interface describing the sync state data returned by a Tendermint node
 */
interface TendermintSyncData {
  latest_block_hash: string;
  latest_app_hash: string;
  latest_block_height: string;
  latest_block_time: string;
  earliest_block_hash: string;
  earliest_app_hash: string;
  earliest_block_height: string;
  earliest_block_time: string;
  catching_up: boolean;
}

/**
 * Interface describing the network information returned by a Tendermint node
 */
interface TendermintNetInfo {
  peers: TendermintPeerInfo[];
}

/**
 * Interface describing a peer in the network information returned by a Tendermint node
 */
interface TendermintPeerInfo {
  node_info: any;
  is_outbound: boolean;
  connection_status: any;
  remote_ip: string;
}