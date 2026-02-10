import { Network } from "./stakers.js";

export type DashboardSupportedNetwork =
  | Network.Mainnet
  | Network.Gnosis
  | Network.Lukso
  | Network.Hoodi
  | Network.Sepolia;

export type ClientData = {
  name: string;
  isSynced: boolean;
  currentBlock: number;
  progress: number;
  peers: number;
} | null;

export type NodeStatus = { ec: ClientData; cc: ClientData };

export type NetworkStatus = {
  nodeStatus: NodeStatus | undefined;
  clientsDnps?: {
    ecDnp: string | null;
    ccDnp: string | null;
  };
  validators?: {
    total: number;
    balance: number;
    attesting: number;
    beaconError?: Error;
    signerStatus: SignerStatus;
  };
  hasValidators: boolean; // Whether this network has validators
  hasRewardsCard: boolean; // Whether this network has to display rewards cards to redirect to beaconcha.in or similar
};

export type SignerStatus = {
  isInstalled: boolean;
  brainRunning: boolean;
};

export type NetworkStats = Partial<Record<DashboardSupportedNetwork, NetworkStatus>>;

export type NodeStatusByNetwork = Partial<Record<DashboardSupportedNetwork, NodeStatus>>;
