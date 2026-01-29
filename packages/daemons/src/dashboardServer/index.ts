import { params } from "@dappnode/params";
import { runOnlyOneSequentially, runAtMostEvery } from "@dappnode/utils";
import { logs } from "@dappnode/logger";
import { checkDashboardServerStatus } from "./checkDashboardServerStatus.js";

/**
 * Run the Dashboard Server daemon.
 * It will periodically check for validator changes and POST to the dashboard server.
 *
 * The daemon is disabled if DASHBOARD_SERVER_BASE_URL is not set.
 *
 * Two triggers:
 * 1. Every POLL_INTERVAL (default 2m): Check for changes and POST if changed
 * 2. Every POST_INTERVAL (default 12h): Force POST regardless of changes
 */
export function startDashboardServerDaemon(signal: AbortSignal): void {
  const baseUrl = params.DASHBOARD_SERVER_BASE_URL;

  // Feature disabled if base URL not configured
  if (!baseUrl) {
    logs.info("Dashboard server daemon: disabled (DASHBOARD_SERVER_BASE_URL not set)");
    return;
  }

  logs.info(`Dashboard server daemon: enabled, polling every ${params.DASHBOARD_SERVER_POLL_INTERVAL / 1000}s, POST interval ${params.DASHBOARD_SERVER_POST_INTERVAL / 1000 / 60 / 60}h`);

  const runDashboardServerTaskMemo = runOnlyOneSequentially(async () => {
    try {
      await checkDashboardServerStatus();
    } catch (e) {
      logs.error("Error on dashboard server daemon", e);
    }
  });

  // Run periodically at the poll interval (default 2 minutes)
  // The checkDashboardServerStatus function handles both change detection
  // and interval-based posting internally
  runAtMostEvery(
    async () => runDashboardServerTaskMemo(),
    params.DASHBOARD_SERVER_POLL_INTERVAL,
    signal
  );
}
