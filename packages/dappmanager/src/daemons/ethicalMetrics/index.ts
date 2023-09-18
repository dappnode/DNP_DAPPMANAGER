import { eventBus } from "../../eventBus.js";
import params from "../../params.js";
import { runOnlyOneSequentially } from "../../utils/asyncFlows.js";
import { runAtMostEvery } from "../../utils/asyncFlows.js";
import { logs } from "../../logs.js";
import { checkEthicalMetricsStatus } from "./checkEthicalMetricsStatus.js";

/**
 * Randomize an interval
 * 
 * Example:
 * getRandomizedInterval(50, 10) // 50 +/- 10 = [40, 60]
 * 
 * @param baseInterval
 * @param variation 
 * @returns 
 */
function getRandomizedInterval(baseInterval: number, variation: number): number {
  const randomAdjustment = Math.round((Math.random() * 2 - 1) * variation); // Random integer between -variation and +variation
  return baseInterval + randomAdjustment;
}

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
    getRandomizedInterval(params.ETH_METRICS_DAEMON_INTERVAL, params.ETH_METRICS_DAEMON_INTERVAL_VARIATION),
    signal
  );
}
