import { eventBus } from "@dappnode/eventbus";
import { params } from "@dappnode/params";
import { runOnlyOneSequentially, runAtMostEvery } from "@dappnode/utils";
import { logs } from "@dappnode/logger";
import { checkEthicalMetricsStatus } from "./checkEthicalMetricsStatus.js";
import { DappnodeInstaller } from "@dappnode/installer";

/**
 * Run the Ethical metrics daemon.
 * It will check that DMS, Exporter and Ethical metrics are installed and running if Ethical metrics is enabled
 */
export function startEthicalMetricsDaemon(dappnodeInstaller: DappnodeInstaller, signal: AbortSignal): void {
  const runEthicalMetricsTaskMemo = runOnlyOneSequentially(async () => {
    try {
      await checkEthicalMetricsStatus(dappnodeInstaller);
    } catch (e) {
      logs.error("Error on ethical metrics installer daemon", e);
    }
  });

  // Subscribe with a throttle to run only one time at once
  eventBus.runEthicalMetricsInstaller.on(() => runEthicalMetricsTaskMemo());

  runAtMostEvery(async () => runEthicalMetricsTaskMemo(), params.ETHICAL_METRICS_DAEMON_INTERVAL, signal);
}
