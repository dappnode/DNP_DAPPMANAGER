import { Network } from "@dappnode/types";

/**
 * Response from the brain web3signer API: GET /api/v0/brain/validators?format=index
 * Shape: object mapping tag => array of index strings
 * Example:
 *   {
 *     "lido": ["12345", "67890"],
 *     "solo": ["111", "222"]
 *   }
 */
export type BrainValidatorsResponse = Record<string, string[]>;

/**
 * Request body for the dashboard server POST /validators endpoint
 */
export interface DashboardServerPostRequest {
  indices: number[];
}

/**
 * Response from the dashboard server POST /validators endpoint
 */
export interface DashboardServerPostResponse {
  message: string;
  set_hash: string;
}

/**
 * Reason for posting to the dashboard server
 */
export type PostReason = "interval" | "changed";

/**
 * Snapshot of validator indices for a network, used for change detection
 */
export interface ValidatorSnapshot {
  /** Sorted array of unique validator indices */
  indices: number[];
  /** Timestamp when this snapshot was taken */
  timestamp: number;
}

/**
 * State stored per network to track changes
 */
export interface NetworkValidatorState {
  network: Network;
  lastSnapshot: ValidatorSnapshot | null;
  lastPostTimestamp: number | null;
}

/**
 * Result of diffing two snapshots
 */
export interface IndicesDiff {
  /** Whether the sets are different */
  hasChanged: boolean;
  /** Indices present in new but not in old */
  added: number[];
  /** Indices present in old but not in new */
  removed: number[];
  /** Count of indices in old snapshot */
  oldCount: number;
  /** Count of indices in new snapshot */
  newCount: number;
}

/**
 * Configuration for the dashboard server feature
 */
export interface DashboardServerConfig {
  /** Base URL for the dashboard server API */
  baseUrl: string;
  /** Whether the feature is enabled */
  enabled: boolean;
}
