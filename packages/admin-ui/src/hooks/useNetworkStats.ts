import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardSupportedNetwork, Network, NetworkStats, NodeStatus, NodeStatusByNetwork } from "@dappnode/types";
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

export function useNetworkStats() {
  // Fetch consensus and execution clients for all supported networks
  const consensusClientsReq = useApi.consensusClientsGetByNetworks({ networks: supportedNetworks });
  const executionClientsReq = useApi.executionClientsGetByNetworks({ networks: supportedNetworks });

  const consensusClientsByNetwork = consensusClientsReq.data;
  const executionClientsByNetwork = executionClientsReq.data;

  const [nodesStatusByNetwork, setNodesStatusByNetwork] = useState<NodeStatusByNetwork | undefined>(undefined);
  const [nodesStatusLoading, setNodesStatusLoading] = useState(false);
  const lastFetchedNetworksKey = useRef<string>("");

  const fetchNodesStatus = useCallback(async () => {
    if (!consensusClientsByNetwork || !executionClientsByNetwork) return;

    // Collect all dnpNames from both client responses
    const dnpNames = collectDnpNames(consensusClientsByNetwork, executionClientsByNetwork);
    if (dnpNames.size === 0) {
      setNodesStatusByNetwork({});
      return;
    }

    // Verify packages are installed
    let installedDnpNames: Set<string>;
    try {
      const installedPackages = await api.packagesGet();
      const allInstalledNames = new Set(installedPackages.map((pkg) => pkg.dnpName));
      installedDnpNames = new Set([...dnpNames].filter((name) => allInstalledNames.has(name)));
    } catch (e) {
      console.error("Error fetching installed packages for node status", e);
      return;
    }

    if (installedDnpNames.size === 0) {
      setNodesStatusByNetwork({});
      return;
    }

    const networksWithClients = getNetworksWithInstalledClients(
      consensusClientsByNetwork,
      executionClientsByNetwork,
      installedDnpNames
    );

    if (networksWithClients.length === 0) {
      setNodesStatusByNetwork({});
      return;
    }

    // Avoid re-fetching if the networks list hasn't changed
    const networksKey = JSON.stringify(networksWithClients);
    if (networksKey === lastFetchedNetworksKey.current) return;
    lastFetchedNetworksKey.current = networksKey;

    try {
      setNodesStatusLoading(true);
      const nodeStatus = await api.nodeStatusGetByNetwork({ networks: networksWithClients });
      setNodesStatusByNetwork(nodeStatus);
    } catch (e) {
      console.error("Error fetching node status by network", e);
    } finally {
      setNodesStatusLoading(false);
    }
  }, [consensusClientsByNetwork, executionClientsByNetwork]);

  useEffect(() => {
    fetchNodesStatus();
  }, [fetchNodesStatus]);

  // Validators requests (unchanged, still fetched for all supported networks)
  const validatorsFilterActiveReq = useApi.validatorsFilterActiveByNetwork({ networks: supportedNetworks });
  const validatorsFilterAttestingReq = useApi.validatorsFilterAttestingByNetwork({ networks: supportedNetworks });
  const validatorsBalancesReq = useApi.validatorsBalancesByNetwork({ networks: supportedNetworks });
  const signersStatusReq = useApi.signerByNetworkGet({ networks: supportedNetworks });

  const validatorsActiveByNetwork = validatorsFilterActiveReq.data;
  const validatorsAttestingByNetwork = validatorsFilterAttestingReq.data;
  const validatorsBalancesByNetwork = validatorsBalancesReq.data;
  const signersStatusByNetwork = signersStatusReq.data;

  const clientsLoading = nodesStatusLoading || consensusClientsReq.isValidating || executionClientsReq.isValidating;

  const validatorsLoading =
    validatorsFilterActiveReq.isValidating ||
    validatorsFilterAttestingReq.isValidating ||
    validatorsBalancesReq.isValidating ||
    signersStatusReq.isValidating;

  const networkStats: NetworkStats = {};

  for (const network of supportedNetworks) {
    const features = networkFeatures[network];
    const nodeStatusData: NodeStatus | undefined = nodesStatusByNetwork?.[network];
    const consensusClientDnp = consensusClientsByNetwork?.[network];
    const executionClientDnp = executionClientsByNetwork?.[network];
    const validatorsActive = validatorsActiveByNetwork?.[network];
    const validatorsAttesting = validatorsAttestingByNetwork?.[network];
    const balancesObj = validatorsBalancesByNetwork?.[network]?.balances;
    const signerStatus = signersStatusByNetwork?.[network] ?? { isInstalled: false, brainRunning: false };

    let total = 0;
    let attesting = 0;
    let balance = 0;
    let beaconError = undefined;

    if (features.hasValidators && validatorsActive) {
      total = validatorsActive.validators.length;
      beaconError = validatorsActive.beaconError;
    }
    if (features.hasValidators && validatorsAttesting) {
      attesting = validatorsAttesting.validators.length;
    }
    if (features.hasValidators && balancesObj && validatorsActive) {
      // Sum balances for active validators
      balance = validatorsActive.validators.reduce((acc, pk) => acc + (parseFloat(balancesObj[pk]) || 0), 0);
    }

    const validatorsData = features.hasValidators
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

    // Remove network where no node data is available
    if (nodeStatusData && (nodeStatusData.ec || nodeStatusData.cc)) {
      networkStats[network] = {
        nodeStatus: nodeStatusData,
        clientsDnps: {
          ecDnp: executionClientDnp || null,
          ccDnp: consensusClientDnp || null
        },
        ...validatorsData,
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
