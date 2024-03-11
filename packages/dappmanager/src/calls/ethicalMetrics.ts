import { EthicalMetricsConfig } from "@dappnode/types";
import { eventBus } from "@dappnode/eventbus";
import { listPackageNoThrow } from "@dappnode/dockerapi";
import { packageRestart } from "./packageRestart.js";
import * as db from "@dappnode/db";
import { packageInstall } from "./packageInstall.js";
import { logs } from "@dappnode/logger";
import {
  ethicalMetricsDnpName,
  register,
  unregister
} from "@dappnode/ethicalmetrics";
import { dockerContainerStart, dockerContainerStop } from "@dappnode/dockerapi";

/**
 * Disables ethical metrics if enabled:
 * - unregisters instance
 * - stops package
 */
export async function disableEthicalMetrics(): Promise<void> {
  // disable ethical metrics in db for installer daemon
  db.ethicalMetrics.set({
    mail: null,
    tgChannelId: null,
    enabled: false
  });

  // Unregister instance
  await unregister().catch(() => {
    logs.error("Error unregistering ethical metrics instance");
  });

  // Stop package
  const ethicalMetricsPkg = await listPackageNoThrow({
    dnpName: ethicalMetricsDnpName
  });
  if (ethicalMetricsPkg)
    for (const container of ethicalMetricsPkg.containers)
      if (container.running) await dockerContainerStop(container.containerName);
}

/**
 * Enables ethical metrics if not enabled:
 * - triggers installer if not installed
 * - restarts package if not running
 * @param email email used to register the instance
 * @param tgChannelId telegram channel id to send notifications
 * @param sync whether to wait for the installer to finish or not
 */
export async function enableEthicalMetrics({
  mail,
  tgChannelId,
  sync
}: {
  mail: string | null;
  tgChannelId: string | null;
  sync: boolean;
}): Promise<void> {
  if (!mail && !tgChannelId)
    throw new Error("You must provide an email or a telegram channel id");

  db.ethicalMetrics.set({
    mail,
    tgChannelId,
    enabled: true
  });

  const ethicalMetricsPkg = await listPackageNoThrow({
    dnpName: ethicalMetricsDnpName
  });

  if (!ethicalMetricsPkg) {
    if (sync) await packageInstall({ name: ethicalMetricsDnpName });
    else eventBus.runEthicalMetricsInstaller.emit();
  } else {
    // Make sure pkg is running
    for (const container of ethicalMetricsPkg.containers)
      if (!container.running)
        await dockerContainerStart(container.containerName);

    if (ethicalMetricsPkg.containers.some(c => c.state !== "running"))
      await packageRestart({ dnpName: ethicalMetricsPkg.dnpName });

    // Make sure the instance is registered
    await register({
      mail,
      tgChannelId
    });
  }
}

/**
 * Returns the Ethical Metrics config:
 *
 * - isEnabled: weather the ethical metrics notifications are enabled or not
 * - email: the email used to register the instance
 */
export async function getEthicalMetricsConfig(): Promise<EthicalMetricsConfig | null> {
  return db.ethicalMetrics.get();
}
