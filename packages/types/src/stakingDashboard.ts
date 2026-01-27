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
  rewards?: {
    APR: number;
    ethPrice: number;
    "7days": number;
    "30days": number;
    "365days": number;
    efectivity: number; // Even though this is validator data, it is retrieved from Beaconcha.in API along with rewards data
    proposals: number; // Even though this is validator data, it is retrieved from Beaconcha.in API along with rewards data
    beaconchaConsent: boolean; // Whether the user has given consent to share validators data with Beaconcha.in
  };
  hasValidators: boolean; // Whether this network has validators
  hasRewardsData: boolean; // Whether this network can retrieve rewards data from Beaconcha.in API
};

export type SignerStatus = {
  isInstalled: boolean;
  brainRunning: boolean;
};

export type NetworkStats = Partial<Record<DashboardSupportedNetwork, NetworkStatus>>;

export type NodeStatusByNetwork = Partial<Record<DashboardSupportedNetwork, NodeStatus>>;

export type BeaconchaSharingConsent = Partial<Record<DashboardSupportedNetwork, boolean>>;
