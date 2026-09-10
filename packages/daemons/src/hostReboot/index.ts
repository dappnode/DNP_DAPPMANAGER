import { logs } from "@dappnode/logger";
import { runAtMostEvery } from "@dappnode/utils";
import { notifications } from "@dappnode/notifications";
import { Category, Notification, Priority, Status } from "@dappnode/types";
import { getRebootRequiredMemoized } from "@dappnode/hostscriptsservices";
import { params } from "@dappnode/params";

const CHECK_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days
const BANNER_LOOKBACK_SECONDS = 30 * 24 * 60 * 60; // 30 days
const CORRELATION_ID = "core-reboot-required";

let notificationSent = false;

export function getLatestNotificationByCorrelationId(
  notificationList: Notification[],
  correlationId: string
): Notification | undefined {
  return notificationList
    .filter((notification) => notification.correlationId === correlationId && !notification.errors)
    .sort((a, b) => b.timestamp - a.timestamp)[0];
}

async function getLatestRebootBannerNotification(): Promise<Notification | undefined> {
  try {
    const { isNotifierRunning } = await notifications.notificationsPackageStatus();
    if (!isNotifierRunning) return undefined;

    const timestamp = Math.floor(Date.now() / 1000) - BANNER_LOOKBACK_SECONDS;
    const bannerNotifications = await notifications.getBannerNotifications(timestamp);
    return getLatestNotificationByCorrelationId(bannerNotifications, CORRELATION_ID);
  } catch (e) {
    logs.warn("Error getting previous host reboot banner notification", e);
    return undefined;
  }
}

/**
 * Monitors if the host requires a reboot.
 * Sends a notification if a reboot is required.
 * Sends a resolve notification once the reboot is no longer required.
 */
async function monitorHostReboot(): Promise<void> {
  try {
    const rebootRequired = await getRebootRequiredMemoized();
    const latestNotification = await getLatestRebootBannerNotification();
    const isRebootNotificationActive = latestNotification
      ? latestNotification.status === Status.triggered
      : notificationSent;

    if (rebootRequired?.rebootRequired) {
      logs.warn("Host reboot is required");

      if (!isRebootNotificationActive) {
        await notifications
          .sendNotification({
            title: "DAppNode host reboot required",
            dnpName: params.dappmanagerDnpName,
            body: `A reboot is required to install updates from some linux packages`,
            callToAction: {
              title: "Reboot",
              url: "http://my.dappnode/system/host"
            },
            category: Category.system,
            priority: Priority.low,
            status: Status.triggered,
            isBanner: true,
            isRemote: false,
            correlationId: CORRELATION_ID
          })
          .catch((e) => logs.error("Error sending host reboot notification", e));
      }
      notificationSent = true;
    } else {
      if (isRebootNotificationActive) {
        logs.info("Host reboot no longer required, sending resolve notification");

        await notifications
          .sendNotification({
            title: "Dappnode host reboot was successful",
            dnpName: params.dappmanagerDnpName,
            body: `All packages have been installed successfully.`,
            category: Category.system,
            priority: Priority.low,
            status: Status.resolved,
            isBanner: true,
            isRemote: false,
            correlationId: CORRELATION_ID
          })
          .catch((e) => logs.error("Error sending host reboot resolve notification", e));
      }
      notificationSent = false;
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
