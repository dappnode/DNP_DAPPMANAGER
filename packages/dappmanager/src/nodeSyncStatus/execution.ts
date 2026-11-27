import { ClientData, DashboardSupportedNetwork } from "@dappnode/types";
import {
  describeBackgroundWork,
  EthSyncingObject,
  executionPhaseParsers,
  ExecutionClientKind,
  getExecutionClientKind,
  WAITING_FOR_CONSENSUS
} from "./executionClients.js";
import { MetricSample, parsePrometheus } from "./prometheus.js";
import { ProgressTracker } from "./progressTracker.js";
import { fetchJson, fetchOptional, syncingPercent, toNumber } from "./utils.js";

/** Blocks the EC head may trail the CC head and still count as synced */
export const EC_HEAD_TOLERANCE_BLOCKS = 32;
/** Age of the latest block after which the EC counts as behind, whatever eth_syncing says */
export const EC_HEAD_MAX_AGE_SECONDS = 3 * 60;
const OPTIONAL_REQUEST_TIMEOUT_MS = 2_000;

/** Prometheus endpoint of the clients whose metrics tell more than their JSON-RPC, as their packages expose it */
const METRICS_ENDPOINTS: Partial<Record<ExecutionClientKind, { port: number; path: string }>> = {
  geth: { port: 6060, path: "/debug/metrics/prometheus" },
  besu: { port: 9545, path: "/metrics" }
};

/** Nethermind health errors worth showing, from health_nodeStatus */
const NETHERMIND_HEALTH_ISSUES: Record<string, string> = {
  ClUnavailable: "Consensus client not connected",
  NoPeers: "No peers",
  LowDiskSpace: "Low disk space"
};

const ecHost = (network: DashboardSupportedNetwork) => `execution.${network}.dncore.dappnode`;

export type ExecutionRaw = {
  name: string;
  kind: ExecutionClientKind;
  syncing: false | EthSyncingObject;
  head: { number: number; timestamp: number };
  peers: number;
  /** Client metrics, only read while the EC is not at the head */
  metrics: MetricSample[] | null;
  /** Problems the client reports about itself, mapped to labels */
  healthIssues: string[];
};

/** What the CC tells about the chain, for judging the EC */
export type ConsensusContext = {
  reachable: boolean;
  atHead: boolean;
  /** Block the EC should be at, null when the CC is unreachable, behind or cannot give it */
  executionTarget: number | null;
};

async function ecRpc<T>(network: DashboardSupportedNetwork, method: string, params: unknown[] = []): Promise<T> {
  const data = (await fetchJson(`http://${ecHost(network)}:8545`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 })
  })) as { result?: T; error?: { message: string } };
  if (data.error) throw new Error(`${method} failed: ${data.error.message}`);
  return data.result as T;
}

async function getMetrics(network: DashboardSupportedNetwork, kind: ExecutionClientKind) {
  const endpoint = METRICS_ENDPOINTS[kind];
  if (!endpoint) return null;
  return fetchOptional(async (signal) => {
    const response = await fetch(`http://${ecHost(network)}:${endpoint.port}${endpoint.path}`, { signal });
    if (!response.ok) return null;
    return parsePrometheus(await response.text());
  }, OPTIONAL_REQUEST_TIMEOUT_MS);
}

async function getNethermindHealthIssues(network: DashboardSupportedNetwork): Promise<string[]> {
  const status = await fetchOptional(
    () => ecRpc<Record<string, unknown>>(network, "health_nodeStatus"),
    OPTIONAL_REQUEST_TIMEOUT_MS
  );
  const errors = status?.errors ?? status?.Errors;
  if (!Array.isArray(errors)) return [];
  return errors.flatMap((error) => (typeof error === "string" && NETHERMIND_HEALTH_ISSUES[error]) || []);
}

export async function fetchExecution(network: DashboardSupportedNetwork, nowMs: number): Promise<ExecutionRaw> {
  const [version, syncing, peerCount, block] = await Promise.all([
    ecRpc<string>(network, "web3_clientVersion"),
    ecRpc<false | EthSyncingObject>(network, "eth_syncing"),
    ecRpc<string>(network, "net_peerCount"),
    ecRpc<{ number: string; timestamp: string } | null>(network, "eth_getBlockByNumber", ["latest", false])
  ]);
  if (!block) throw new Error("eth_getBlockByNumber returned no latest block");
  const name = version.split("/")[0];
  const kind = getExecutionClientKind(name);
  const head = { number: toNumber(block.number) ?? 0, timestamp: toNumber(block.timestamp) ?? 0 };

  // Only a client that is not at the head needs the extra requests
  const mayBeBehind = syncing !== false || nowMs / 1000 - head.timestamp > EC_HEAD_MAX_AGE_SECONDS;
  const [metrics, healthIssues] = await Promise.all([
    mayBeBehind ? getMetrics(network, kind) : null,
    mayBeBehind && kind === "nethermind" ? getNethermindHealthIssues(network) : []
  ]);

  return { name, kind, syncing, head, peers: toNumber(peerCount) ?? 0, metrics, healthIssues };
}

/**
 * The EC counts as synced only if its latest block is recent and close to the CC head: clients report
 * eth_syncing false before reaching the head (Besu snap sync, a restart while the CC is silent) and an
 * object long after reaching it (Geth indexing, Nethermind old receipts). Otherwise a per-client parser
 * names the phase and measures it where the client allows.
 */
export function evaluateExecution(
  raw: ExecutionRaw,
  cc: ConsensusContext,
  secondsPerSlot: number,
  nowMs: number,
  tracker: ProgressTracker,
  trackerKey: string
): NonNullable<ClientData> {
  const { head, syncing, peers } = raw;
  const headAgeSeconds = Math.max(0, Math.round(nowMs / 1000 - head.timestamp));
  const target = cc.executionTarget;
  const isFresh = headAgeSeconds <= EC_HEAD_MAX_AGE_SECONDS;
  const isNearTarget = target === null || target - head.number <= EC_HEAD_TOLERANCE_BLOCKS;

  const issues = [...new Set([...(peers === 0 ? ["No peers"] : []), ...raw.healthIssues])];
  const details = {
    latestBlock: head.number,
    latestBlockAgeSeconds: headAgeSeconds,
    targetBlock: target,
    ethSyncing: syncing === false ? false : JSON.stringify(syncing)
  };
  const base = { name: raw.name, currentBlock: head.number, peers, details, ...(issues.length ? { issues } : {}) };

  if (isFresh && isNearTarget) {
    tracker.reset(trackerKey);
    const background = describeBackgroundWork(raw.kind, syncing);
    return { ...base, state: "synced", isSynced: true, progress: 100, ...(background ? { background } : {}) };
  }

  const report = executionPhaseParsers[raw.kind]({
    syncing,
    head,
    metrics: raw.metrics,
    target,
    ccAtHead: cc.atHead
  });

  if (report?.waitingForConsensus || (!report && !cc.atHead)) {
    tracker.reset(trackerKey);
    const phase = report?.phase ?? (cc.reachable ? "Waiting for the consensus client to sync" : WAITING_FOR_CONSENSUS);
    return { ...base, state: "waiting", isSynced: false, progress: 0, phase, phaseProgress: null };
  }

  // A phase measured as a percentage of its own work
  if (report && report.position === undefined) {
    const phaseProgress = report.percent ?? null;
    let etaSeconds: number | undefined;
    if (phaseProgress !== null) {
      const { ratePerSecond } = tracker.observe(trackerKey, report.phase, phaseProgress, nowMs);
      if (ratePerSecond !== null && ratePerSecond > 0) etaSeconds = Math.round((100 - phaseProgress) / ratePerSecond);
    } else {
      tracker.reset(trackerKey);
    }
    return withPeersCheck({
      ...base,
      state: "syncing",
      isSynced: false,
      progress: phaseProgress ?? 0,
      phase: report.phase,
      phaseProgress,
      ...(etaSeconds !== undefined ? { etaSeconds } : {})
    });
  }

  // A phase measured in blocks towards the head: catching up
  const position = report?.position ?? head.number;
  const blockTarget = Math.max(report?.target ?? 0, target ?? 0) || null;
  const phase = report?.phase ?? "Catching up";
  if (blockTarget === null || blockTarget <= position) {
    tracker.reset(trackerKey);
    const behind =
      head.number > 0
        ? { count: Math.round(headAgeSeconds / secondsPerSlot), unit: "blocks" as const, seconds: headAgeSeconds }
        : undefined;
    return withPeersCheck({
      ...base,
      state: "syncing",
      isSynced: false,
      progress: 0,
      phase,
      phaseProgress: null,
      ...(behind ? { behind } : {})
    });
  }

  const blocksBehind = blockTarget - position;
  const observation = tracker.observe(trackerKey, phase, position, nowMs);
  const phaseProgress = syncingPercent(position - observation.baseline, blockTarget - observation.baseline);
  const behind = { count: blocksBehind, unit: "blocks" as const, seconds: blocksBehind * secondsPerSlot };

  if (observation.isStalled) {
    return withPeersCheck({
      ...base,
      state: "stalled",
      isSynced: false,
      progress: phaseProgress ?? 0,
      phase: "Not making progress",
      phaseProgress,
      behind
    });
  }

  // The chain grows about one block per slot, so the gap closes at the sync rate minus that
  const closingRate = observation.ratePerSecond !== null ? observation.ratePerSecond - 1 / secondsPerSlot : null;
  const etaSeconds = closingRate !== null && closingRate > 0 ? Math.round(blocksBehind / closingRate) : undefined;
  return withPeersCheck({
    ...base,
    state: "syncing",
    isSynced: false,
    progress: phaseProgress ?? 0,
    phase,
    phaseProgress,
    behind,
    ...(etaSeconds !== undefined ? { etaSeconds } : {})
  });
}

/** A client that is not synced and has no peers cannot progress, whatever phase it is in */
function withPeersCheck(data: NonNullable<ClientData>): NonNullable<ClientData> {
  if (data.peers > 0) return data;
  return { ...data, state: "stalled", phase: `No peers (${data.phase ?? "syncing"})` };
}
