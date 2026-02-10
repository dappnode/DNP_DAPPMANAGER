import { DashboardSupportedNetwork, Network, NetworkStats, NodeStatus } from "@dappnode/types";
import { useApi } from "api";
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
    beaconExplorer: { url: "https://explorer.consensus.mainnet.lukso.network/", name: "Beacon Lukso Explorer" }
  },
  [Network.Hoodi]: {
    hasValidators: true,
    logo: EthLogo,
    beaconExplorer: { url: "https://hoodi.beaconcha.in/", name: "Hoodi Beaconcha.in" }
  },
  [Network.Sepolia]: { hasValidators: false, logo: EthLogo }
};

export function useNetworkStats() {
  const nodesStatusReq = useApi.nodeStatusGetByNetwork({ networks: supportedNetworks });
  const consensusClientsReq = useApi.consensusClientsGetByNetworks({ networks: supportedNetworks });
  const executionClientsReq = useApi.executionClientsGetByNetworks({ networks: supportedNetworks });
  const validatorsFilterActiveReq = useApi.validatorsFilterActiveByNetwork({ networks: supportedNetworks });
  const validatorsFilterAttestingReq = useApi.validatorsFilterAttestingByNetwork({ networks: supportedNetworks });
  const validatorsBalancesReq = useApi.validatorsBalancesByNetwork({ networks: supportedNetworks });
  const signersStatusReq = useApi.signerByNetworkGet({ networks: supportedNetworks });

  const nodesStatusByNetwork = nodesStatusReq.data;
  const consensusClientsByNetwork = consensusClientsReq.data;
  const executionClientsByNetwork = executionClientsReq.data;
  const validatorsActiveByNetwork = validatorsFilterActiveReq.data;
  const validatorsAttestingByNetwork = validatorsFilterAttestingReq.data;
  const validatorsBalancesByNetwork = validatorsBalancesReq.data;
  const signersStatusByNetwork = signersStatusReq.data;

  const clientsLoading =
    nodesStatusReq.isValidating || consensusClientsReq.isValidating || executionClientsReq.isValidating;

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
            signerStatus
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

    console.log(`Network stats for ${network}:`, networkStats[network]);
  }

  // Provide a function to get the logo for a network
  function getNetworkLogo(network: DashboardSupportedNetwork) {
    return networkFeatures[network]?.logo || EthLogo;
  }

  return { networkStats, clientsLoading, getNetworkLogo, validatorsLoading };
}
