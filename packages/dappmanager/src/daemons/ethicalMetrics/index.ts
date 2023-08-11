import * as db from "../../db/index.js";
import { eventBus } from "../../eventBus.js";
import params from "../../params.js";
import { runOnlyOneSequentially } from "../../utils/asyncFlows.js";
import { runAtMostEvery } from "../../utils/asyncFlows.js";
import { logs } from "../../logs.js";
import { packageInstall } from "../../calls/index.js";
import { listPackageNoThrow } from "../../modules/docker/list/listPackages.js";
import { dockerComposeUpPackage } from "../../modules/docker/index.js";

/**
 * Make sure that on Ethical metrics enabled and existing email,
 * the packages exporter, DMS and Ethical metrics are installed and running
 */
export async function runEthicalMetricsInstaller(email: string): Promise<void> {
  const exporterDnpName = "dappnode-exporter.dnp.dappnode.eth";
  const dmsDnpName = "dms.dnp.dappnode.eth";
  const ethicalMetricsDnpName = "ethical-metrics.dnp.dappnode.eth";

  // First check for Ethical metrics, then for DMS and last for Exporter
  // Ethical Metrics package has DMS as dependency, so it will be installed automatically
  // DMS package has Exporter as dependency, so it will be installed automatically

  const ethicalMetricsPkg = await listPackageNoThrow({
    dnpName: ethicalMetricsDnpName
  });
  if (!ethicalMetricsPkg) {
    await packageInstall({
      name: ethicalMetricsDnpName,
      userSettings: {
        ethicalMetricsDnpName: {
          environment: {
            "tor-hidden-service": {
              EMAIL: email
            }
          }
        }
      }
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

  const dmsPkg = await listPackageNoThrow({ dnpName: dmsDnpName });
  if (!dmsPkg) {
    await packageInstall({ name: dmsDnpName });
  } else {
    // If the package is already installed, ensure it's running
    if (dmsPkg.containers.some(c => !c.running))
      await dockerComposeUpPackage({ dnpName: dmsDnpName }, {}, {}, true);
  }

  const exporterPkg = await listPackageNoThrow({ dnpName: exporterDnpName });
  if (!exporterPkg) {
    await packageInstall({ name: exporterDnpName });
  } else {
    // If the package is already installed, ensure it's running
    if (exporterPkg.containers.some(c => !c.running))
      await dockerComposeUpPackage({ dnpName: exporterDnpName }, {}, {}, true);
  }
}

/**

 */
export function startEthicalMetricsDaemon(signal: AbortSignal): void {
  const runEthicalMetricsTaskMemo = runOnlyOneSequentially(
    async (email?: string) => {
      try {
        if (db.ethicalMetricsEnabled.get() !== true) {
          logs.debug("Ethical metrics are not enabled, skipping");
          return;
        }
        if (!email) {
          logs.debug("No email provided, skipping");
          return;
        }
        await runEthicalMetricsInstaller(email);
      } catch (e) {
        logs.error("Error on ethical metrics installer daemon", e);
      }
    }
  );

  // Subscribe with a throttle to run only one time at once
  eventBus.runEthicalMetricsInstaller.on(({ email }) =>
    runEthicalMetricsTaskMemo(email)
  );

  runAtMostEvery(
    async () => runEthicalMetricsTaskMemo(),
    params.AUTO_UPDATE_DAEMON_INTERVAL,
    signal
  );
}
