import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ClientError,
  ClientResult,
  DashboardSupportedNetwork,
  Network,
  NetworkStats,
  NodeStatus,
  NodeStatusByNetwork,
  SignerStatus,
  ValidatorsDataByNetwork
} from "@dappnode/types";
import { api, useApi } from "api";
import EthLogo from "img/logos/eth-logo.svg?react";
import GnosisLogo from "img/logos/gnosis-logo.svg?react";
import LuksoLogo from "img/logos/lukso-logo.svg?react";

const supportedNetworks: DashboardSupportedNetwork[] = [
  Network.Mainnet,
  Network.Gnosis,
  Network.Lukso,
  Network.Hoodi,
  Network.Sepolia
];

// Define network's logos and which ones have validators and rewards data
type NetworkFeatures = {
  hasValidators: boolean;
  logo: React.FC<React.SVGProps<SVGSVGElement>>;
  beaconExplorer?: { url: string; name: string };
};

const networkFeatures: Record<DashboardSupportedNetwork, NetworkFeatures> = {
  [Network.Mainnet]: {
    hasValidators: true,
    logo: EthLogo,
    beaconExplorer: { url: "https://beaconcha.in/", name: "Beaconcha.in" }
  },
  [Network.Gnosis]: {
    hasValidators: true,
    logo: GnosisLogo,
    beaconExplorer: { url: "https://beaconchain.gnosischain.com/", name: "Beacon Beaconchain" }
  },
  [Network.Lukso]: {
    hasValidators: true,
    logo: LuksoLogo,
    beaconExplorer: { url: "https://dora.explorer.mainnet.lukso.network/", name: "Beacon Lukso Explorer" }
  },
  [Network.Hoodi]: {
    hasValidators: true,
    logo: EthLogo,
    beaconExplorer: { url: "https://hoodi.beaconcha.in/", name: "Hoodi Beaconcha.in" }
  },
  [Network.Sepolia]: { hasValidators: false, logo: EthLogo }
};

/**
 * Collects all non-null dnpNames from the consensus and execution client maps.
 */
function collectDnpNames(
  consensusClients: Partial<Record<Network, string | null | undefined>> | undefined,
  executionClients: Partial<Record<Network, string | null | undefined>> | undefined
): Set<string> {
  const names = new Set<string>();
  if (consensusClients) {
    for (const dnpName of Object.values(consensusClients)) {
      if (dnpName) names.add(dnpName);
    }
  }
  if (executionClients) {
    for (const dnpName of Object.values(executionClients)) {
      if (dnpName) names.add(dnpName);
    }
  }
  return names;
}

/**
 * Determines which supported networks have at least one installed client package
 * (either consensus or execution) based on the installed packages.
 */
function getNetworksWithInstalledClients(
  consensusClients: Partial<Record<Network, string | null | undefined>> | undefined,
  executionClients: Partial<Record<Network, string | null | undefined>> | undefined,
  installedDnpNames: Set<string>
): DashboardSupportedNetwork[] {
  const networks: DashboardSupportedNetwork[] = [];
  for (const network of supportedNetworks) {
    const cc = consensusClients?.[network];
    const ec = executionClients?.[network];
    const ccInstalled = cc ? installedDnpNames.has(cc) : false;
    const ecInstalled = ec ? installedDnpNames.has(ec) : false;
    if (ccInstalled || ecInstalled) {
      networks.push(network);
    }
  }
  return networks;
}

type SignersStatusByNetwork = Partial<Record<Network, SignerStatus>>;

/**
 * Builds the NetworkStatus entry for a single network from collected data.
 */
function buildNetworkStatus(
  network: DashboardSupportedNetwork,
  nodesStatusByNetwork: NodeStatusByNetwork | undefined,
  validatorsData: ValidatorsDataByNetwork | undefined,
  signersStatusByNetwork: SignersStatusByNetwork | undefined,
  consensusClientsByNetwork: Partial<Record<Network, string | null | undefined>> | undefined,
  executionClientsByNetwork: Partial<Record<Network, string | null | undefined>> | undefined,
  installedDnpNames: Set<string>
) {
  const features = networkFeatures[network];
  const nodeStatusData: NodeStatus | undefined = nodesStatusByNetwork?.[network];
  const consensusClientDnp = consensusClientsByNetwork?.[network];
  const executionClientDnp = executionClientsByNetwork?.[network];

  const ecInstalled = executionClientDnp ? installedDnpNames.has(executionClientDnp) : false;
  const ccInstalled = consensusClientDnp ? installedDnpNames.has(consensusClientDnp) : false;

  const filteredNodeStatus: NodeStatus | undefined = nodeStatusData
    ? {
        ec: ecInstalled ? nodeStatusData.ec : null,
        cc: ccInstalled ? nodeStatusData.cc : null
      }
    : undefined;

  const validatorsActive = validatorsData?.[network]?.active;
  const validatorsAttesting = validatorsData?.[network]?.attesting;
  const balancesObj = validatorsData?.[network]?.balances?.balances;
  const signerStatus = signersStatusByNetwork?.[network] ?? { isInstalled: false, brainRunning: false };

  let total = 0;
  let attesting = 0;
  let balance = 0;
  let beaconError = undefined;

  if (features.hasValidators && validatorsActive) {
    total = validatorsActive.validators.length;
    beaconError = validatorsActive.beaconError;
  }
  if (features.hasValidators && validatorsAttesting && !validatorsAttesting.beaconError) {
    attesting = validatorsAttesting.validators.length;
  }
  if (features.hasValidators && balancesObj && validatorsActive) {
    balance = validatorsActive.validators.reduce((acc, pk) => acc + (parseFloat(balancesObj[pk]) || 0), 0);
  }

  const validatorsInfo = features.hasValidators
    ? {
        validators: {
          total,
          balance,
          attesting,
          beaconError,
          signerStatus,
          pubKeys: validatorsActive?.validators || []
        }
      }
    : undefined;

  const hasEc = filteredNodeStatus?.ec !== null && filteredNodeStatus?.ec !== undefined;
  const hasCc = filteredNodeStatus?.cc !== null && filteredNodeStatus?.cc !== undefined;
  if (filteredNodeStatus && (hasEc || hasCc)) {
    return {
      nodeStatus: filteredNodeStatus,
      clientsDnps: {
        ecDnp: ecInstalled ? executionClientDnp || null : null,
        ccDnp: ccInstalled ? consensusClientDnp || null : null
      },
      ...validatorsInfo,
      hasValidators: features.hasValidators,
      beaconExplorer: features.beaconExplorer || undefined
    };
  }
  return undefined;
}

export function useNetworkStats() {
  // Step 1: Fetch consensus and execution clients for all supported networks
  const consensusClientsReq = useApi.consensusClientsGetByNetworks({ networks: supportedNetworks });
  const executionClientsReq = useApi.executionClientsGetByNetworks({ networks: supportedNetworks });

  const consensusClientsByNetwork = consensusClientsReq.data;
  const executionClientsByNetwork = executionClientsReq.data;

  // Per-network progressive state: data merges in as each network responds
  const [nodesStatusByNetwork, setNodesStatusByNetwork] = useState<NodeStatusByNetwork | undefined>(undefined);
  const [validatorsData, setValidatorsData] = useState<ValidatorsDataByNetwork | undefined>(undefined);
  const [signersStatusByNetwork, setSignersStatusByNetwork] = useState<SignersStatusByNetwork | undefined>(undefined);
  const [installedDnpNames, setInstalledDnpNames] = useState<Set<string>>(new Set());

  // Track which networks are still loading their node status or validators
  const [networksLoadingNodes, setNetworksLoadingNodes] = useState<Set<DashboardSupportedNetwork>>(new Set());
  const [networksLoadingValidators, setNetworksLoadingValidators] = useState<Set<DashboardSupportedNetwork>>(
    new Set()
  );

  // True until the initial discovery phase completes (client lists + installed packages)
  const [initialLoading, setInitialLoading] = useState(true);
  // The set of networks that have clients installed — undefined means not yet determined
  const [networksWithClients, setNetworksWithClients] = useState<DashboardSupportedNetwork[] | undefined>(undefined);

  const prevNetworksKeyRef = useRef<string>("");

  // Track which networks have completed at least one successful fetch.
  // Using refs (not state) so we can read them synchronously without re-renders.
  const fetchedNodesRef = useRef(new Set<string>());
  const fetchedValidatorsRef = useRef(new Set<string>());

  /**
   * Fetches node status, validators, and signer data for a SINGLE network
   * and merges results into state progressively.
   *
   * Loading flags are only set when we don't already have data for this network.
   * On subsequent polls the existing cards stay visible and values update in-place.
   */
  const fetchSingleNetworkData = useCallback(async (network: DashboardSupportedNetwork) => {
    // Only show loading spinners on the first fetch — when there's no data yet.
    // On subsequent poll cycles, keep current data visible and silently replace it.
    // Using refs for synchronous reads — no state-inside-state anti-patterns.
    if (!fetchedNodesRef.current.has(network)) {
      setNetworksLoadingNodes((s) => new Set(s).add(network));
    }
    if (!fetchedValidatorsRef.current.has(network)) {
      setNetworksLoadingValidators((s) => new Set(s).add(network));
    }

    // Fire all three requests for this network in parallel
    const nodeStatusPromise = api
      .nodeStatusGetByNetwork({ networks: [network] })
      .then((result) => {
        // Merge this network's node status into state immediately
        setNodesStatusByNetwork((prev) => ({ ...prev, ...result }));
        fetchedNodesRef.current.add(network);
      })
      .catch((e) => console.error(`Error fetching node status for ${network}`, e))
      .finally(() => {
        setNetworksLoadingNodes((prev) => {
          const next = new Set(prev);
          next.delete(network);
          return next;
        });
      });

    const validatorsPromise = api
      .validatorsDataByNetwork({ networks: [network] })
      .then((result) => {
        setValidatorsData((prev) => ({ ...prev, ...result }));
        fetchedValidatorsRef.current.add(network);
      })
      .catch((e) => console.error(`Error fetching validators data for ${network}`, e))
      .finally(() => {
        setNetworksLoadingValidators((prev) => {
          const next = new Set(prev);
          next.delete(network);
          return next;
        });
      });

    const signerPromise = api
      .signerByNetworkGet({ networks: [network] })
      .then((result) => {
        setSignersStatusByNetwork((prev) => ({ ...prev, ...result }));
      })
      .catch((e) => console.error(`Error fetching signer status for ${network}`, e));

    await Promise.allSettled([nodeStatusPromise, validatorsPromise, signerPromise]);
  }, []);

  /**
   * Discovery + per-network fetch orchestration.
   * Called on mount and every polling interval.
   */
  const fetchNetworkData = useCallback(async () => {
    if (!consensusClientsByNetwork || !executionClientsByNetwork) return;

    // Collect all dnpNames from both client responses
    const dnpNames = collectDnpNames(consensusClientsByNetwork, executionClientsByNetwork);
    if (dnpNames.size === 0) {
      setNodesStatusByNetwork({});
      setValidatorsData({});
      setSignersStatusByNetwork({});
      setNetworksWithClients([]);
      setInitialLoading(false);
      return;
    }

    // Verify which packages are installed
    let resolvedInstalledDnpNames: Set<string>;
    try {
      const installedPackages = await api.packagesGet();
      const allInstalledNames = new Set(installedPackages.map((pkg) => pkg.dnpName));
      resolvedInstalledDnpNames = new Set([...dnpNames].filter((name) => allInstalledNames.has(name)));
      setInstalledDnpNames(resolvedInstalledDnpNames);
    } catch (e) {
      console.error("Error fetching installed packages for node status", e);
      return;
    }

    if (resolvedInstalledDnpNames.size === 0) {
      setNodesStatusByNetwork({});
      setValidatorsData({});
      setSignersStatusByNetwork({});
      setNetworksWithClients([]);
      setInitialLoading(false);
      return;
    }

    const networks = getNetworksWithInstalledClients(
      consensusClientsByNetwork,
      executionClientsByNetwork,
      resolvedInstalledDnpNames
    );
    setNetworksWithClients(networks);
    setInitialLoading(false);

    if (networks.length === 0) {
      setNodesStatusByNetwork({});
      setValidatorsData({});
      setSignersStatusByNetwork({});
      return;
    }

    // On subsequent polls, check if the networks list changed
    const networksKey = JSON.stringify(networks);
    const networksChanged = networksKey !== prevNetworksKeyRef.current;
    prevNetworksKeyRef.current = networksKey;

    // If networks changed, clear stale data for networks no longer present
    if (networksChanged) {
      const networkSet = new Set<string>(networks);
      setNodesStatusByNetwork((prev) => {
        if (!prev) return prev;
        const cleaned: NodeStatusByNetwork = {};
        for (const [k, v] of Object.entries(prev)) {
          if (networkSet.has(k)) cleaned[k as DashboardSupportedNetwork] = v;
        }
        return cleaned;
      });
    }

    // Fire each network's fetch independently — cards appear as each resolves
    for (const network of networks) {
      // Don't await — let them run concurrently and merge state as each finishes
      fetchSingleNetworkData(network);
    }
  }, [consensusClientsByNetwork, executionClientsByNetwork, fetchSingleNetworkData]);

  useEffect(() => {
    fetchNetworkData();
    const interval = setInterval(fetchNetworkData, 12 * 1000);
    return () => clearInterval(interval);
  }, [fetchNetworkData]);

  // Initial loading: true until we've determined which networks exist.
  // Once initialLoading is false, we always have enough data to render cards.
  // Do NOT include SWR isValidating here — revalidation should never replace
  // the dashboard with a spinner; existing cards stay visible during refresh.
  const clientsLoading = initialLoading;

  // Per-network loading: a specific network's node status is still being fetched
  const isNetworkNodeLoading = useCallback(
    (network: DashboardSupportedNetwork) => networksLoadingNodes.has(network),
    [networksLoadingNodes]
  );

  // Per-network validators loading
  const isNetworkValidatorsLoading = useCallback(
    (network: DashboardSupportedNetwork) => networksLoadingValidators.has(network),
    [networksLoadingValidators]
  );

  // Global validators loading: at least one network is still loading validators
  const validatorsLoading = networksLoadingValidators.size > 0;

  const networkStats: NetworkStats = useMemo(() => {
    const stats: NetworkStats = {};
    for (const network of supportedNetworks) {
      const entry = buildNetworkStatus(
        network,
        nodesStatusByNetwork,
        validatorsData,
        signersStatusByNetwork,
        consensusClientsByNetwork,
        executionClientsByNetwork,
        installedDnpNames
      );
      if (entry) {
        stats[network] = entry;
      }
    }
    return stats;
  }, [
    nodesStatusByNetwork,
    validatorsData,
    signersStatusByNetwork,
    consensusClientsByNetwork,
    executionClientsByNetwork,
    installedDnpNames
  ]);

  // Provide a function to get the logo for a network
  function getNetworkLogo(network: DashboardSupportedNetwork) {
    return networkFeatures[network]?.logo || EthLogo;
  }

  return {
    networkStats,
    clientsLoading,
    getNetworkLogo,
    validatorsLoading,
    networksWithClients,
    isNetworkNodeLoading,
    isNetworkValidatorsLoading
  };
}

export function isClientError(result: ClientResult): result is ClientError {
  return result !== null && typeof result === "object" && "error" in result;
}
