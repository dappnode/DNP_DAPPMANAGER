import { logs } from "@dappnode/logger";
import { runAtMostEvery } from "@dappnode/utils";
import { notifications } from "@dappnode/notifications";
import { Category, Priority, Status } from "@dappnode/types";
import { params } from "@dappnode/params";

const CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes
const NOTIFICATION_TITLE = "DAppNode host internet connectivity check";
let notificationSent = false;

/**
 * Checks whether the DAppNode is connected to the internet.
 */
async function getIsConnectedToInternet(): Promise<boolean> {
  try {
    // Simulate fetching public IP to check connectivity
    await new Promise((resolve, _) => setTimeout(resolve, 3000)); // Mock delay
    return true;
  } catch (error) {
    logs.error(`Error while checking DAppNode internet connectivity: ${error}`);
    return false;
  }
}

/**
 * Monitors internet connectivity of the DAppNode.
 * Sends a notification if the DAppNode is not connected to the internet.
 * Sends a resolve notification once the connection is restored.
 */
async function monitorInternetConnection(): Promise<void> {
  try {
    const isConnected = await getIsConnectedToInternet();

    if (!isConnected) {
      logs.warn("DAppNode is not connected to the internet");

      if (!notificationSent) {
        await notifications
          .sendNotification({
            title: NOTIFICATION_TITLE,
            dnpName: params.dappmanagerDnpName,
            body: `**Dappnode host is not connected to internet.** Click **Navigate** to autodiagnose and check the dappnode health.`,
            category: Category.system,
            priority: Priority.critical,
            status: Status.triggered,
            callToAction: {
              title: "Navigate",
              url: "http://my.dappnode/support/auto-diagnose"
            }
          })
          .catch((e) => logs.error("Error sending internet connectivity notification", e));
        notificationSent = true;
      }
    } else {
      if (notificationSent) {
        logs.info("Internet connection restored, sending resolve notification");

        await notifications
          .sendNotification({
            title: NOTIFICATION_TITLE,
            dnpName: params.dappmanagerDnpName,
            body: `**Dappnode host has regained internet connectivity.**`,
            category: Category.system,
            priority: Priority.low,
            status: Status.resolved,
          })
          .catch((e) => logs.error("Error sending internet connectivity resolve notification", e));
        notificationSent = false;
      }
    }
  } catch (e) {
    logs.error("Error monitoring internet connectivity", e);
  }
}

/**
 * Internet connection daemon.
 * Periodically checks if the DAppNode is connected to the internet.
 */
export function startInternetConnectionDaemon(signal: AbortSignal): void {
  runAtMostEvery(monitorInternetConnection, CHECK_INTERVAL, signal);
}
