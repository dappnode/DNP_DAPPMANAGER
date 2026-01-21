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
  hasRewardsData: boolean;
  logo: React.FC<React.SVGProps<SVGSVGElement>>;
};

const networkFeatures: Record<DashboardSupportedNetwork, NetworkFeatures> = {
  [Network.Mainnet]: { hasValidators: true, hasRewardsData: true, logo: EthLogo },
  [Network.Gnosis]: { hasValidators: true, hasRewardsData: false, logo: GnosisLogo },
  [Network.Lukso]: { hasValidators: true, hasRewardsData: false, logo: LuksoLogo },
  [Network.Hoodi]: { hasValidators: true, hasRewardsData: true, logo: EthLogo },
  [Network.Sepolia]: { hasValidators: false, hasRewardsData: false, logo: EthLogo }
};

export function useNetworkStats() {
  const isLoading = false;
  const nodesStatusReq = useApi.nodeStatusGetByNetwork({ networks: supportedNetworks });
  const validatorsFilterActiveReq = useApi.validatorsFilterActiveByNetwork({ networks: supportedNetworks });

  const clientsLoading = nodesStatusReq.isValidating;
  const nodesStatusByNetwork = nodesStatusReq.data;
  const validatorsActiveByNetwork = validatorsFilterActiveReq.data;

  const validatorsLoading = validatorsFilterActiveReq.isValidating;

  const networkStats: NetworkStats = {};

  for (const network of supportedNetworks) {
    const features = networkFeatures[network];
    const nodeStatusData: NodeStatus | undefined = nodesStatusByNetwork?.[network];
    const validatorsActive = validatorsActiveByNetwork?.[network];

    const validatorsData =
      features.hasValidators && validatorsActive
        ? {
            validators: {
              total: validatorsActive.validators.length,
              balance: 160,
              attesting: 5,
              beaconError: validatorsActive.beaconError
            }
          }
        : undefined;

    const rewardsData = features.hasRewardsData
      ? {
          rewards: {
            APR: 3.321,
            ethPrice: 3800,
            "7days": 0.0045,
            "30days": 0.0123,
            "365days": 0.3321,
            efectivity: 99.9,
            proposals: 3
          }
        }
      : {};

    // Remove network where no node data is available
    if (nodeStatusData && (nodeStatusData.ec || nodeStatusData.cc)) {
      networkStats[network] = {
        nodeStatus: nodeStatusData,
        ...validatorsData,
        ...rewardsData,
        hasValidators: features.hasValidators,
        hasRewardsData: features.hasRewardsData
      };
    } else {
      delete networkStats[network];
    }
  }

  // Provide a function to get the logo for a network
  function getNetworkLogo(network: DashboardSupportedNetwork) {
    return networkFeatures[network]?.logo || EthLogo;
  }

  return { isLoading, networkStats, clientsLoading, getNetworkLogo, validatorsLoading };
}
