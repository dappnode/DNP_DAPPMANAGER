import fetch from "node-fetch";
import { buildNetworkAlias } from "@dappnode/utils";
import { ChainDriverSpecs, InstalledPackageData } from "@dappnode/types";
import { ChainDataResult } from "../types.js";

/**
 * Returns a chain data object for an Avalanche node
 * @param apiUrl = "http://avalanche.dnp.dappnode:9650/"
 */
export async function avalanche(
  dnp: InstalledPackageData,
  chainDriver: ChainDriverSpecs
): Promise<ChainDataResult | null> {
  // 1. Get network alias from the Avalanche service (use the default service name if not specified)
  const serviceName = chainDriver.serviceName || "avalanche";
  const avalancheContainer = dnp.containers.find(
    (container) => container.serviceName === serviceName
  );
  if (!avalancheContainer) {
    throw Error(`${serviceName} service not found`);
  }
  if (!avalancheContainer.running) {
    return null; // OK to not be running, just ignore
  }

  const { dnpName } = avalancheContainer;
  const containerDomain = buildNetworkAlias({
    dnpName,
    serviceName,
    isMainOrMonoservice: false,
  });

  // 2. Get the port number from the Avalanche service (use the default port number if not specified)
  const port = chainDriver.portNumber || 9650;

  // base URL for the Avalanche node (e.g http://avalanche.dnp.dappnode:9650/)
  const apiUrl = `http://${containerDomain}:${port}`;

  try {
    const [healthData, peersData] = await Promise.all([
      fetchAvalancheHealth(apiUrl),
      fetchAvalanchePeers(apiUrl),
    ]);

    return parseAvalancheResponse(healthData, peersData);
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
 * Fetches the health data for an Avalanche node
 * @param apiUrl The base URL for the Avalanche node API (e.g. http://avalanche.dnp.dappnode:9650/)
 */
async function fetchAvalancheHealth(apiUrl: string): Promise<AvalancheHealthData> {
  const response = await fetch(`${apiUrl}/ext/health`);
  const data = await response.json();
  return data as AvalancheHealthData;
}

/**
 * Fetches the peers data for an Avalanche node
 * @param apiUrl The base URL for the Avalanche node API (e.g. http://avalanche.dnp.dappnode:9650/)
 */
async function fetchAvalanchePeers(apiUrl: string): Promise<AvalanchePeersData> {
  const response = await fetch(`${apiUrl}/ext/info`);
  const data = await response.json();
  return data as AvalanchePeersData;
}

/**
 * Parses the health and peers data response from an Avalanche node
 * to describe if it's currently syncing or not, and the number of connected peers.
 * @param healthData The health data
 * @param peersData The peers data
 */
function parseAvalancheResponse(
  healthData: AvalancheHealthData,
  peersData: AvalanchePeersData
): ChainDataResult {
  const syncing = !healthData.healthy;
  const peers = peersData.peers.length;

  return {
    syncing,
    error: false,
    message: syncing ? "Node is syncing" : "Node is synced",
    peers,
  };
}

/**
 * Interface describing the health data returned by an Avalanche node
 */
interface AvalancheHealthData {
  checks: {
    C: {
      message: Object;
      timestamp: string;
      duration: number;
      contiguousFailures: number;
      timeOfFirstFailure: null;
    };
    P: {
      message: Object;
      timestamp: string;
      duration: number;
      contiguousFailures: number;
      timeOfFirstFailure: null;
    };
    X: {
      message: Object;
      timestamp: string;
      duration: number;
      contiguousFailures: number;
      timeOfFirstFailure: null;
    };
    chains.default.bootstrapped: {
      message: Object;
      timestamp: string;
      duration: number;
      contiguousFailures: number;
      timeOfFirstFailure: null;
    };
    network.validators.heartbeat: {
      message: Object;
      timestamp: string;
      duration: number;
      contiguousFailures: number;
      timeOfFirstFailure: null;
    };
  };
  healthy: boolean;
}

/**
 * Interface describing the peers data returned by an Avalanche node
 */
interface AvalanchePeersData {
  peers: {
    ip: string;
    publicIP: string;
    nodeID: string;
    version: string;
    lastSent: string;
    lastReceived: string;
  }[];
  nodeCount: number;
}