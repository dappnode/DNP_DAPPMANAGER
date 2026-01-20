import { DashboardSupportedNetwork, Network, NetworkStats, NodeStatus } from "@dappnode/types";
import { useApi } from "api";

const supportedNetworks: DashboardSupportedNetwork[] = [
  Network.Mainnet,
  Network.Gnosis,
  Network.Lukso,
  Network.Hoodi,
  Network.Sepolia
];

// Define which networks have validators and rewards data
const networkFeatures: Record<DashboardSupportedNetwork, { hasValidators: boolean; hasRewardsData: boolean }> = {
  [Network.Mainnet]: { hasValidators: true, hasRewardsData: true },
  [Network.Gnosis]: { hasValidators: true, hasRewardsData: false },
  [Network.Lukso]: { hasValidators: true, hasRewardsData: false },
  [Network.Hoodi]: { hasValidators: true, hasRewardsData: true },
  [Network.Sepolia]: { hasValidators: false, hasRewardsData: false }
};

export function useNetworkStats() {
  const isLoading = false;
  const nodesStatusReq = useApi.nodeStatusGetByNetwork({ networks: supportedNetworks });

  const clientsLoading = nodesStatusReq.isValidating;
  const nodesStatusByNetwork = nodesStatusReq.data;

  const networkStats: NetworkStats = {};

  for (const network of supportedNetworks) {
    const nodeStatusData: NodeStatus | undefined = nodesStatusByNetwork?.[network];
    const features = networkFeatures[network];

    const validatorsData = features.hasValidators
      ? {
          validators: {
            total: 5,
            balance: 160,
            attesting: 5
          }
        }
      : {};

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

  return { isLoading, networkStats, clientsLoading };
}
