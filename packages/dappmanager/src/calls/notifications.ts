import { notifications } from "@dappnode/notifications";
import { CustomEndpoint, GatusEndpoint, Notification, NotificationsConfig } from "@dappnode/types";

/**
 * Get all the notifications
 * @returns all the notifications
 */
export async function notificationsGetAll(): Promise<Notification[]> {
  return await notifications.getAllNotifications();
}

/**
 * Get gatus and custom endpoints indexed by dnpName
 */
export async function notificationsGetEndpoints(): Promise<{
  [dnpName: string]: { endpoints: GatusEndpoint[]; customEndpoints: CustomEndpoint[] };
}> {
  return await notifications.getEndpoints();
}

/**
 * Update endpoint properties
 */
export async function notificationsUpdateEndpoints({
  dnpName,
  isCore,
  notificationsConfig
}: {
  dnpName: string;
  isCore: boolean;
  notificationsConfig: NotificationsConfig;
}): Promise<void> {
  await notifications.updateEndpoints(dnpName, isCore, notificationsConfig);
}
