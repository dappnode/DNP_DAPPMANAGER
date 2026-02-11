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
    pubKeys?: string[]; // Validator public keys used for beaconcha.in dynamic dashboard URLs
  };
  hasValidators: boolean; // Whether this network has validators
  beaconExplorer?: { url: string; name: string }; // Whether this network has a beacon explorer to redirect to for validator rewards
};

export type SignerStatus = {
  isInstalled: boolean;
  brainRunning: boolean;
};

export type NetworkStats = Partial<Record<DashboardSupportedNetwork, NetworkStatus>>;

export type NodeStatusByNetwork = Partial<Record<DashboardSupportedNetwork, NodeStatus>>;
