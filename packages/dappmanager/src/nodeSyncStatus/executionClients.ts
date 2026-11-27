import { findMetric, MetricSample } from "./prometheus.js";
import { syncingPercent, toNumber } from "./utils.js";

/**
 * Per-client reading of an EC that is not at the head. Every client reports its sync differently
 * (fields of eth_syncing, what the latest block is, which metrics exist), so each has its own parser.
 * A parser returns null when it cannot tell more than the generic head-versus-target comparison.
 */

export type ExecutionClientKind = "geth" | "besu" | "erigon" | "nethermind" | "reth" | "other";

export type EthSyncingObject = Record<string, unknown>;

export type ExecutionPhaseInput = {
  syncing: false | EthSyncingObject;
  head: { number: number; timestamp: number };
  metrics: MetricSample[] | null;
  /** Block the EC should reach, from the CC head; null if unknown */
  target: number | null;
  /** True if the CC is at the head, so it is driving the EC with current forkchoice updates */
  ccAtHead: boolean;
};

export type ExecutionPhase = {
  phase: string;
  /** Progress of the phase, 0-99, or null if the client gives no way to measure it */
  percent?: number | null;
  /** The EC cannot progress until the CC drives it */
  waitingForConsensus?: boolean;
  /**
   * Block the client has reached in a phase measured in blocks. When set, progress, blocks behind and
   * the time left are computed from it and `target`, like the generic catch-up.
   */
  position?: number;
  target?: number;
};

export const WAITING_FOR_CONSENSUS = "Waiting for the consensus client";

export function getExecutionClientKind(name: string): ExecutionClientKind {
  const lower = name.toLowerCase();
  if (lower.includes("geth")) return "geth";
  if (lower.includes("besu")) return "besu";
  if (lower.includes("erigon")) return "erigon";
  if (lower.includes("nethermind")) return "nethermind";
  if (lower.includes("reth")) return "reth";
  return "other";
}

const field = (syncing: EthSyncingObject, key: string): number => toNumber(syncing[key]) ?? 0;

/** Nothing downloaded yet: the EC either waits for the CC or is fetching headers it sent */
const headersOrWaiting = (ccAtHead: boolean): ExecutionPhase =>
  ccAtHead
    ? { phase: "Downloading block headers", percent: null }
    : { phase: WAITING_FOR_CONSENSUS, percent: null, waitingForConsensus: true };

/**
 * Geth snap sync: the latest block stays at genesis until the state is complete. eth_syncing gives no
 * total for the state download; the snap progress metric does (v1.17.6+).
 */
export function gethPhase({ syncing, head, metrics, ccAtHead }: ExecutionPhaseInput): ExecutionPhase | null {
  if (syncing === false) return null;
  const current = field(syncing, "currentBlock");
  const highest = field(syncing, "highestBlock");
  if (current === 0 && highest === 0) return headersOrWaiting(ccAtHead);
  if (field(syncing, "healingTrienodes") + field(syncing, "healingBytecode") > 0) {
    return { phase: "Healing state", percent: null };
  }
  if (head.number === 0) {
    const stateProgress = findMetric(metrics, "eth_protocols_snap_sync_progress");
    if (stateProgress !== null) return { phase: "Downloading state", percent: syncingPercent(stateProgress, 1) };
    if (field(syncing, "syncedAccounts") > 0) return { phase: "Downloading state", percent: null };
    const chainProgress = findMetric(metrics, "eth_downloader_chain_progress");
    return {
      phase: "Downloading blocks",
      percent: chainProgress !== null ? syncingPercent(chainProgress, 1) : syncingPercent(current, highest)
    };
  }
  return null;
}

const besuSyncDuration = (metrics: MetricSample[] | null, name: string) =>
  findMetric(metrics, "besu_synchronizer_sync_duration_count", { name });

/**
 * Besu snap sync: up to 26.10 eth_syncing is false for the whole sync, so the phase comes from the
 * sync duration timers, whose count turns 1 when a phase ends. They only exist while this process runs a
 * snap sync, so a synced node that restarted has none of them.
 */
export function besuPhase({ syncing, metrics }: ExecutionPhaseInput): ExecutionPhase | null {
  const totalSync = besuSyncDuration(metrics, "TOTAL_SYNC_DURATION");
  if (totalSync !== null && totalSync > 0) return null;
  const worldState = besuSyncDuration(metrics, "SNAP_INITIAL_WORLD_STATE_DOWNLOAD_DURATION");
  const healing = besuSyncDuration(metrics, "SNAP_WORLD_STATE_HEALING_DURATION");
  const flatDbHeal = besuSyncDuration(metrics, "FLAT_DB_HEAL");
  const chainDownload = besuSyncDuration(metrics, "CHAIN_DOWNLOAD_DURATION");

  if (worldState === 0) return { phase: "Downloading state", percent: null };
  if (healing === 0) return { phase: "Healing state", percent: null };
  if (flatDbHeal === 0) return { phase: "Healing the flat database", percent: null };
  if (chainDownload === 0) {
    const percent =
      syncing === false
        ? null
        : syncingPercent(
            field(syncing, "currentBlock") - field(syncing, "startingBlock"),
            field(syncing, "highestBlock") - field(syncing, "startingBlock")
          );
    return { phase: "Downloading blocks", percent };
  }
  return null;
}

/**
 * Erigon: an empty `stages` list means the snapshot download, where currentBlock / highestBlock is the
 * share of bytes downloaded (v3.7+). After that it executes blocks; startingBlock resets on every
 * restart (v3.8+), so progress is measured on currentBlock only.
 */
export function erigonPhase({ syncing, target }: ExecutionPhaseInput): ExecutionPhase | null {
  if (syncing === false) return null;
  const current = field(syncing, "currentBlock");
  const highest = field(syncing, "highestBlock");
  const stages = Array.isArray(syncing.stages) ? syncing.stages : [];
  if (stages.length === 0) {
    if (highest === 0) return { phase: "Preparing the snapshot download", percent: null };
    const percent = syncingPercent(current, highest);
    // Indexing after the download leaves the numbers near the end for a long time, with nothing to measure
    if (percent !== null && percent >= 99) return { phase: "Indexing snapshots", percent: null };
    return { phase: "Downloading snapshots", percent };
  }
  return { phase: "Executing blocks", position: current, target: Math.max(highest, target ?? 0) };
}

/**
 * Nethermind: the latest block stays at genesis until the state sync ends, startingBlock is always 0,
 * and the state download has a measure only from 2.3 (warpChunksProcessed / warpChunksAmount).
 */
export function nethermindPhase({ syncing, ccAtHead }: ExecutionPhaseInput): ExecutionPhase | null {
  if (syncing === false) return null;
  const current = field(syncing, "currentBlock");
  const highest = field(syncing, "highestBlock");
  if (current === 0) {
    if (highest === 0) return headersOrWaiting(ccAtHead);
    const processed = field(syncing, "warpChunksProcessed");
    const amount = field(syncing, "warpChunksAmount");
    if (amount > 0) {
      return processed >= amount
        ? { phase: "Healing state", percent: null }
        : { phase: "Downloading state", percent: syncingPercent(processed, amount) };
    }
    return { phase: "Downloading headers and state", percent: null };
  }
  return { phase: "Catching up", position: current, target: highest };
}

/** Reth pipeline stages in run order, with their estimated share of the sync time and a label */
const RETH_STAGES: { name: string; weight: number; label: string }[] = [
  { name: "Era", weight: 0, label: "Importing history files" },
  { name: "Headers", weight: 5, label: "Downloading block headers" },
  { name: "Bodies", weight: 10, label: "Downloading blocks" },
  { name: "SenderRecovery", weight: 5, label: "Recovering transaction senders" },
  { name: "Execution", weight: 60, label: "Executing blocks" },
  { name: "PruneSenderRecovery", weight: 0, label: "Pruning" },
  { name: "MerkleUnwind", weight: 0, label: "Building the state trie" },
  { name: "AccountHashing", weight: 3, label: "Building the state trie" },
  { name: "StorageHashing", weight: 3, label: "Building the state trie" },
  { name: "MerkleExecute", weight: 4, label: "Building the state trie" },
  { name: "TransactionLookup", weight: 4, label: "Indexing" },
  { name: "IndexAccountHistory", weight: 3, label: "Indexing" },
  { name: "IndexStorageHistory", weight: 3, label: "Indexing" },
  { name: "Prune", weight: 0, label: "Pruning" },
  { name: "Finish", weight: 0, label: "Finishing" }
];

/** Blocks a stage may trail the target and still count as done */
const RETH_STAGE_TOLERANCE_BLOCKS = 32;

/**
 * Reth: highestBlock always equals currentBlock and the latest block only moves when the whole pipeline
 * finishes, so progress comes from the per-stage checkpoints in `stages`.
 */
export function rethPhase({ syncing, target, ccAtHead }: ExecutionPhaseInput): ExecutionPhase | null {
  if (syncing === false || !Array.isArray(syncing.stages)) return null;
  const stageBlocks = new Map<string, number>();
  for (const stage of syncing.stages as Record<string, unknown>[]) {
    const name = stage.name ?? stage.stage_name;
    const block = toNumber(stage.block ?? stage.block_number);
    if (typeof name === "string" && block !== null) stageBlocks.set(name, block);
  }
  if (stageBlocks.size === 0) return null;

  const current = field(syncing, "currentBlock");
  const start = field(syncing, "startingBlock");
  // Every stage at the head: either the short window after a restart, or no CC is driving the node
  if ([...stageBlocks.values()].every((block) => block === current)) {
    return ccAtHead ? null : { phase: WAITING_FOR_CONSENSUS, percent: null, waitingForConsensus: true };
  }

  const pipelineTarget = Math.max(target ?? 0, ...stageBlocks.values());
  let done = 0;
  let total = 0;
  let phase: string | null = null;
  for (const { name, weight, label } of RETH_STAGES) {
    const block = stageBlocks.get(name);
    if (block === undefined) continue;
    // Stages rebuilt from scratch (e.g. indices after a snapshot download) start below the session start
    const base = block >= start ? start : 0;
    const fraction = pipelineTarget > base ? Math.min(1, Math.max(0, (block - base) / (pipelineTarget - base))) : 1;
    done += weight * fraction;
    total += weight;
    if (phase === null && pipelineTarget - block > RETH_STAGE_TOLERANCE_BLOCKS) phase = label;
  }
  return { phase: phase ?? "Finishing", percent: syncingPercent(done, total) };
}

export const executionPhaseParsers: Record<ExecutionClientKind, (input: ExecutionPhaseInput) => ExecutionPhase | null> =
  {
    geth: gethPhase,
    besu: besuPhase,
    erigon: erigonPhase,
    nethermind: nethermindPhase,
    reth: rethPhase,
    other: () => null
  };

/** Work some clients still report through eth_syncing after reaching the head */
export function describeBackgroundWork(kind: ExecutionClientKind, syncing: false | EthSyncingObject): string | null {
  if (syncing === false) return null;
  switch (kind) {
    case "geth":
      if (field(syncing, "txIndexRemainingBlocks") > 0) return "Indexing transactions";
      if (field(syncing, "stateIndexRemaining") + field(syncing, "trienodeIndexRemaining") > 0) {
        return "Indexing state history";
      }
      return null;
    case "nethermind":
      return "Downloading old blocks and receipts";
    case "reth":
      // Right after a restart Reth reports syncing with every stage at the head: nothing to show
      return null;
    default:
      return "Finishing background sync tasks";
  }
}
