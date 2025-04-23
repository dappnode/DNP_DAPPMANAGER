import { notifications } from "@dappnode/notifications";
import { CustomEndpoint, GatusEndpoint, Notification, NotificationsConfig } from "@dappnode/types";
import * as db from "@dappnode/db";

/**
 * Get the notifications config
 * @returns the if notifications are enabled
 */
export async function notificationsGetStatus(): Promise<boolean | null> {
  return db.notificationsEnabled.get();
}

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
 * Set all notifications as seen
 */
export async function notificationsSetAllSeen(): Promise<void> {
  return await notifications.setAllNotificationsSeen();
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
