import { logs } from "@dappnode/logger";
import { runAtMostEvery } from "@dappnode/utils";
import { notifications } from "@dappnode/notifications";
import { Category, Priority, Status } from "@dappnode/types";
import { getRebootRequiredMemoized } from "@dappnode/hostscriptsservices";
import { params } from "@dappnode/params";

const CHECK_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

let notificationSent = false;

/**
 * Monitors if the host requires a reboot.
 * Sends a notification if a reboot is required.
 * Sends a resolve notification once the reboot is no longer required.
 */
async function monitorHostReboot(): Promise<void> {
  try {
    const rebootRequired = await getRebootRequiredMemoized();

    if (rebootRequired?.rebootRequired) {
      logs.warn("Host reboot is required");

      if (!notificationSent) {
        await notifications
          .sendNotification({
            title: "DAppNode host reboot required",
            dnpName: params.dappmanagerDnpName,
            body: `**Dappnode host reboot required.** The following packages will be updated: ${rebootRequired.pkgs}. Click **Reboot** to apply the changes.`,
            callToAction: {
              title: "Reboot",
              url: "http://my.dappnode/system/power"
            },
            category: Category.system,
            priority: Priority.low,
            status: Status.triggered
          })
          .catch((e) => logs.error("Error sending host reboot notification", e));
        notificationSent = true;
      }
    } else {
      if (notificationSent) {
        logs.info("Host reboot no longer required, sending resolve notification");

        await notifications
          .sendNotification({
            title: "DAppNode host reboot no longer required",
            dnpName: params.dappmanagerDnpName,
            body: `**Dappnode host no longer requires a reboot.** All changes have been applied successfully.`,
            category: Category.system,
            priority: Priority.low,
            status: Status.resolved
          })
          .catch((e) => logs.error("Error sending host reboot resolve notification", e));
        notificationSent = false;
      }
    }
  } catch (e) {
    logs.error("Error monitoring host reboot requirement", e);
  }
}

/**
 * Host reboot daemon.
 * Periodically checks if the host requires a reboot.
 */
export function startHostRebootDaemon(signal: AbortSignal): void {
  runAtMostEvery(monitorHostReboot, CHECK_INTERVAL, signal);
}
