import { Network } from "@dappnode/types";

export function useChainStats() {
  const isLoading = false;
  const chainStats: Partial<ChainStats> = {
    [Network.Mainnet]: {
      nodeStatus: {
        execution: {
          name: "Geth",
          version: "1.0.0",
          status: "Synced",
          blockNumber: "12345678"
        },
        consensus: {
          name: "Lodestar",
          version: "1.0.0",
          status: "Synced",
          blockNumber: "12345678"
        }
      },
      validators: {
        total: 5,
        balance: 160,
        efectivity: 99.9,
        attesting: 5,
        proposals: 3
      },
      rewards: {
        APR: 3.321,
        ethPrice: 3800,
        "7days": 0.0045,
        "30days": 0.0123,
        "365days": 0.3321
      }
    },
    [Network.Hoodi]: {
      nodeStatus: {
        execution: {
          name: "Hoodi Besu",
          version: "1.0.0",
          status: "Synced",
          blockNumber: "87654321"
        },
        consensus: {
          name: "Lighhouse hoodi",
          version: "1.0.0",
          status: "Synced",
          blockNumber: "87654321"
        }
      },
      validators: {
        total: 50,
        balance: 500,
        efectivity: 98.7,
        attesting: 45,
        proposals: 5
      },
      rewards: {
        APR: 4,
        ethPrice: 1500,
        "7days": 0.5,
        "30days": 2,
        "365days": 8
      }
    }
  };

  return { isLoading, chainStats };
}

export type NodeStatus = {
  execution?: {
    name: string;
    version: string;
    status: string;
    blockNumber: string;
  };
  consensus?: {
    name: string;
    version: string;
    status: string;
    blockNumber: string;
  };
};

export type NetworkStatus = {
  nodeStatus: NodeStatus;
  validators?: {
    total: number;
    balance: number;
    efectivity: number; // (typo kept as in source — probably meant "effectivity")
    attesting: number;
    proposals: number;
  };
  rewards?: {
    APR: number;
    ethPrice: number;
    "7days": number;
    "30days": number;
    "365days": number;
  };
};

type ChainStats = Record<Network, NetworkStatus>;
