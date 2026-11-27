import { Network } from "./stakers.js";

export type DashboardSupportedNetwork =
  Network.Mainnet | Network.Gnosis | Network.Lukso | Network.Hoodi | Network.Sepolia;

/**
 * - synced: at the chain head and ready to validate
 * - syncing: making progress towards the head
 * - waiting: blocked on the other client (an EC with no CC driving it, a CC waiting for its EC)
 * - stalled: not at the head and not progressing, e.g. no peers
 */
export type ClientSyncState = "synced" | "syncing" | "waiting" | "stalled";

export type ClientData = {
  name: string;
  state: ClientSyncState;
  /** Same as state === "synced", kept for older consumers of this API */
  isSynced: boolean;
  /** Execution block number, or consensus slot */
  currentBlock: number;
  /** 0-100, kept for older consumers of this API: 100 when synced, 0 when unknown */
  progress: number;
  peers: number;
  /** What the client is doing while not synced, e.g. "Downloading state" */
  phase?: string;
  /** Progress of the current phase, 0-99, or null when the client gives no way to measure it */
  phaseProgress?: number | null;
  /** How far the client is behind the chain head, when known */
  behind?: { count: number; unit: "blocks" | "slots"; seconds?: number };
  /** Estimated seconds until the current phase ends, when it can be estimated */
  etaSeconds?: number;
  /** Work still running after the client reached the head, e.g. "Indexing transactions" */
  background?: string;
  /** Problems worth flagging, e.g. "No peers" */
  issues?: string[];
  /** Raw values behind the status, for troubleshooting */
  details?: Record<string, string | number | boolean | null>;
} | null;

/**
 * - starting: the container runs but its API does not answer yet (checkpoint or snapshot download, database opening)
 * - stopped: the container is not running
 * - unresponsive: the container runs but the API timed out, e.g. busy syncing
 */
export type ClientErrorReason = "starting" | "stopped" | "unresponsive";

export type ClientError = {
  error: string;
  reason?: ClientErrorReason;
};

export type ClientResult = ClientData | ClientError;

export type NodeStatus = { ec: ClientResult; cc: ClientResult };

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

export type ValidatorsNetworkData = {
  active: { validators: string[]; beaconError?: Error } | null;
  attesting: { validators: string[]; beaconError?: Error } | null;
  balances: { balances: Record<string, string>; beaconError?: Error } | null;
};

export type ValidatorsDataByNetwork = Partial<Record<DashboardSupportedNetwork, ValidatorsNetworkData>>;
