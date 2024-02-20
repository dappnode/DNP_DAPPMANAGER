import { logs } from "@dappnode/logger";
import { DappnodeInstaller, packageInstall } from "@dappnode/installer";
import { dockerContainerStart, listPackageNoThrow } from "@dappnode/dockerapi";
import * as db from "@dappnode/db";
import { ethicalMetricsDnpName, register } from "@dappnode/ethicalmetrics";
import { InstalledPackageData } from "@dappnode/types";

/**
 * Make sure that on Ethical metrics enabled and existing email,
 * the packages exporter, DMS and Ethical metrics are installed and running
 */
export async function checkEthicalMetricsStatus(
  dappnodeInstaller: DappnodeInstaller
): Promise<void> {
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
        dnpName: ethicalMetricsDnpName,
      });
      if (!ethicalMetricsPkg) {
        await packageInstall(dappnodeInstaller, {
          name: ethicalMetricsDnpName,
        });
      } else {
        ensureAllContainersRunning(ethicalMetricsPkg);
      }

      // check dms package
      const dmsPkg = await listPackageNoThrow({ dnpName: dmsDnpName });
      if (!dmsPkg) {
        await packageInstall(dappnodeInstaller, { name: dmsDnpName });
      } else {
        ensureAllContainersRunning(dmsPkg);
      }

      // check exporter pkg
      const exporterPkg = await listPackageNoThrow({
        dnpName: exporterDnpName,
      });
      if (!exporterPkg) {
        await packageInstall(dappnodeInstaller, { name: exporterDnpName });
      } else {
        ensureAllContainersRunning(exporterPkg);
      }

      // Register instance
      await register({ mail });
    }
  } catch (e) {
    logs.error("Error on ethical metrics check", e);
  }
}

async function ensureAllContainersRunning(
  pkg: InstalledPackageData
): Promise<void> {
  for (const container of pkg.containers) {
    if (!container.running) {
      await dockerContainerStart(container.containerName);
    }
  }
}
