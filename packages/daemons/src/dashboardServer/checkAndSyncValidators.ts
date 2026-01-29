import { logs } from "@dappnode/logger";
import { listPackageNoThrow } from "@dappnode/dockerapi";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
import { Network } from "@dappnode/types";
import {
  fetchBrainValidators,
  postValidatorsToDashboard,
  parseBrainValidatorsResponseToIndices,
  diffIndices,
  createSnapshot,
  supportedNetworks,
  getWeb3signerDnpName,
  PostReason,
  IndicesDiff
} from "@dappnode/dashboard-server";

/**
 * Check and sync validators to dashboard server for all supported networks.
 * This is the main entry point called by the daemon scheduler.
 */
export async function checkAndSyncValidators(): Promise<void> {
  const baseUrl = params.DASHBOARD_SERVER_BASE_URL;

  // Feature is disabled if base URL is not set
  if (!baseUrl) {
    return;
  }

  const postInterval = params.DASHBOARD_SERVER_POST_INTERVAL;

  for (const network of supportedNetworks) {
    try {
      await checkAndSyncNetworkValidators(network, baseUrl, postInterval);
    } catch (e) {
      logs.error(`Dashboard server: error processing ${network}`, e);
    }
  }
}

/**
 * Check and sync validators for a single network.
 * Fetches current indices, detects changes, and posts to dashboard if needed.
 */
async function checkAndSyncNetworkValidators(
  network: Network,
  baseUrl: string,
  postInterval: number
): Promise<void> {
  const isSignerInstalled = await checkSignerInstalled(network);
  if (!isSignerInstalled) {
    return;
  }

  const indices = await fetchAndParseValidatorIndices(network);
  if (!indices) {
    return;
  }

  if (indices.length === 0) {
    logs.debug(`Dashboard server: no validators for ${network}, skipping POST`);
    return;
  }

  const reason = determinePostReason(network, indices, postInterval);
  if (!reason) {
    return;
  }

  await postIndicesToDashboard(network, baseUrl, indices, reason);
}

/**
 * Check if web3signer is installed for the given network.
 */
async function checkSignerInstalled(network: Network): Promise<boolean> {
  const signerDnpName = getWeb3signerDnpName(network);
  const signerPkg = await listPackageNoThrow({ dnpName: signerDnpName });
  return Boolean(signerPkg);
}

/**
 * Fetch validators from brain and parse them into indices.
 * Returns null if fetching fails.
 */
async function fetchAndParseValidatorIndices(network: Network): Promise<number[] | null> {
  const brainResponse = await fetchBrainValidatorsSafe(network);
  if (brainResponse === null) {
    return null;
  }

  const { indices, invalidCount } = parseBrainValidatorsResponseToIndices(brainResponse);

  if (invalidCount > 0) {
    logs.warn(`Dashboard server: skipped ${invalidCount} invalid indices for ${network}`);
  }

  return indices;
}

/**
 * Safely fetch brain validators, returning null on error.
 */
async function fetchBrainValidatorsSafe(network: Network): Promise<Awaited<ReturnType<typeof fetchBrainValidators>> | null> {
  try {
    return await fetchBrainValidators(network);
  } catch (e) {
    logs.warn(`Dashboard server: failed to fetch brain validators for ${network}`, e);
    return null;
  }
}

/**
 * Determine if we need to post to dashboard server and why.
 * Returns the reason for posting, or null if no post is needed.
 */
function determinePostReason(
  network: Network,
  indices: number[],
  postInterval: number
): PostReason | null {
  const lastSnapshot = db.dashboardServerLastSnapshot.get(network);
  const lastPostTimestamp = db.dashboardServerLastPostTimestamp.get(network);
  const now = Date.now();

  const diff = diffIndices(lastSnapshot?.indices ?? null, indices);

  if (diff.hasChanged) {
    logChangeDetected(network, diff);
    return "changed";
  }

  if (isIntervalElapsed(lastPostTimestamp, now, postInterval)) {
    logs.info(
      `Dashboard server: interval trigger for ${network} ` +
      `(${indices.length} validators)`
    );
    return "interval";
  }

  return null;
}

/**
 * Check if enough time has elapsed since last post.
 */
function isIntervalElapsed(
  lastPostTimestamp: number | undefined,
  now: number,
  postInterval: number
): boolean {
  return !lastPostTimestamp || now - lastPostTimestamp >= postInterval;
}

/**
 * Log details about detected changes.
 */
function logChangeDetected(network: Network, diff: IndicesDiff): void {
  logs.info(
    `Dashboard server: change detected for ${network}: ` +
    `${diff.oldCount} -> ${diff.newCount} validators, ` +
    `added: ${diff.added.length}, removed: ${diff.removed.length}`
  );
}

/**
 * Post validator indices to dashboard server and update DB state on success.
 */
async function postIndicesToDashboard(
  network: Network,
  baseUrl: string,
  indices: number[],
  reason: PostReason
): Promise<void> {
  try {
    const response = await postValidatorsToDashboard(baseUrl, indices);
    logs.info(
      `Dashboard server: POST successful for ${network}, ` +
      `reason: ${reason}, indices_count: ${indices.length}, ` +
      `set_hash: ${response.set_hash}`
    );

    updateDbStateOnSuccess(network, indices);
  } catch (e) {
    logs.error(
      `Dashboard server: POST failed for ${network}, ` +
      `reason: ${reason}, indices_count: ${indices.length}`,
      e
    );
    // Don't update DB state on failure - will retry next poll
  }
}

/**
 * Update DB state after successful post.
 */
function updateDbStateOnSuccess(network: Network, indices: number[]): void {
  const snapshot = createSnapshot(indices);
  db.dashboardServerLastSnapshot.set(network, snapshot);
  db.dashboardServerLastPostTimestamp.set(network, Date.now());
}
