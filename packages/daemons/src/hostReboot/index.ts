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
    const correlationId = "core-reboot-required";

    if (rebootRequired?.rebootRequired) {
      logs.warn("Host reboot is required");

      if (!notificationSent) {
        await notifications
          .sendNotification({
            title: "DAppNode host reboot required",
            dnpName: params.dappmanagerDnpName,
            body: `A reboot is required to install updates from some linux packages`,
            callToAction: {
              title: "Reboot",
              url: "http://my.dappnode/system/power"
            },
            category: Category.system,
            priority: Priority.low,
            status: Status.triggered,
            isBanner: true,
            isRemote: false,
            correlationId
          })
          .catch((e) => logs.error("Error sending host reboot notification", e));
        notificationSent = true;
      }
    } else {
      if (notificationSent) {
        logs.info("Host reboot no longer required, sending resolve notification");

        await notifications
          .sendNotification({
            title: "Dappnode host reboot was successful",
            dnpName: params.dappmanagerDnpName,
            body: `All packages have been installed successfully.`,
            category: Category.system,
            priority: Priority.low,
            status: Status.resolved,
            isBanner: false,
            isRemote: false,
            correlationId
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
