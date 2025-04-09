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
 * Get unseen notifications count
 */
export async function notificationsGetUnseenCount(): Promise<number> {
  return await notifications.getUnseenNotificationsCount();
}

/**
 * Get gatus and custom endpoints indexed by dnpName
 */
export async function notificationsGetAllEndpoints(): Promise<{
  [dnpName: string]: { endpoints: GatusEndpoint[]; customEndpoints: CustomEndpoint[]; isCore: boolean };
}> {
  return await notifications.getAllEndpoints();
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

/**
 * Joins new endpoints with previous ones
 */
export async function notificationsApplyPreviousEndpoints({
  dnpName,
  isCore,
  newNotificationsConfig
}: {
  dnpName: string;
  isCore: boolean;
  newNotificationsConfig: NotificationsConfig;
}): Promise<NotificationsConfig> {
  return await notifications.applyPreviousEndpoints(dnpName, isCore, newNotificationsConfig);
}
