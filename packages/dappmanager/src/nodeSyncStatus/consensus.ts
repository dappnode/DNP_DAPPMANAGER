import { ClientData, DashboardSupportedNetwork } from "@dappnode/types";
import { ProgressTracker } from "./progressTracker.js";
import { fetchJson, fetchOptional, syncingPercent, toNumber } from "./utils.js";

/** Slots the CC head may trail the wall clock and still count as at the head (missed slots are normal) */
export const CC_HEAD_TOLERANCE_SLOTS = 8;
const OPTIONAL_REQUEST_TIMEOUT_MS = 2_000;

const ccBaseUrl = (network: DashboardSupportedNetwork) => `http://beacon-chain.${network}.dncore.dappnode:3500`;

export type ConsensusClock = { genesisTime: number; secondsPerSlot: number };

/** What the CC's standard beacon API returned, before interpretation */
export type ConsensusRaw = {
  name: string;
  syncing: {
    is_syncing: boolean;
    head_slot: string;
    sync_distance: string;
    is_optimistic?: boolean;
    el_offline?: boolean;
  };
  peers: number;
  /** Null if genesis or spec could not be read: then only sync_distance tells how far behind the CC is */
  clock: ConsensusClock | null;
  /** Execution block number of the CC head, null if the CC cannot give it (anchor block missing, pre-merge, after Gloas) */
  headExecutionBlock: number | null;
};

export type ConsensusEvaluation = {
  data: NonNullable<ClientData>;
  /** True if the CC head is at the wall clock, whether or not its EC has validated it */
  atHead: boolean;
  /** Block the EC should be at, only given when the CC is at the head so the number is current */
  executionTarget: number | null;
};

/** Genesis time and slot length never change, so they are read once per network */
const clockCache = new Map<DashboardSupportedNetwork, ConsensusClock>();

async function getClock(network: DashboardSupportedNetwork): Promise<ConsensusClock | null> {
  const cached = clockCache.get(network);
  if (cached) return cached;
  return fetchOptional(async (signal) => {
    const [genesis, spec] = (await Promise.all([
      fetchJson(`${ccBaseUrl(network)}/eth/v1/beacon/genesis`, { signal }),
      fetchJson(`${ccBaseUrl(network)}/eth/v1/config/spec`, { signal })
    ])) as [{ data: { genesis_time: string } }, { data: { SECONDS_PER_SLOT: string } }];
    const genesisTime = toNumber(genesis.data.genesis_time);
    const secondsPerSlot = toNumber(spec.data.SECONDS_PER_SLOT);
    if (genesisTime === null || secondsPerSlot === null || secondsPerSlot <= 0) return null;
    const clock = { genesisTime, secondsPerSlot };
    clockCache.set(network, clock);
    return clock;
  }, OPTIONAL_REQUEST_TIMEOUT_MS);
}

async function getHeadExecutionBlock(network: DashboardSupportedNetwork): Promise<number | null> {
  return fetchOptional(async (signal) => {
    const block = (await fetchJson(`${ccBaseUrl(network)}/eth/v1/beacon/blinded_blocks/head`, { signal })) as {
      data?: { message?: { body?: { execution_payload_header?: { block_number?: string } } } };
    };
    const blockNumber = toNumber(block.data?.message?.body?.execution_payload_header?.block_number);
    return blockNumber !== null && blockNumber > 0 ? blockNumber : null;
  }, OPTIONAL_REQUEST_TIMEOUT_MS);
}

export async function fetchConsensus(network: DashboardSupportedNetwork): Promise<ConsensusRaw> {
  const base = ccBaseUrl(network);
  const [version, syncing, peerCount, clock, headExecutionBlock] = await Promise.all([
    fetchJson(`${base}/eth/v1/node/version`) as Promise<{ data: { version: string } }>,
    fetchJson(`${base}/eth/v1/node/syncing`) as Promise<{ data: ConsensusRaw["syncing"] }>,
    fetchJson(`${base}/eth/v1/node/peer_count`) as Promise<{ data: { connected: string } }>,
    getClock(network),
    getHeadExecutionBlock(network)
  ]);
  return {
    name: version.data.version.split("/")[0],
    syncing: syncing.data,
    peers: toNumber(peerCount.data.connected) ?? 0,
    clock,
    headExecutionBlock
  };
}

/**
 * Clients disagree on what is_syncing means: some report false while stalled, without peers, just after a
 * restart, or with their EC still syncing. So the head is checked against the wall clock, and a node only
 * counts as synced when its head is current, validated by its EC (not optimistic) and its EC is online.
 */
export function evaluateConsensus(
  raw: ConsensusRaw,
  nowMs: number,
  tracker: ProgressTracker,
  trackerKey: string
): ConsensusEvaluation {
  const { syncing, peers, clock } = raw;
  const headSlot = toNumber(syncing.head_slot) ?? 0;
  const syncDistance = toNumber(syncing.sync_distance) ?? 0;
  const wallSlot = clock ? Math.floor((nowMs / 1000 - clock.genesisTime) / clock.secondsPerSlot) : null;
  const slotsBehind = wallSlot !== null ? Math.max(0, wallSlot - headSlot) : syncDistance;
  const atHead = slotsBehind <= CC_HEAD_TOLERANCE_SLOTS && (wallSlot !== null || !syncing.is_syncing);

  const issues: string[] = [];
  if (peers === 0) issues.push("No peers");
  if (syncing.el_offline) issues.push("Execution client offline");

  const details = {
    headSlot,
    wallSlot,
    syncDistance,
    isSyncing: syncing.is_syncing,
    isOptimistic: syncing.is_optimistic ?? null,
    elOffline: syncing.el_offline ?? null,
    headExecutionBlock: raw.headExecutionBlock
  };
  const base = { name: raw.name, currentBlock: headSlot, peers, details, ...(issues.length ? { issues } : {}) };
  const executionTarget = atHead ? raw.headExecutionBlock : null;

  if (atHead) {
    tracker.reset(trackerKey);
    if (syncing.el_offline || syncing.is_optimistic) {
      const phase = syncing.el_offline ? "Execution client offline" : "Waiting for the execution client to sync";
      return {
        atHead,
        executionTarget,
        data: { ...base, state: "waiting", isSynced: false, progress: 0, phase, phaseProgress: null }
      };
    }
    return { atHead, executionTarget, data: { ...base, state: "synced", isSynced: true, progress: 100 } };
  }

  const behind = {
    count: slotsBehind,
    unit: "slots" as const,
    ...(clock ? { seconds: slotsBehind * clock.secondsPerSlot } : {})
  };

  if (peers === 0) {
    return {
      atHead,
      executionTarget,
      data: { ...base, state: "stalled", isSynced: false, progress: 0, phase: "No peers", phaseProgress: null, behind }
    };
  }

  const phase = "Syncing the beacon chain";
  const observation = tracker.observe(trackerKey, phase, headSlot, nowMs);
  const phaseProgress =
    wallSlot !== null ? syncingPercent(headSlot - observation.baseline, wallSlot - observation.baseline) : null;

  if (observation.isStalled) {
    return {
      atHead,
      executionTarget,
      data: {
        ...base,
        state: "stalled",
        isSynced: false,
        progress: phaseProgress ?? 0,
        phase: "Not making progress",
        phaseProgress,
        behind
      }
    };
  }

  // The wall clock moves one slot per slot time, so the gap closes at the sync rate minus that
  const closingRate =
    observation.ratePerSecond !== null && clock ? observation.ratePerSecond - 1 / clock.secondsPerSlot : null;
  const etaSeconds = closingRate !== null && closingRate > 0 ? Math.round(slotsBehind / closingRate) : undefined;

  return {
    atHead,
    executionTarget,
    data: {
      ...base,
      state: "syncing",
      isSynced: false,
      progress: phaseProgress ?? 0,
      phase,
      phaseProgress,
      behind,
      ...(etaSeconds !== undefined ? { etaSeconds } : {})
    }
  };
}
