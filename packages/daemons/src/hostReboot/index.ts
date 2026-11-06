import { logs } from "@dappnode/logger";
import { runAtMostEvery } from "@dappnode/utils";
import { notifications } from "@dappnode/notifications";
import { Category, Notification, NotificationPayload, Priority, Status } from "@dappnode/types";
import { getRebootRequiredMemoized } from "@dappnode/hostscriptsservices";
import { params } from "@dappnode/params";

import { getKernelMitigationNotification, KERNEL_MITIGATION_CORRELATION_ID } from "./kernelMitigationNotification.js";

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const BANNER_LOOKBACK_SECONDS = 30 * 24 * 60 * 60; // 30 days
const CORRELATION_ID = "core-reboot-required";

let notificationSent = false;
let lastKernelNotification: NotificationPayload | undefined;

export function getLatestNotificationByCorrelationId(
  notificationList: Notification[],
  correlationId: string
): Notification | undefined {
  return notificationList
    .filter((notification) => notification.correlationId === correlationId && !notification.errors)
    .sort((a, b) => b.timestamp - a.timestamp)[0];
}

async function getLatestRebootBannerNotification(correlationId = CORRELATION_ID): Promise<Notification | undefined> {
  try {
    const { isNotifierRunning } = await notifications.notificationsPackageStatus();
    if (!isNotifierRunning) return undefined;

    const timestamp = Math.floor(Date.now() / 1000) - BANNER_LOOKBACK_SECONDS;
    const bannerNotifications = await notifications.getBannerNotifications(timestamp);
    return getLatestNotificationByCorrelationId(bannerNotifications, correlationId);
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
    if (rebootRequired.kernelSecurityMitigation) {
      const previous = await getLatestRebootBannerNotification(KERNEL_MITIGATION_CORRELATION_ID);
      const securityNotification = getKernelMitigationNotification(
        rebootRequired.kernelSecurityMitigation,
        params.dappmanagerDnpName,
        previous ?? lastKernelNotification
      );
      if (securityNotification) {
        await notifications.sendNotification(securityNotification);
        lastKernelNotification = securityNotification;
      }
    }
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
            body: `The host no longer reports a pending reboot. This does not verify individual security fixes.`,
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
