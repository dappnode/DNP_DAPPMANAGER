import { logs } from "@dappnode/logger";
import { runAtMostEvery } from "@dappnode/utils";
import { notifications } from "@dappnode/notifications";
import { Category, Priority, Status } from "@dappnode/types";
import { params } from "@dappnode/params";
import { promises as dns } from "dns";

const CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes
let internetFailureCount = 0;
let internetNotificationSent = false;

/**
 * Checks whether the DAppNode is connected to the internet.
 */
async function getIsConnectedToInternet(): Promise<boolean> {
  try {
    await dns.resolve("google.com");
    return true;
  } catch (error) {
    logs.info(`Error while resolving DNS for internet connectivity: ${error}`);
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
    const correlationId = "core-internet-connection";

    if (!isConnected) {
      logs.warn("DAppNode is not connected to the internet");

      // increment failure count and only notify after threshold
      internetFailureCount += 1;
      if (internetFailureCount >= 5 && !internetNotificationSent) {
        await notifications
          .sendNotification({
            title: "Your Dappnode is not connected to internet",
            dnpName: params.dappmanagerDnpName,
            body: `Your DAppNode host machine is currently offline and cannot access the internet. This may disrupt the operation of your nodes and prevent updates or remote access.
                   Please check your network connection and ensure your router or modem is functioning properly.`,
            category: Category.system,
            priority: Priority.critical,
            status: Status.triggered,
            callToAction: {
              title: "Diagnose",
              url: "http://my.dappnode/support/auto-diagnose"
            },
            isBanner: true,
            isRemote: false,
            correlationId
          })
          .catch((e) => logs.error("Error sending internet connectivity notification", e));
        internetNotificationSent = true;
      }
    } else {
      // reset on success
      internetFailureCount = 0;
      if (internetNotificationSent) {
        logs.info("Internet connection restored, sending resolve notification");

        await notifications
          .sendNotification({
            title: "Your Dappnode is back online",
            dnpName: params.dappmanagerDnpName,
            body: `Your Dappnode connection is functioning properly`,
            category: Category.system,
            priority: Priority.critical,
            status: Status.resolved,
            isBanner: false,
            isRemote: false,
            correlationId
          })
          .catch((e) => logs.error("Error sending internet connectivity resolve notification", e));
        internetNotificationSent = false;
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
