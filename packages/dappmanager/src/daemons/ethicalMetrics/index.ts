import { eventBus } from "@dappnode/eventbus";
import { params } from "@dappnode/params";
import { runOnlyOneSequentially } from "../../utils/asyncFlows.js";
import { runAtMostEvery } from "../../utils/asyncFlows.js";
import { logs } from "@dappnode/logger";
import { checkEthicalMetricsStatus } from "./checkEthicalMetricsStatus.js";
import { getRandomizedInterval } from "../../utils/getRandomizedInterval.js";

/**
 * Run the Ethical metrics daemon.
 * It will check that DMS, Exporter and Ethical metrics are installed and running if Ethical metrics is enabled
 */
export function startEthicalMetricsDaemon(signal: AbortSignal): void {
  const runEthicalMetricsTaskMemo = runOnlyOneSequentially(async () => {
    try {
      await checkEthicalMetricsStatus();
    } catch (e) {
      logs.error("Error on ethical metrics installer daemon", e);
    }
  });

  // Subscribe with a throttle to run only one time at once
  eventBus.runEthicalMetricsInstaller.on(() => runEthicalMetricsTaskMemo());

  runAtMostEvery(
    async () => runEthicalMetricsTaskMemo(),
    getRandomizedInterval(
      params.ETH_METRICS_DAEMON_INTERVAL,
      params.ETH_METRICS_DAEMON_INTERVAL_VARIATION
    ),
    signal
  );
}
