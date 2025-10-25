import { Network, NetworkStats, NodeStatus } from "@dappnode/types";
import { useApi } from "api";

const supportedNetworks: Network[] = [Network.Mainnet, Network.Gnosis, Network.Sepolia];

export function useNetworkStats() {
  const isLoading = false;
  const nodesStatusReq = useApi.nodeStatusGetByNetwork({ networks: supportedNetworks });

  const clientsLoading = nodesStatusReq.isValidating;
  const nodesStatusByNetwork = nodesStatusReq.data;

  const networkStats: Partial<NetworkStats> = {};

  for (const network of supportedNetworks) {
    const nodeStatusData: NodeStatus | undefined = nodesStatusByNetwork?.[network];

    const validatorsData = {
      validators: {
        total: 5,
        balance: 160,
        efectivity: 99.9,
        attesting: 5,
        proposals: 3
      }
    };

    const rewardsData = {
      rewards: {
        APR: 3.321,
        ethPrice: 3800,
        "7days": 0.0045,
        "30days": 0.0123,
        "365days": 0.3321
      }
    };

    // Remove network where no node data is available
    if (nodeStatusData && (nodeStatusData.ec || nodeStatusData.cc)) {
      networkStats[network] = {
        nodeStatus: nodeStatusData,
        ...validatorsData,
        ...rewardsData
      };
    } else {
      delete networkStats[network];
    }
  }

  return { isLoading, networkStats, clientsLoading };
}
