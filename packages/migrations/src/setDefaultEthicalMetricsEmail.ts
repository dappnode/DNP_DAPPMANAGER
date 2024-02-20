import { logs } from "@dappnode/logger";
import { listPackageNoThrow } from "@dappnode/dockerapi";
import { ethicalMetricsDnpName } from "@dappnode/ethicalmetrics";
import * as db from "@dappnode/db";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import { eventBus } from "@dappnode/eventbus";

/**
 * Gets the email env from the ethical metrics package (if exists) and sets it
 * as the defualt email in the db.
 *
 * It also sets the new feature ethical metrics notifications as seen if the email exist
 */
export async function setDefaultEthicalMetricsEmail(): Promise<void> {
  const apiContainerName = "tor-hidden-service";

  // skip migration if the feature is already seen
  if (db.newFeatureStatus.get("enable-ethical-metrics") === "seen") {
    logs.info(`Ethical metrics notifications already seen, skipping`);
    return;
  }

  // skip migration if the email env is already set and set feature as seen
  if (db.ethicalMetricsMail.get() || db.ethicalMetricsStatus.get()) {
    logs.info(`Ethical metrics already migrated, skipping`);
    logs.info(`Setting new feature ethical metrics notifications as seen`);
    db.newFeatureStatus.set("enable-ethical-metrics", "seen");
    // Notify the UI of the uiWelcomeStatus change
    eventBus.requestSystemInfo.emit();
    return;
  }

  // skip migration if the ethical metrics package is not installed
  if (
    !(await listPackageNoThrow({
      dnpName: ethicalMetricsDnpName
    }))
  ) {
    logs.info(
      `Ethical metrics package not found, skipping setting default email`
    );
    return;
  }

  const compose = new ComposeFileEditor(ethicalMetricsDnpName, false);
  const { environment } = compose.getUserSettings();
  // skip migration if the ethical metrics package doesn't have environment variables
  if (!environment) {
    logs.warn(
      `Ethical metrics package doesn't have environment variables, skipping setting default email`
    );
    return;
  }

  // skip migration if the ethical metrics package doesn't have environment variables for tor-hidden-service
  if (!environment[apiContainerName]) {
    logs.warn(
      `Ethical metrics package doesn't have environment variables for ${apiContainerName}, skipping setting default email`
    );
    return;
  }

  // skip migration if the ethical metrics package doesn't have EMAIL env
  if (!environment[apiContainerName].EMAIL) {
    logs.info(
      `Ethical metrics package doesn't have EMAIL env, skipping setting default email`
    );
    return;
  }

  const email = environment[apiContainerName].EMAIL;

  logs.info(`Setting default email to ${email}`);
  db.ethicalMetricsMail.set(email);

  logs.info(`Setting ethical metrics status to enabled`);
  db.ethicalMetricsStatus.set(true);

  logs.info(`Setting new feature ethical metrics notifications as seen`);
  db.newFeatureStatus.set("enable-ethical-metrics", "seen");
  // Notify the UI of the uiWelcomeStatus change
  eventBus.requestSystemInfo.emit();
}
