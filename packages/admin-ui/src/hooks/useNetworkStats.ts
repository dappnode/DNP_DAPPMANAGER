import { useState, useEffect, useCallback, useRef } from "react";
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
    beaconExplorer: { url: "https://beacon.gnosisscan.io/", name: "Beacon Gnosisscan" }
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

export function useNetworkStats() {
  // Step 1: Fetch consensus and execution clients for all supported networks
  const consensusClientsReq = useApi.consensusClientsGetByNetworks({ networks: supportedNetworks });
  const executionClientsReq = useApi.executionClientsGetByNetworks({ networks: supportedNetworks });

  const consensusClientsByNetwork = consensusClientsReq.data;
  const executionClientsByNetwork = executionClientsReq.data;

  // States fetched only for networks with installed clients
  const [nodesStatusByNetwork, setNodesStatusByNetwork] = useState<NodeStatusByNetwork | undefined>(undefined);
  const [nodesStatusLoading, setNodesStatusLoading] = useState(false);
  const [validatorsData, setValidatorsData] = useState<ValidatorsDataByNetwork | undefined>(undefined);
  const [signersStatusByNetwork, setSignersStatusByNetwork] = useState<SignersStatusByNetwork | undefined>(undefined);
  const [validatorsLoading, setValidatorsLoading] = useState(false);
  const [installedDnpNames, setInstalledDnpNames] = useState<Set<string>>(new Set());

  const lastFetchedNetworksKey = useRef<string>("");

  const fetchNetworkData = useCallback(async () => {
    if (!consensusClientsByNetwork || !executionClientsByNetwork) return;

    // Step 2: Collect all dnpNames from both client responses
    const dnpNames = collectDnpNames(consensusClientsByNetwork, executionClientsByNetwork);
    if (dnpNames.size === 0) {
      setNodesStatusByNetwork({});
      setValidatorsData({});
      setSignersStatusByNetwork({});
      return;
    }

    // Step 3: Verify which packages are installed
    let installedDnpNames: Set<string>;
    try {
      const installedPackages = await api.packagesGet();
      const allInstalledNames = new Set(installedPackages.map((pkg) => pkg.dnpName));
      installedDnpNames = new Set([...dnpNames].filter((name) => allInstalledNames.has(name)));
      setInstalledDnpNames(installedDnpNames);
    } catch (e) {
      console.error("Error fetching installed packages for node status", e);
      return;
    }

    if (installedDnpNames.size === 0) {
      setNodesStatusByNetwork({});
      setValidatorsData({});
      setSignersStatusByNetwork({});
      return;
    }

    const networksWithClients = getNetworksWithInstalledClients(
      consensusClientsByNetwork,
      executionClientsByNetwork,
      installedDnpNames
    );

    if (networksWithClients.length === 0) {
      setNodesStatusByNetwork({});
      setValidatorsData({});
      setSignersStatusByNetwork({});
      return;
    }

    // Avoid re-fetching if the networks list hasn't changed
    const networksKey = JSON.stringify(networksWithClients);
    if (networksKey === lastFetchedNetworksKey.current) return;
    lastFetchedNetworksKey.current = networksKey;

    // Step 4: Fetch node status, combined validators data, and signer data
    // validatorsDataByNetwork combines active, attesting, and balances in a single
    // backend call, reducing beacon chain API requests
    try {
      setNodesStatusLoading(true);
      setValidatorsLoading(true);

      const [nodeStatus, validatorsResult, signersStatus] = await Promise.all([
        api.nodeStatusGetByNetwork({ networks: networksWithClients }),
        api.validatorsDataByNetwork({ networks: networksWithClients }),
        api.signerByNetworkGet({ networks: networksWithClients })
      ]);

      setNodesStatusByNetwork(nodeStatus);
      setValidatorsData(validatorsResult);
      setSignersStatusByNetwork(signersStatus);
    } catch (e) {
      console.error("Error fetching network data", e);
    } finally {
      setNodesStatusLoading(false);
      setValidatorsLoading(false);
    }
  }, [consensusClientsByNetwork, executionClientsByNetwork]);

  useEffect(() => {
    fetchNetworkData();
    const interval = setInterval(fetchNetworkData, 12 * 1000);
    return () => clearInterval(interval);
  }, [fetchNetworkData]);

  const clientsLoading =
    nodesStatusLoading ||
    consensusClientsReq.isValidating ||
    executionClientsReq.isValidating ||
    nodesStatusByNetwork === undefined;

  const networkStats: NetworkStats = {};

  for (const network of supportedNetworks) {
    const features = networkFeatures[network];
    const nodeStatusData: NodeStatus | undefined = nodesStatusByNetwork?.[network];
    const consensusClientDnp = consensusClientsByNetwork?.[network];
    const executionClientDnp = executionClientsByNetwork?.[network];

    // Only include client results if the corresponding package is actually installed
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
      // Sum balances for active validators
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

    // Show network when any client has data or an error (but not when both are null)
    const hasEc = filteredNodeStatus?.ec !== null && filteredNodeStatus?.ec !== undefined;
    const hasCc = filteredNodeStatus?.cc !== null && filteredNodeStatus?.cc !== undefined;
    if (filteredNodeStatus && (hasEc || hasCc)) {
      networkStats[network] = {
        nodeStatus: filteredNodeStatus,
        clientsDnps: {
          ecDnp: ecInstalled ? executionClientDnp || null : null,
          ccDnp: ccInstalled ? consensusClientDnp || null : null
        },
        ...validatorsInfo,
        hasValidators: features.hasValidators,
        beaconExplorer: features.beaconExplorer || undefined
      };
    } else {
      delete networkStats[network];
    }
  }

  // Provide a function to get the logo for a network
  function getNetworkLogo(network: DashboardSupportedNetwork) {
    return networkFeatures[network]?.logo || EthLogo;
  }

  return { networkStats, clientsLoading, getNetworkLogo, validatorsLoading };
}

export function isClientError(result: ClientResult): result is ClientError {
  return result !== null && typeof result === "object" && "error" in result;
}
