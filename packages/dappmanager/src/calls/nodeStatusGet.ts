import { listPackageNoThrow } from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import {
  ClientError,
  ClientErrorReason,
  ClientResult,
  DashboardSupportedNetwork,
  Network,
  NodeStatusByNetwork
} from "@dappnode/types";
import { evaluateConsensus, fetchConsensus } from "../nodeSyncStatus/consensus.js";
import { ConsensusContext, evaluateExecution, fetchExecution } from "../nodeSyncStatus/execution.js";
import { progressTracker } from "../nodeSyncStatus/progressTracker.js";
import { isConnectionError } from "../nodeSyncStatus/utils.js";
import { consensusClientsGetByNetworks } from "./consensusClientGet.js";
import { executionClientsGetByNetworks } from "./executionClientGet.js";

/** Timeout in milliseconds for each individual client request group (EC or CC) */
const CLIENT_TIMEOUT_MS = 5_000;

/** Seconds per slot, which is also about the time per execution block */
const SECONDS_PER_SLOT: Record<DashboardSupportedNetwork, number> = {
  [Network.Mainnet]: 12,
  [Network.Gnosis]: 5,
  [Network.Lukso]: 12,
  [Network.Hoodi]: 12,
  [Network.Sepolia]: 12
};

class TimeoutError extends Error {}

type Settled<T> = { ok: true; value: T } | { ok: false; error: unknown };

/** Runs a client request group within CLIENT_TIMEOUT_MS, returning its error instead of throwing */
async function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  let timer: NodeJS.Timeout | undefined;
  try {
    const value = await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new TimeoutError(`Timeout after ${CLIENT_TIMEOUT_MS}ms`)), CLIENT_TIMEOUT_MS);
      })
    ]);
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Tells a client that is still starting (its container runs but its API does not answer yet, as during a
 * checkpoint or snapshot download) from one that is stopped or too busy to answer.
 */
async function getErrorReason(
  dnpName: string | null | undefined,
  error: unknown
): Promise<ClientErrorReason | undefined> {
  if (!dnpName) return undefined;
  const dnp = await listPackageNoThrow({ dnpName }).catch(() => null);
  if (!dnp || !dnp.containers.some((container) => container.running)) return "stopped";
  if (error instanceof TimeoutError) return "unresponsive";
  if (isConnectionError(error)) return "starting";
  return undefined;
}

async function toClientError(
  network: DashboardSupportedNetwork,
  layer: "execution" | "consensus",
  error: unknown
): Promise<ClientError> {
  const message = error instanceof Error ? error.message : String(error);
  logs.error(`Error fetching ${layer} client status for ${network}: ${message}`);
  const getClients = layer === "execution" ? executionClientsGetByNetworks : consensusClientsGetByNetworks;
  const dnpName = (await getClients({ networks: [network] }))[network];
  const reason = await getErrorReason(dnpName, error);
  return { error: `Failed to fetch RPC: ${message}`, ...(reason ? { reason } : {}) };
}

async function getNodeStatus(network: DashboardSupportedNetwork): Promise<{ ec: ClientResult; cc: ClientResult }> {
  const [ccRaw, ecRaw] = await Promise.all([
    settle(fetchConsensus(network)),
    settle(fetchExecution(network, Date.now()))
  ]);
  const nowMs = Date.now();

  // The EC is judged against the CC's view of the chain, so the CC is evaluated first
  const ccEvaluation = ccRaw.ok ? evaluateConsensus(ccRaw.value, nowMs, progressTracker, `${network}:cc`) : null;
  const ccContext: ConsensusContext = ccEvaluation
    ? { reachable: true, atHead: ccEvaluation.atHead, executionTarget: ccEvaluation.executionTarget }
    : { reachable: false, atHead: false, executionTarget: null };

  const [cc, ec] = await Promise.all([
    ccEvaluation ? ccEvaluation.data : toClientError(network, "consensus", ccRaw.ok ? null : ccRaw.error),
    ecRaw.ok
      ? evaluateExecution(ecRaw.value, ccContext, SECONDS_PER_SLOT[network], nowMs, progressTracker, `${network}:ec`)
      : toClientError(network, "execution", ecRaw.error)
  ]);
  return { ec, cc };
}

export async function nodeStatusGetByNetwork({ networks }: { networks: DashboardSupportedNetwork[] }) {
  const resultsByNetwork: NodeStatusByNetwork = {};
  await Promise.all(
    networks.map(async (network) => {
      resultsByNetwork[network] = await getNodeStatus(network);
    })
  );
  return resultsByNetwork;
}
