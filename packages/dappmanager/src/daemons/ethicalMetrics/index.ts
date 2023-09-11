import { eventBus } from "../../eventBus.js";
import params from "../../params.js";
import { runOnlyOneSequentially } from "../../utils/asyncFlows.js";
import { runAtMostEvery } from "../../utils/asyncFlows.js";
import { logs } from "../../logs.js";
import { packageInstall } from "../../calls/index.js";
import { listPackageNoThrow } from "../../modules/docker/list/listPackages.js";
import { dockerComposeUpPackage } from "../../modules/docker/index.js";
import * as db from "../../db/index.js";
import {
  ethicalMetricsDnpName,
  getInstance,
  register
} from "../../modules/ethicalMetrics/index.js";

/**
 * Make sure that on Ethical metrics enabled and existing email,
 * the packages exporter, DMS and Ethical metrics are installed and running
 */
async function checkEthicalMetricsStatus(): Promise<void> {
  const exporterDnpName = "dappnode-exporter.dnp.dappnode.eth";
  const dmsDnpName = "dms.dnp.dappnode.eth";

  try {
    const isEnabled = db.ethicalMetricsStatus.get();
    if (isEnabled) {
      const mail = db.ethicalMetricsMail.get();
      if (!mail) throw Error("Email must exist for ethical metrics");

      // First check for Ethical metrics, then for DMS and last for Exporter
      // Ethical Metrics package has DMS as dependency, so it will be installed automatically
      // DMS package has Exporter as dependency, so it will be installed automatically

      // Check ethical metrics pkg
      const ethicalMetricsPkg = await listPackageNoThrow({
        dnpName: ethicalMetricsDnpName
      });
      if (!ethicalMetricsPkg) {
        await packageInstall({
          name: ethicalMetricsDnpName
        });
      } else {
        // If the package is already installed, ensure it's running
        if (ethicalMetricsPkg.containers.some(c => !c.running))
          await dockerComposeUpPackage(
            { dnpName: ethicalMetricsDnpName },
            {},
            {},
            true
          );
      }

      // check dms package
      const dmsPkg = await listPackageNoThrow({ dnpName: dmsDnpName });
      if (!dmsPkg) {
        await packageInstall({ name: dmsDnpName });
      } else {
        // If the package is already installed, ensure it's running
        if (dmsPkg.containers.some(c => !c.running))
          await dockerComposeUpPackage({ dnpName: dmsDnpName }, {}, {}, true);
      }

      // check exporter pkg
      const exporterPkg = await listPackageNoThrow({
        dnpName: exporterDnpName
      });
      if (!exporterPkg) {
        await packageInstall({ name: exporterDnpName });
      } else {
        // If the package is already installed, ensure it's running
        if (exporterPkg.containers.some(c => !c.running))
          await dockerComposeUpPackage(
            { dnpName: exporterDnpName },
            {},
            {},
            true
          );
      }

      // Register instance
      const instance = await getInstance();
      await register({ instance, mail });
    }
  } catch (e) {
    logs.error("Error on ethical metrics check", e);
  }
}

/**

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
    params.ETH_METRICS_DAEMON_INTERVAL,
    signal
  );
}
