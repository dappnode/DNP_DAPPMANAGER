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
  PostReason
} from "@dappnode/dashboard-server";

/**
 * Check dashboard server status for all supported networks.
 * This is the main entry point called by the daemon scheduler.
 */
export async function checkDashboardServerStatus(): Promise<void> {
  const baseUrl = params.DASHBOARD_SERVER_BASE_URL;

  // Feature is disabled if base URL is not set
  if (!baseUrl) {
    return;
  }

  const postInterval = params.DASHBOARD_SERVER_POST_INTERVAL;

  for (const network of supportedNetworks) {
    try {
      await processNetworkValidators(network, baseUrl, postInterval);
    } catch (e) {
      logs.error(`Dashboard server: error processing ${network}`, e);
    }
  }
}

/**
 * Process validators for a single network.
 * Fetches current indices, detects changes, and posts to dashboard if needed.
 */
async function processNetworkValidators(
  network: Network,
  baseUrl: string,
  postInterval: number
): Promise<void> {
  // Check if web3signer is installed for this network
  const signerDnpName = getWeb3signerDnpName(network);
  const signerPkg = await listPackageNoThrow({ dnpName: signerDnpName });

  if (!signerPkg) {
    // Web3signer not installed for this network, skip
    return;
  }

  // Fetch current validators from brain
  let brainResponse;
  try {
    brainResponse = await fetchBrainValidators(network);
  } catch (e) {
    logs.warn(`Dashboard server: failed to fetch brain validators for ${network}`, e);
    return;
  }

  // Parse and normalize indices
  const { indices, invalidCount } = parseBrainValidatorsResponseToIndices(brainResponse);

  if (invalidCount > 0) {
    logs.warn(`Dashboard server: skipped ${invalidCount} invalid indices for ${network}`);
  }

  // If no validators, skip posting
  if (indices.length === 0) {
    logs.debug(`Dashboard server: no validators for ${network}, skipping POST`);
    return;
  }

  // Get previous state
  const lastSnapshot = db.dashboardServerLastSnapshot.get(network);
  const lastPostTimestamp = db.dashboardServerLastPostTimestamp.get(network);

  // Determine if we need to post
  const now = Date.now();
  let reason: PostReason | null = null;

  // Check for changes
  const diff = diffIndices(lastSnapshot?.indices ?? null, indices);

  if (diff.hasChanged) {
    reason = "changed";
    logs.info(
      `Dashboard server: change detected for ${network}: ` +
      `${diff.oldCount} -> ${diff.newCount} validators, ` +
      `added: ${diff.added.length}, removed: ${diff.removed.length}`
    );
  } else if (!lastPostTimestamp || now - lastPostTimestamp >= postInterval) {
    // Interval trigger: 12 hours since last post
    reason = "interval";
    logs.info(
      `Dashboard server: interval trigger for ${network} ` +
      `(${indices.length} validators)`
    );
  }

  if (!reason) {
    // No need to post
    return;
  }

  // Post to dashboard server
  try {
    const response = await postValidatorsToDashboard(baseUrl, indices);
    logs.info(
      `Dashboard server: POST successful for ${network}, ` +
      `reason: ${reason}, indices_count: ${indices.length}, ` +
      `set_hash: ${response.set_hash}`
    );

    // Update DB state on success
    const snapshot = createSnapshot(indices);
    db.dashboardServerLastSnapshot.set(network, snapshot);
    db.dashboardServerLastPostTimestamp.set(network, now);
  } catch (e) {
    logs.error(
      `Dashboard server: POST failed for ${network}, ` +
      `reason: ${reason}, indices_count: ${indices.length}`,
      e
    );
    // Don't update DB state on failure - will retry next poll
  }
}
